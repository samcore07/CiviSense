# Phase 2: Iteration Log & Changelog

## Commit & Milestone Baseline
- **Milestone**: Phase 2 — Real-Time Neural Inference, Role-Based Access Control & Geospatial Radar Engine
- **Target Branch**: `main`
- **Status**: Complete & Verified (Production Build Clean)

---

## Detailed Iteration History & Bug Resolutions

### Iteration 1: Decommissioning Obsolete Defect Categories
- **Objective**: Purge `streetlight` and `road_damage` completely from the platform, focusing core intelligence strictly on **Potholes**, **Waterlogging**, and **Garbage/Waste**.
- **Backend Refactoring (`backend/app/main.py`)**:
  - Reduced `CATEGORIES` set from 5 to `{"pothole", "garbage", "waterlogging"}`.
  - Removed streetlight and general road damage heuristic rules and synthetic description builders.
  - Sanitized local databases (`civisense.db`, `roadguard.db`) and SQL migration scripts (`supabase/schema.sql`, `supabase/FIX_DATABASE_PERMISSIONS.sql`).
- **Frontend Refactoring (`MainApp.jsx`, `PrefaceSection.jsx`, `InteractiveDemo.jsx`)**:
  - Removed streetlight and road damage category chips, filter buttons, icons, and simulated scenarios.
  - Cleaned category mapping across all tables, badges, and status cards.

---

### Iteration 2: Real Multi-Model Neural Vision Integration
- **Objective**: Replace mock inference adapters with real PyTorch & Ultralytics vision models running natively on Apple Silicon Metal Performance Shaders (`mps`).
- **Models Integrated (`backend/app/vision.py`)**:
  - **Pothole Model**: Custom trained YOLO11 (`backend/weights/pothole.pt`).
  - **Waterlogging Model**: Custom trained YOLO11 (`backend/weights/waterlogging.pt`).
  - **Garbage Model**: Open-Vocabulary YOLO-World model (`yolov8s-worldv2.pt`).
- **FastAPI Endpoints**:
  - `POST /api/detect/image`: Multi-model file inspection returning annotated base64 JPEG, defect counts, suggested hazard severity (1–5), and localized AI triage descriptions.
  - Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`, `.bmp` up to 12 MB.
  - Multi-threaded inference safety: Added `inference_lock = threading.Lock()` to serialize PyTorch MPS GPU contexts during concurrent requests.

---

### Iteration 3: Real-Time WebSocket Camera Streaming (`/ws`)
- **Objective**: Provide low-latency live camera defect scanning from citizen smartphones and municipal inspection vehicles.
- **WebSocket Protocol**:
  - Binary JPEG byte ingestion over `/ws` at ~3.5 FPS (280ms throttle loop).
  - Centroid-based `DetectionTracker` with Euclidean distance matching across frames.
  - Temporal smoothing: Requires defect confirmation across consecutive frames before firing alerts.
- **Client Implementation (`frontend/src/components/AIDetector.jsx`)**:
  - Canvas overlay rendering colored bounding boxes in real time: Cyan (`#38BDF8`) for Potholes, Amber (`#F59E0B`) for Waterlogging, Emerald (`#10B981`) for Garbage.
  - Direct frame capture trigger: `Convert Detection to Ticket`.

---

### Iteration 4: Garbage Detection Optimization & Prompt Engineering
- **Issue Investigated**: The open-vocabulary garbage model failed to detect prominent piles of overflowing black plastic garbage bags, returning 0 detections and defaulting to pothole with 0.0% confidence.
- **Root Cause**:
  1. Default vocabulary tokens (`garbage`, `trash`, `waste`) were too abstract for zero-shot text-image embedding matching against common municipal scenes.
  2. The confidence threshold (`0.30`) was set too high for open-vocabulary embedding cosine similarities.
  3. `backend/app/main.py` defaulted `top_category = "pothole"` when 0 defects were detected.
- **Resolution**:
  - Expanded `GARBAGE_CLASSES` in `vision.py` to include concrete visual tokens: `["garbage", "trash", "waste", "litter", "garbage bags", "trash bags", "black bag", "dumpster", "waste bin", "bin"]`.
  - Calibrated `GARBAGE_CONFIDENCE_THRESHOLD = 0.15`.
  - Fixed fallback logic: Returns `top_category = "none"`, `top_confidence = 0.0`, and severity 1/5 with an appropriate advisory instead of falsely claiming a pothole.
  - **Verification**: Tested against user's overflowing garbage bags image — successfully detected **5 distinct waste items at 55.4% confidence and assigned maximum severity 5/5**.

---

### Iteration 5: Waterlogging False-Positive Suppression
- **Issue Investigated**: The live camera scanner persistently showed an active waterlogging detection covering the entire webcam feed (~64% confidence) on normal indoor rooms.
- **Root Cause**: The custom `waterlogging.pt` model produced degenerate bounding boxes spanning 99.6% width and 94.7% height when exposed to plain walls or flooring.
- **Resolution**:
  - Implemented degenerate box filtering in both backend (`backend/app/vision.py`) and frontend canvas overlay (`AIDetector.jsx`):
    ```python
    # Filter out full-frame degenerate false-positives
    box_w_ratio = (x2 - x1) / width
    box_h_ratio = (y2 - y1) / height
    if max_area_ratio and (box_w_ratio * box_h_ratio > max_area_ratio or (box_w_ratio > 0.85 and box_h_ratio > 0.78)):
        continue
    ```
  - Raised `WATERLOGGING_CONFIDENCE_THRESHOLD` to `0.70`.
  - Verified on live camera feed: The room background false positive was 100% eliminated while true road flooding detections remain responsive.

---

### Iteration 6: Main Application Workstation Redesign & 1-Click Ticket Filing
- **Workstation Layout**: Replaced the legacy cramped "Dual Workstation" with full-width, dedicated tabs.
- **AI Issue Detection Workstation**:
  - Removed obsolete AI model marketing badges (`Custom YOLO11`, `Open-Vocab YOLO-World`, `Triple YOLO`).
  - Added an itemized **"Identified Defect Objects"** entity list rendering each detection's category, raw label match, and confidence pill.
  - Added **1-Click Complaint Registration**:
    - `File Complaint & Forward to Status`: Auto-populates category, severity, synthesized description, and photo, registers the report to Supabase/FastAPI, and immediately redirects the user to the status tracking table.
    - `Review & Edit in Registration Form`: Pre-fills the registration form for manual GPS coordinate adjustments.

---

### Iteration 7: Role-Based Access Control (RBAC) & Municipal Dispatch Authority
- **Issue Investigated**: Any user could alter municipal dispatch actions via the table dropdown, and administrative tabs cluttered the citizen experience.
- **Resolution**:
  - **Admin Tab Isolation**:
    - When `user.role === 'admin'`, the tabs bar renders **only two tabs**: `Live GIS Map` and `Complaint Status Tracking`.
    - Auto-redirect: If an admin accesses the app, any citizen tab (`report` or `ai_detector`) automatically defaults to `map`.
  - **Citizen Tab Workflow**:
    - Strictly sequenced as: `Live GIS Map` → `AI Issue Detection` → `Citizen Complaint` → `Complaint Status Tracking`.
  - **Citizen Submission Enforcement**: All citizen submissions register strictly with status **`reported`**.
  - **Dispatch Control Restriction**:
    - **Admin**: Has full access to the `<select className="status-select-input">` dropdown (`REPORTED`, `ASSIGNED`, `IN PROGRESS`, `RESOLVED`, `REJECTED`).
    - **Citizen**: The dropdown is removed. Citizens see a read-only locked badge with `<Lock />` (e.g. `Awaiting Dispatch`, `Crew Assigned`, `In Field Work`, `Work Completed`).
    - Guarded in `changeStatus`: Non-admin execution attempts are immediately blocked with an access restriction alert.

---

### Iteration 8: Map Zoom Calibration & Radial Pin Dispersion
- **Issue Investigated 1**: Default map view opened at `zoom={13}`, focusing too tightly on a single street coordinate and hiding all regional municipal pins.
- **Resolution 1**: Set default `MapContainer` view to `center={[22.5726, 88.3639]}` and `zoom={10}` on both `MainApp.jsx` and `PrefaceSection.jsx`, matching the regional metropolitan view where all Kolkata pins are visible at once.
- **Issue Investigated 2**: The stat card indicated 4 complaints *"Awaiting GIS Triage"*, but only 1–2 amber pins appeared on the map.
- **Root Cause 2**: Multiple complaints filed at the default coordinates (`22.5726, 88.3639`) rendered at the exact same pixel on Leaflet, causing Marker #4 to 100% occlude Markers #1, #2, and #3.
- **Resolution 2**:
  - Authored `disperseOverlappingMarkers`: Detects overlapping pins (<100m) and offsets them outward radially in a clean spiral cluster ring (~700m offset).
  - All 4 awaiting amber pins are now cleanly separated, 100% visible, and independently clickable.

---

### Iteration 9: Rejected Complaint Accounting
- **Issue Investigated**: When a complaint was marked `rejected`, it remained in the "Total Tracked Complaints" card, causing a tally mismatch (`Total: 8`, while `Awaiting: 4 + Active: 2 + Resolved: 1 = 7`).
- **Resolution**:
  - Filtered all rejected tickets out of `validReports = reports.filter(r => r.status !== 'rejected')`.
  - "Total Tracked Complaints" card and tab badge now display `validReports.length`.
  - Rejected tickets are dismissed from the live GIS radar pins.

---

### Iteration 10: Light Mode Camera Streaming HUD Contrast
- **Issue Investigated**: The floating camera status pill (`STREAMING | AI: Apple Silicon GPU (MPS)`) was dark and illegible in light mode due to dark text inheriting against a dark glass backdrop.
- **Resolution**:
  - Fixed typography to explicit `#F8FAFC` and `#E2E8F0` with `600` font weight.
  - Backed by dark charcoal frosted glass (`rgba(15, 23, 42, 0.85)`), `1px solid rgba(255, 255, 255, 0.2)` border, and drop shadow.
  - Vibrant `#34D399` green indicator dot.
  - Result: 100% legible, high-contrast HUD in both Light Mode and Dark Mode.
