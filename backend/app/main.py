import base64
import time
import asyncio
from pathlib import Path
from datetime import datetime, timezone
from math import radians, sin, cos, sqrt, atan2
import sqlite3
import uuid
import shutil

import cv2
import numpy as np
from fastapi import (
    FastAPI,
    UploadFile,
    File,
    Form,
    HTTPException,
    Query,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .vision import (
    detect_issue,
    detect_all,
    detect_objects,
    draw_detections,
    DetectionTracker,
    pothole_model,
    waterlogging_model,
    garbage_model,
    DEVICE,
    CONFIDENCE_THRESHOLD,
    WATERLOGGING_CONFIDENCE_THRESHOLD,
    GARBAGE_CONFIDENCE_THRESHOLD,
    normalize_garbage_name,
    inference_lock,
)

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
DB_PATH = DATA_DIR / "civisense.db"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Seamless migration if roadguard.db exists
OLD_DB = DATA_DIR / "roadguard.db"
if not DB_PATH.exists() and OLD_DB.exists():
    import shutil
    shutil.copyfile(OLD_DB, DB_PATH)

CATEGORIES = {"pothole", "garbage", "waterlogging"}
STATUSES = {"reported", "assigned", "in_progress", "resolved", "rejected"}

app = FastAPI(title="CIVISENSE API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


def connect():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con


def init_db():
    with connect() as con:
        con.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id TEXT PRIMARY KEY,
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            severity INTEGER NOT NULL,
            status TEXT NOT NULL,
            image_name TEXT,
            created_at TEXT NOT NULL,
            duplicate_of TEXT
        )
        """)


init_db()


def distance_m(lat1, lon1, lat2, lon2):
    radius = 6371000
    dlat, dlon = radians(lat2-lat1), radians(lon2-lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1))*cos(radians(lat2))*sin(dlon/2)**2
    return 2 * radius * atan2(sqrt(a), sqrt(1-a))


def row_to_dict(row):
    item = dict(row)
    item["image_url"] = f"http://127.0.0.1:8000/uploads/{item['image_name']}" if item["image_name"] else None
    return item


class StatusUpdate(BaseModel):
    status: str


@app.get("/")
@app.get("/api")
def root():
    return {"name": "CIVISENSE API", "docs": "/docs", "health": "ok"}


@app.get("/api/reports")
@app.get("/reports")
def list_reports():
    with connect() as con:
        rows = con.execute("SELECT * FROM reports ORDER BY created_at DESC").fetchall()
    return [row_to_dict(r) for r in rows]


@app.post("/api/reports")
@app.post("/reports")
async def create_report(
    category: str = Form(...),
    description: str = Form(""),
    latitude: float = Form(...),
    longitude: float = Form(...),
    severity: int = Form(3),
    photo: UploadFile = File(None)
):
    category = category.strip().lower()
    if category not in CATEGORIES:
        raise HTTPException(400, f"category must be one of: {', '.join(sorted(CATEGORIES))}")
    if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
        raise HTTPException(400, "Invalid GPS coordinates.")
    if not (1 <= severity <= 5):
        raise HTTPException(400, "Severity must be between 1 and 5.")

    report_id = str(uuid.uuid4())
    image_name = None
    target = None
    if photo and photo.filename:
        suffix = Path(photo.filename).suffix.lower()
        if suffix not in {".jpg", ".jpeg", ".png", ".webp"}:
            suffix = ".jpg"
        image_name = f"{report_id}{suffix}"
        target = UPLOAD_DIR / image_name
        with target.open("wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)

    # Duplicate heuristic: same category within 40 metres. Admin must verify.
    duplicate_of = None
    with connect() as con:
        existing = con.execute(
            "SELECT id, latitude, longitude FROM reports WHERE category = ?",
            (category,)
        ).fetchall()
        for item in existing:
            if distance_m(latitude, longitude, item["latitude"], item["longitude"]) <= 40:
                duplicate_of = item["id"]
                break

    clean_description = description.strip() or (
        f"Citizen reported a {category.replace('_', ' ')} issue near "
        f"coordinates {latitude:.5f}, {longitude:.5f}. Please inspect and verify."
    )
    now = datetime.now(timezone.utc).isoformat()
    with connect() as con:
        con.execute("""
            INSERT INTO reports
            (id, category, description, latitude, longitude, severity, status,
             image_name, created_at, duplicate_of)
            VALUES (?, ?, ?, ?, ?, ?, 'reported', ?, ?, ?)
        """, (report_id, category, clean_description, latitude, longitude,
              severity, image_name, now, duplicate_of))
        row = con.execute("SELECT * FROM reports WHERE id = ?", (report_id,)).fetchone()

    return {
        "report": row_to_dict(row),
        "duplicate_warning": duplicate_of is not None,
        "duplicate_of": duplicate_of,
        "ai_detection": detect_issue(str(target)) if (target is not None) else {"status": "no_image"}
    }


@app.patch("/api/reports/{report_id}/status")
@app.patch("/reports/{report_id}/status")
def update_status(report_id: str, payload: StatusUpdate):
    if payload.status not in STATUSES:
        raise HTTPException(400, f"status must be one of: {', '.join(sorted(STATUSES))}")
    with connect() as con:
        cur = con.execute(
            "UPDATE reports SET status = ? WHERE id = ?",
            (payload.status, report_id)
        )
        if cur.rowcount == 0:
            raise HTTPException(404, "Report not found.")
        row = con.execute("SELECT * FROM reports WHERE id = ?", (report_id,)).fetchone()
    return row_to_dict(row)


@app.post("/api/detect/image")
@app.post("/detect/image")
async def detect_uploaded_image(
    file: UploadFile = File(...),
    model: str = Query(
        default="all",
        description="Choose pothole, waterlogging, garbage, or all",
    ),
):
    selected = model.strip().lower()
    if selected not in {"pothole", "waterlogging", "garbage", "both", "all"}:
        raise HTTPException(
            status_code=400,
            detail="model must be pothole, waterlogging, garbage, both, or all",
        )

    content_type = (file.content_type or "").lower()
    filename = (file.filename or "").lower()
    valid_exts = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
    is_valid_image = content_type.startswith("image/") or any(filename.endswith(ext) for ext in valid_exts)
    if not is_valid_image:
        raise HTTPException(
            status_code=415,
            detail="Please upload an image file (JPEG, PNG, WebP)",
        )

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty",
        )

    if len(image_bytes) > 12 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Image exceeds 12 MB limit",
        )

    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    frame = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    if frame is None:
        raise HTTPException(
            status_code=400,
            detail="Could not decode the uploaded image",
        )

    try:
        potholes = []
        waterlogging = []
        garbage = []

        if selected == "pothole":
            with inference_lock:
                potholes = detect_objects(frame, pothole_model, conf=CONFIDENCE_THRESHOLD)
        elif selected == "waterlogging":
            with inference_lock:
                waterlogging = detect_objects(
                    frame,
                    waterlogging_model,
                    conf=WATERLOGGING_CONFIDENCE_THRESHOLD,
                    max_area_ratio=0.70,
                )
        elif selected == "garbage":
            with inference_lock:
                garbage = detect_objects(
                    frame,
                    garbage_model,
                    conf=GARBAGE_CONFIDENCE_THRESHOLD,
                    normalize_fn=normalize_garbage_name,
                )
        else:
            potholes, waterlogging, garbage = detect_all(frame)

        annotated = frame.copy()
        annotated = draw_detections(annotated, potholes, (255, 130, 0))  # Blue-ish
        annotated = draw_detections(annotated, waterlogging, (0, 180, 245))  # Amber
        annotated = draw_detections(annotated, garbage, (0, 220, 120))  # Emerald Green

        success, encoded = cv2.imencode(".jpg", annotated)
        if not success:
            raise RuntimeError("Could not encode annotated image")

        annotated_data_url = (
            "data:image/jpeg;base64,"
            + base64.b64encode(encoded.tobytes()).decode("ascii")
        )

        all_detections = potholes + waterlogging + garbage
        all_detections.sort(key=lambda d: d["confidence"], reverse=True)

        if all_detections:
            top_category = all_detections[0]["class"]
            top_conf = all_detections[0]["confidence"]
        else:
            top_category = "none"
            top_conf = 0.0

        # Calculate suggested severity
        if not all_detections:
            suggested_severity = 1
        elif top_conf > 0.85 or (potholes and len(potholes) >= 3) or (garbage and len(garbage) >= 3):
            suggested_severity = 5
        elif top_conf > 0.65 or len(all_detections) >= 2:
            suggested_severity = 4
        elif top_conf > 0.35:
            suggested_severity = 3
        else:
            suggested_severity = 2

        # AI complaint description
        if top_category == "pothole" and potholes:
            ai_desc = (
                f"Automated Computer Vision & GIS Triage: Pothole defect identified with "
                f"{top_conf * 100:.1f}% confidence ({len(potholes)} defect(s) detected). "
                f"Assessed hazard severity: {suggested_severity}/5. Immediate asphalt patching requested."
            )
        elif top_category == "waterlogging" and waterlogging:
            ai_desc = (
                f"Automated Computer Vision & GIS Triage: Stormwater waterlogging identified with "
                f"{top_conf * 100:.1f}% confidence ({len(waterlogging)} pooling zone(s) detected). "
                f"Assessed severity: {suggested_severity}/5. Culvert dewatering requested."
            )
        elif top_category == "garbage" and garbage:
            ai_desc = (
                f"Automated Computer Vision & GIS Triage: Solid waste/garbage accumulation identified with "
                f"{top_conf * 100:.1f}% confidence ({len(garbage)} waste item(s) detected). "
                f"Assessed severity: {suggested_severity}/5. Routed to municipal sanitation squad."
            )
        else:
            ai_desc = "Automated Computer Vision: No defects detected with current threshold. Standard civic inspection recommended."

        return {
            "success": True,
            "selected_model": selected,
            "image_width": int(frame.shape[1]),
            "image_height": int(frame.shape[0]),
            "detections": all_detections,
            "pothole_detections": potholes,
            "pothole_count": len(potholes),
            "waterlogging_detections": waterlogging,
            "waterlogging_count": len(waterlogging),
            "garbage_detections": garbage,
            "garbage_count": len(garbage),
            "top_category": top_category,
            "top_confidence": top_conf,
            "suggested_severity": suggested_severity,
            "ai_description": ai_desc,
            "annotated_image": annotated_data_url,
        }
    finally:
        await file.close()


@app.websocket("/ws")
async def live_detection(websocket: WebSocket):
    await websocket.accept()

    pothole_tracker = DetectionTracker()
    waterlogging_tracker = DetectionTracker()
    garbage_tracker = DetectionTracker()

    try:
        while True:
            image_bytes = await websocket.receive_bytes()
            if not image_bytes:
                continue

            if len(image_bytes) > 8 * 1024 * 1024:
                await websocket.send_json({"error": "Image exceeds 8 MB limit"})
                continue

            image_array = np.frombuffer(image_bytes, dtype=np.uint8)
            frame = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

            if frame is None:
                await websocket.send_json({"error": "Invalid image frame"})
                continue

            try:
                raw_potholes, raw_waterlogging, raw_garbage = await asyncio.to_thread(
                    detect_all, frame
                )

                pothole_detections = pothole_tracker.update(raw_potholes)
                waterlogging_detections = waterlogging_tracker.update(raw_waterlogging)
                garbage_detections = garbage_tracker.update(raw_garbage)

                all_confirmed = (
                    pothole_detections
                    + waterlogging_detections
                    + garbage_detections
                )

                await websocket.send_json({
                    "detections": all_confirmed,
                    "count": len(all_confirmed),
                    "raw_count": len(raw_potholes) + len(raw_waterlogging) + len(raw_garbage),
                    "pothole_detections": pothole_detections,
                    "pothole_count": len(pothole_detections),
                    "waterlogging_detections": waterlogging_detections,
                    "waterlogging_count": len(waterlogging_detections),
                    "garbage_detections": garbage_detections,
                    "garbage_count": len(garbage_detections),
                    "timestamp": time.time(),
                })
            except Exception:
                await websocket.send_json({"error": "Detection failed"})

    except WebSocketDisconnect:
        pass
    except Exception:
        try:
            await websocket.close(code=1011)
        except Exception:
            pass


@app.get("/api/health")
@app.get("/health")
def health():
    return {
        "status": "online",
        "service": "civisense-roadguard-backend",
        "database": "sqlite",
        "models": {
            "pothole": {"loaded": pothole_model is not None, "type": "custom-yolo11"},
            "waterlogging": {"loaded": waterlogging_model is not None, "type": "custom-yolo11"},
            "garbage": {"loaded": garbage_model is not None, "type": "open-vocab-yolo-world"},
        },
        "device": DEVICE,
    }
