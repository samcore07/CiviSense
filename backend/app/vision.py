import os
import logging
import threading
from pathlib import Path
from math import sqrt

import cv2
import numpy as np
import torch
from ultralytics import YOLO

logger = logging.getLogger("CIVISENSE.Vision")

BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"

POTHOLE_PATH = MODELS_DIR / "pothole.pt"
WATERLOGGING_PATH = MODELS_DIR / "waterlogging.pt"
GARBAGE_PATH = MODELS_DIR / "garbage.pt"

# Fallback paths from CIVISENSE_SHARE if needed
if not POTHOLE_PATH.is_file():
    alt = Path("/Users/samriddha/Downloads/CIVISENSE_SHARE/ai-model/runs/detect/outputs/civisense_yolo11n/weights/best.pt")
    if alt.is_file():
        POTHOLE_PATH = alt

if not WATERLOGGING_PATH.is_file():
    alt = Path("/Users/samriddha/Downloads/CIVISENSE_SHARE/ai-model/runs/detect/runs/CiviSense/waterlogging_only_v1-3/weights/best.pt")
    if alt.is_file():
        WATERLOGGING_PATH = alt

if not GARBAGE_PATH.is_file():
    alt = Path("/Users/samriddha/Downloads/CIVISENSE_SHARE/yolov8s-worldv2.pt")
    if alt.is_file():
        GARBAGE_PATH = alt

DEVICE = "mps" if torch.backends.mps.is_available() else "cpu"
CONFIDENCE_THRESHOLD = 0.50
WATERLOGGING_CONFIDENCE_THRESHOLD = 0.70
GARBAGE_CONFIDENCE_THRESHOLD = 0.15
IOU_THRESHOLD = 0.45
IMAGE_SIZE = 640
MAX_DETECTIONS = 20

GARBAGE_CLASSES = [
    "garbage",
    "trash",
    "waste",
    "garbage bags",
    "trash bags",
    "black bag",
    "waste bag",
    "plastic bag",
    "trash can",
    "trash bin",
    "waste bin",
    "dustbin",
    "bin",
    "litter",
    "dumped waste",
    "rubbish",
    "plastic waste",
    "waste container",
]

pothole_model = None
waterlogging_model = None
garbage_model = None
inference_lock = threading.Lock()


def load_models():
    global pothole_model, waterlogging_model, garbage_model
    if pothole_model is not None:
        return True

    try:
        logger.info("Initializing CIVISENSE Vision Engine on %s...", DEVICE)
        if POTHOLE_PATH.is_file():
            pothole_model = YOLO(str(POTHOLE_PATH))
            logger.info("Pothole YOLO11 loaded: %s", pothole_model.names)

        if WATERLOGGING_PATH.is_file():
            waterlogging_model = YOLO(str(WATERLOGGING_PATH))
            logger.info("Waterlogging YOLO11 loaded: %s", waterlogging_model.names)

        if GARBAGE_PATH.is_file():
            garbage_model = YOLO(str(GARBAGE_PATH))
            logger.info("Garbage model loaded: %s", garbage_model.names)

        return True
    except Exception:
        logger.exception("Failed to initialize vision models")
        return False


# Auto-load on import
load_models()


def normalize_garbage_name(name: str) -> str:
    return "garbage"


def detect_objects(frame, selected_model, conf=None, normalize_fn=None, max_area_ratio=0.75):
    if selected_model is None or frame is None or frame.size == 0:
        return []

    if conf is None:
        conf = CONFIDENCE_THRESHOLD

    height, width = frame.shape[:2]

    results = selected_model.predict(
        source=frame,
        imgsz=IMAGE_SIZE,
        conf=conf,
        iou=IOU_THRESHOLD,
        device=DEVICE,
        max_det=MAX_DETECTIONS,
        verbose=False,
    )

    result = results[0]
    detections = []

    if result.boxes is None:
        return detections

    for box in result.boxes:
        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().tolist()
        confidence = float(box.conf[0].cpu().item())
        class_id = int(box.cls[0].cpu().item())

        if confidence < conf:
            continue

        box_w_ratio = (x2 - x1) / width
        box_h_ratio = (y2 - y1) / height
        # Filter out degenerate full-frame false-positives
        if max_area_ratio and (box_w_ratio * box_h_ratio > max_area_ratio or (box_w_ratio > 0.85 and box_h_ratio > 0.78)):
            continue

        raw_name = str(selected_model.names.get(class_id, class_id))
        display_name = normalize_fn(raw_name) if normalize_fn else raw_name

        detections.append({
            "class": display_name,
            "raw_class": raw_name,
            "class_id": class_id,
            "confidence": round(confidence, 3),
            "x1": float(x1 / width),
            "y1": float(y1 / height),
            "x2": float(x2 / width),
            "y2": float(y2 / height),
            "box_pixels": [int(x1), int(y1), int(x2), int(y2)],
        })

    return detections


def detect_all(frame):
    with inference_lock:
        potholes = detect_objects(frame, pothole_model, conf=CONFIDENCE_THRESHOLD)
        waterlogging = detect_objects(
            frame,
            waterlogging_model,
            conf=WATERLOGGING_CONFIDENCE_THRESHOLD,
            max_area_ratio=0.70
        )
        garbage = detect_objects(
            frame,
            garbage_model,
            conf=GARBAGE_CONFIDENCE_THRESHOLD,
            normalize_fn=normalize_garbage_name,
        )
    return potholes, waterlogging, garbage


def draw_detections(frame, detections, color):
    output = frame.copy()
    height, width = output.shape[:2]

    for d in detections:
        x1 = int(d["x1"] * width)
        y1 = int(d["y1"] * height)
        x2 = int(d["x2"] * width)
        y2 = int(d["y2"] * height)

        label = f"{d['class'].upper()} {d['confidence'] * 100:.1f}%"
        cv2.rectangle(output, (x1, y1), (x2, y2), color, 2)

        # Label background
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
        top_y = max(24, y1)
        cv2.rectangle(output, (x1, top_y - 20), (x1 + tw + 8, top_y + 4), color, -1)
        cv2.putText(
            output,
            label,
            (x1 + 4, top_y - 4),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (255, 255, 255),
            2,
            cv2.LINE_AA,
        )

    return output


def calculate_iou(box_a, box_b):
    x_left = max(box_a["x1"], box_b["x1"])
    y_top = max(box_a["y1"], box_b["y1"])
    x_right = min(box_a["x2"], box_b["x2"])
    y_bottom = min(box_a["y2"], box_b["y2"])

    intersection_width = max(0, x_right - x_left)
    intersection_height = max(0, y_bottom - y_top)
    intersection = intersection_width * intersection_height

    area_a = (box_a["x2"] - box_a["x1"]) * (box_a["y2"] - box_a["y1"])
    area_b = (box_b["x2"] - box_b["x1"]) * (box_b["y2"] - box_b["y1"])
    union = area_a + area_b - intersection

    return intersection / union if union > 0 else 0.0


class DetectionTracker:
    def __init__(self, iou_thresh=0.35, confirm_hits=3, max_misses=1):
        self.tracks = []
        self.next_id = 1
        self.iou_thresh = iou_thresh
        self.confirm_hits = confirm_hits
        self.max_misses = max_misses

    def update(self, detections):
        if not self.tracks:
            for d in detections:
                self.tracks.append({
                    "id": self.next_id,
                    "box": d,
                    "hits": 1,
                    "misses": 0,
                })
                self.next_id += 1
            return []

        candidates = []
        for t_idx, track in enumerate(self.tracks):
            for d_idx, d in enumerate(detections):
                overlap = calculate_iou(track["box"], d)
                if overlap >= self.iou_thresh:
                    candidates.append((overlap, t_idx, d_idx))

        candidates.sort(reverse=True)
        matched_tracks = set()
        matched_detections = set()

        for _, t_idx, d_idx in candidates:
            if t_idx in matched_tracks or d_idx in matched_detections:
                continue
            track = self.tracks[t_idx]
            track["box"] = detections[d_idx]
            track["hits"] += 1
            track["misses"] = 0
            matched_tracks.add(t_idx)
            matched_detections.add(d_idx)

        for idx, track in enumerate(self.tracks):
            if idx not in matched_tracks:
                track["misses"] += 1

        self.tracks = [t for t in self.tracks if t["misses"] <= self.max_misses]

        for d_idx, d in enumerate(detections):
            if d_idx not in matched_detections:
                self.tracks.append({
                    "id": self.next_id,
                    "box": d,
                    "hits": 1,
                    "misses": 0,
                })
                self.next_id += 1

        confirmed = []
        for track in self.tracks:
            if track["hits"] >= self.confirm_hits and track["misses"] == 0:
                item = dict(track["box"])
                item["track_id"] = track["id"]
                confirmed.append(item)

        return confirmed


def detect_issue(image_path: str) -> dict:
    """
    Called by RoadGuard report creation when a photo is attached.
    """
    path = Path(image_path)
    if not path.is_file():
        return {
            "status": "not_found",
            "category": "pothole",
            "severity": 3,
            "confidence": 0.0,
            "detections": [],
            "message": "Image file not found.",
        }

    frame = cv2.imread(str(path))
    if frame is None:
        return {
            "status": "decode_error",
            "category": "pothole",
            "severity": 3,
            "confidence": 0.0,
            "detections": [],
            "message": "Could not decode image for AI inference.",
        }

    potholes, waterlogging, garbage = detect_all(frame)
    all_detections = potholes + waterlogging + garbage

    if not all_detections:
        return {
            "status": "no_defect_detected",
            "category": "pothole",
            "severity": 2,
            "confidence": 0.0,
            "detections": [],
            "message": "No defects exceeding confidence thresholds detected.",
        }

    # Sort by confidence descending
    all_detections.sort(key=lambda d: d["confidence"], reverse=True)
    top = all_detections[0]
    category = top["class"]
    confidence = top["confidence"]

    # Calculate severity based on box size relative to frame + confidence
    box_area = (top["x2"] - top["x1"]) * (top["y2"] - top["y1"])
    if box_area > 0.15 or confidence > 0.85:
        severity = 5
    elif box_area > 0.08 or confidence > 0.75:
        severity = 4
    elif box_area > 0.03 or confidence > 0.60:
        severity = 3
    else:
        severity = 2

    # Synthesize description
    if category == "pothole":
        desc = (
            f"Automated Computer Vision: Pothole defect verified with "
            f"{confidence * 100:.1f}% confidence. Assessed severity level: {severity}/5. "
            f"Immediate cold-mix asphalt patch dispatch recommended."
        )
    elif category == "waterlogging":
        desc = (
            f"Automated Computer Vision: Severe stormwater/waterlogging verified with "
            f"{confidence * 100:.1f}% confidence. Assessed severity level: {severity}/5. "
            f"Drainage suction dewatering pump required."
        )
    else:
        desc = (
            f"Automated Computer Vision: Solid waste/garbage accumulation verified with "
            f"{confidence * 100:.1f}% confidence. Assessed severity level: {severity}/5. "
            f"Work order queued for municipal sanitation squad."
        )

    return {
        "status": "completed",
        "category": category,
        "severity": severity,
        "confidence": confidence,
        "detections": all_detections,
        "pothole_count": len(potholes),
        "waterlogging_count": len(waterlogging),
        "garbage_count": len(garbage),
        "description": desc,
        "message": f"Verified {category.upper()} with {confidence * 100:.1f}% confidence.",
    }
