"""
Computer-vision adapter.

Do not claim that detection is active until a trained civic-issue model is installed
and evaluated. Set CIVISENSE_MODEL_PATH (or ROADGUARD_MODEL_PATH) to your custom YOLO weights in a later stage.
"""
import os
from pathlib import Path

MODEL_PATH = os.getenv("CIVISENSE_MODEL_PATH") or os.getenv("ROADGUARD_MODEL_PATH")

def detect_issue(image_path: str) -> dict:
    if not MODEL_PATH or not Path(MODEL_PATH).exists():
        return {
            "status": "not_configured",
            "model": None,
            "detections": [],
            "message": "Custom civic-issue model is not installed yet."
        }

    try:
        from ultralytics import YOLO
        model = YOLO(MODEL_PATH)
        results = model(image_path, verbose=False)
        detections = []
        for result in results:
            names = result.names
            for box in result.boxes:
                cls_id = int(box.cls[0].item())
                detections.append({
                    "label": names.get(cls_id, str(cls_id)),
                    "confidence": round(float(box.conf[0].item()), 4),
                    "xyxy": [round(float(v), 1) for v in box.xyxy[0].tolist()]
                })
        return {
            "status": "completed",
            "model": Path(MODEL_PATH).name,
            "detections": detections,
            "message": "Detection completed; human review is still required."
        }
    except ImportError:
        return {
            "status": "dependency_missing",
            "model": Path(MODEL_PATH).name,
            "detections": [],
            "message": "Install ultralytics and its dependencies to run the model."
        }
    except Exception as exc:
        return {
            "status": "error",
            "model": Path(MODEL_PATH).name,
            "detections": [],
            "message": f"Model inference failed: {type(exc).__name__}"
        }
