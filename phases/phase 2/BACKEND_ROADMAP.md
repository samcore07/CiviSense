# Phase 2: Backend Architecture & Vision Engine State

## 1. System Overview
The backend has transitioned from a starter prototype into a **production-ready neural vision API and real-time streaming engine** built on **FastAPI**, **Python 3.12**, and **PyTorch / Ultralytics YOLO**.

- **Directory**: `backend/`
- **Application Entry Point**: `backend/app/main.py`
- **Computer Vision Pipeline**: `backend/app/vision.py`
- **Hardware Acceleration**: Apple Silicon Metal Performance Shaders (`mps`) with automatic GPU/CPU fallback
- **Persistence Layer**: Local SQLite database (`civisense.db`) with Supabase PostgreSQL cloud sync

---

## 2. Multi-Model Neural Vision Pipeline (`vision.py`)

### 2.1 Model Ensemble Configuration
| Model Task | Weights Path | Architecture | Acceleration | Threshold |
| :--- | :--- | :--- | :--- | :--- |
| **Pothole Detection** | `backend/weights/pothole.pt` | Custom YOLO11 | Apple Silicon MPS | `conf=0.50` |
| **Waterlogging Segmentation** | `backend/weights/waterlogging.pt` | Custom YOLO11 | Apple Silicon MPS | `conf=0.70` (Degenerate Box Filter: max area 70%) |
| **Garbage / Waste Detection** | `yolov8s-worldv2.pt` | Open-Vocabulary YOLO-World | Apple Silicon MPS | `conf=0.15` (Prompt Vocabulary: 10 concrete tokens) |

### 2.2 Concurrency & Thread Safety
PyTorch MPS acceleration requires single-threaded access per process to avoid GPU context contention.
- Implemented `inference_lock = threading.Lock()` across all inference entry points (`detect_all`, `detect_objects`, `detect_issue`).

### 2.3 False-Positive Suppression Algorithms
1. **Waterlogging Degenerate Box Filter**:
   - Indoor walls and floor surfaces can trigger large, full-frame bounding boxes covering >90% of the camera feed.
   - Guard condition:
     ```python
     box_w_ratio = (x2 - x1) / width
     box_h_ratio = (y2 - y1) / height
     if max_area_ratio and (box_w_ratio * box_h_ratio > max_area_ratio or (box_w_ratio > 0.85 and box_h_ratio > 0.78)):
         continue
     ```
2. **Garbage Vocabulary Tuning**:
   - Zero-shot prompt tokens: `["garbage", "trash", "waste", "litter", "garbage bags", "trash bags", "black bag", "dumpster", "waste bin", "bin"]`.
   - Confidence set to `0.15` to capture dark plastic waste textures reliably.
3. **Zero Detection Fallback**:
   - When no bounding boxes meet thresholds, returns `top_category = "none"`, `top_confidence = 0.0`, and severity `1/5` with a neutral advisory.

---

## 3. Real-Time Streaming & REST API Specifications

### 3.1 WebSocket Live Camera Protocol
- **Endpoint**: `ws://<host>:8000/ws`
- **Payload Format**: Binary JPEG byte array (client throttled to ~3.5 FPS / 280ms intervals).
- **Processing Flow**:
  1. Ingests raw binary frame buffer via `cv2.imdecode`.
  2. Runs concurrent multi-model detection pipeline via `asyncio.to_thread(detect_all, frame)`.
  3. Updates `DetectionTracker` instances for temporal confirmation.
  4. Transmits structured JSON telemetry back to client:
     ```json
     {
       "count": 3,
       "detections": [...],
       "pothole_count": 1,
       "waterlogging_count": 0,
       "garbage_count": 2,
       "timestamp": 1732734000.123
     }
     ```

### 3.2 REST API Endpoints
- **`POST /api/detect/image` (or `/detect/image`)**:
  - Multipart form upload (`file: UploadFile`).
  - Query parameter `model` (`all`, `pothole`, `waterlogging`, `garbage`).
  - Returns annotated JPEG image as base64 data URI, itemized detections array, top defect classification, suggested severity score (1–5), and localized AI triage description.
- **`GET /api/reports` (or `/reports`)**:
  - Returns JSON array of all registered civic reports sorted by timestamp descending.
- **`POST /api/reports` (or `/reports`)**:
  - Registers a new civic complaint. Status is hardcoded to `'reported'`.
  - Runs 40-metre Haversine spatial duplicate check against active tickets.
- **`PATCH /api/reports/{id}/status` (or `/reports/{id}/status`)**:
  - Updates report lifecycle status (`reported`, `assigned`, `in_progress`, `resolved`, `rejected`).
- **`GET /api/health` (or `/health`)**:
  - Health check returning service status, SQLite connectivity, loaded models, and active device (`mps`).

---

## 4. Database Schema (`civisense.db`)

```sql
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL CHECK(category IN ('pothole', 'garbage', 'waterlogging')),
    description TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    severity INTEGER NOT NULL CHECK(severity BETWEEN 1 AND 5),
    status TEXT NOT NULL CHECK(status IN ('reported', 'assigned', 'in_progress', 'resolved', 'rejected')),
    image_name TEXT,
    created_at TEXT NOT NULL,
    duplicate_of TEXT,
    FOREIGN KEY(duplicate_of) REFERENCES reports(id)
);

CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at);
```

---

## 5. Next Phase Roadmap (Phase 3 Targets)
1. **Edge Deployment**: Export YOLO11 models to ONNX / CoreML formats for offline on-device client inference.
2. **Automated Ward Routing**: Integrate GeoJSON municipal boundary polygons to automatically route reports to specific zonal ward engineers.
3. **Automated WhatsApp / SMS Citizen Notifications**: Fire webhook notifications to citizens when status transitions from `assigned` → `in_progress` → `resolved`.
