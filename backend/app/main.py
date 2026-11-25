from pathlib import Path
from datetime import datetime, timezone
from math import radians, sin, cos, sqrt, atan2
import sqlite3
import uuid
import shutil

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .vision import detect_issue

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

CATEGORIES = {"pothole", "garbage", "waterlogging", "streetlight", "road_damage"}
STATUSES = {"reported", "assigned", "in_progress", "resolved", "rejected"}

app = FastAPI(title="CIVISENSE API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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
def root():
    return {"name": "CIVISENSE API", "docs": "/docs", "health": "ok"}


@app.get("/api/reports")
def list_reports():
    with connect() as con:
        rows = con.execute("SELECT * FROM reports ORDER BY created_at DESC").fetchall()
    return [row_to_dict(r) for r in rows]


@app.post("/api/reports")
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


@app.get("/api/health")
def health():
    return {"status": "ok", "database": "sqlite"}
