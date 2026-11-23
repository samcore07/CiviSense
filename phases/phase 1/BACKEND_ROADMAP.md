# Phase 1: Backend Baseline & Full Architecture Roadmap

## 1. Current Backend State (Phase 1 Baseline)
In Phase 1, the backend operates as a **lightweight starter service** providing core CRUD operations and prototype spatial deduplication for demonstration.

- **Framework**: FastAPI (Python 3.12) with Uvicorn ASGI server.
- **Port**: `http://127.0.0.1:8000`
- **Database**: Local SQLite stored at `backend/data/civisense.db`.
- **Static Assets**: Uploaded citizen defect photos stored at `backend/data/uploads/`.

### 1.1 Existing Database Schema (`reports` table)
```sql
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,            -- UUID v4
    category TEXT NOT NULL,         -- pothole, garbage, waterlogging, streetlight, road_damage
    description TEXT NOT NULL,      -- Citizen or simulated AI description
    latitude REAL NOT NULL,         -- GPS decimal degrees
    longitude REAL NOT NULL,        -- GPS decimal degrees
    severity INTEGER NOT NULL,      -- 1 (low) to 5 (critical)
    status TEXT NOT NULL,           -- reported, assigned, in_progress, resolved, rejected
    image_name TEXT,                -- Filename in data/uploads/
    created_at TEXT NOT NULL,       -- ISO 8601 timestamp
    duplicate_of TEXT               -- UUID of parent ticket if within 40m Haversine radius
);
```

### 1.2 Implemented REST Endpoints
| Method | Endpoint | Description | Phase 1 Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Health check & documentation metadata | Operational |
| `GET` | `/api/reports` | Returns all reports sorted by `created_at DESC` | Operational |
| `POST` | `/api/reports` | Accepts multipart form + image, calculates 40m Haversine distance, logs report | Operational |
| `PATCH` | `/api/reports/{id}/status` | Updates report lifecycle status (`reported` → `resolved`) | Operational |

### 1.3 Computer Vision Adapter (`backend/app/vision.py`)
Currently operates as a **safe architectural adapter**. When no trained model path is configured in `CIVISENSE_MODEL_PATH`, it cleanly returns:
```json
{
  "status": "not_configured",
  "detail": "Install a trained civic defect model and set CIVISENSE_MODEL_PATH"
}
```
This ensures the platform never misleads users with fake AI detection results while providing the exact interface contract for YOLOv8 model drop-in.

---

## 2. Complete Backend Roadmap (Phases 2 & 3)

The following pillars will be implemented to transform CiviSense from an architectural prototype into a full-scale civic intelligence platform:

```
┌─────────────────────────────────────────────────────────────┐
│                   CiviSense Full Backend                    │
└──────────────────────────────┬──────────────────────────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  AI Engine   │       │ Spatial GIS  │       │ Operations   │
│ • YOLOv8     │       │ • PostGIS /  │       │ • RBAC Auth  │
│   Inference  │       │   R*Tree     │       │ • WebSockets │
│ • Local LLM  │       │ • Ward Poly  │       │ • Citizen    │
│   (Ollama)   │       │   Boundaries │       │   SMS Alerts │
└──────────────┘       └──────────────┘       └──────────────┘
```

### Pillar 1: Production Computer Vision Pipeline (YOLOv8)
- **Objective**: Automate defect detection and severity estimation directly from uploaded citizen camera photos.
- **Model Training**:
  - Fine-tune YOLOv8 nano/small on domain-specific datasets:
    - *Pothole Detection Dataset* (asphalt ruptures, cracks, deep craters).
    - *Garbage & Waste Classification* (solid waste heaps, illegal dumping).
    - *Waterlogging Segmentation* (surface water ponding, culvert overflow).
    - *Streetlight Defect Classifier* (luminaire damage, dark zones).
- **Inference Pipeline**:
  - Run asynchronous inference via PyTorch / ONNX Runtime.
  - Return bounding box coordinates (`[xmin, ymin, xmax, ymax]`), confidence scores, and estimated vehicular hazard index (Grade 1–5).

### Pillar 2: Local AI Description Synthesis (Ollama / LLaMA 3.2)
- **Objective**: Formulate professional, structured municipal dispatch briefs in under 500ms without sending civic data to paid third-party cloud APIs.
- **Implementation**:
  - Integrate local `ollama` or `llama.cpp` endpoint running quantized LLaMA 3.2 (3B) or Mistral 7B.
  - Context Prompt Template:
    ```
    Input: Category={category}, Severity={grade}, GPS=({lat}, {lon}), CV_Detections={detections}
    Task: Formulate a 2-sentence municipal dispatch brief specifying damage severity, transit hazard, and recommended restoration crew equipment.
    ```

### Pillar 3: Scalable Spatial Engine & Ward Boundary Mapping
- **Objective**: Scale from pairwise Haversine checks to city-wide spatial clustering and automated administrative routing.
- **Implementation**:
  - Upgrade to **SQLite R*Tree spatial indexing** or **PostgreSQL with PostGIS** (`ST_DWithin`, `ST_ClusterDBSCAN`).
  - Ingest municipal Ward boundary GeoJSON polygons. When a report is filed, automatically query `ST_Contains` to assign the ticket to the respective Ward Engineer.

### Pillar 4: Authentication, RBAC & Audit Trails
- **Objective**: Secure operations and provide accountability for municipal resource dispatch.
- **Implementation**:
  - JWT token-based authentication with `bcrypt` password hashing.
  - Role hierarchy:
    - `Citizen`: Can file complaints, track own reports, view public map.
    - `Field Worker`: Can update ticket status, upload resolution proof photos.
    - `Ward Supervisor`: Can assign crews, approve repair work orders.
    - `Municipal Commissioner`: Global access, analytics dashboard, budget allocation.
  - Immutable audit trail table logging timestamps and user IDs for every status transition.

### Pillar 5: Real-Time WebSockets & Push Notifications
- **Objective**: Live operational coordination.
- **Implementation**:
  - FastAPI WebSocket endpoint (`/ws/reports`) broadcasting new reports and status changes to connected admin GIS map consoles in real time.
  - Automated notification triggers (Web Push / SMS) notifying citizens when their reported defect is assigned or resolved.
