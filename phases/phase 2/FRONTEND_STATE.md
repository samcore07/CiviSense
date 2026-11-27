# Phase 2: Frontend Architecture & Workstation State

## 1. System Overview
The frontend architecture in Phase 2 has evolved from a presentation landing page with a mock demo into a **production-ready civic reporting and GIS operations console** powered by **React 19** and **Vite v8.3.8**.

- **Directory**: `frontend/`
- **Application Shell**: `frontend/src/App.jsx`
- **Primary Workstation**: `frontend/src/components/MainApp.jsx`
- **Live AI Scanner**: `frontend/src/components/AIDetector.jsx`
- **GIS Engine**: `react-leaflet` + `leaflet` (OpenStreetMap Vector Tiles)
- **Styling**: `frontend/src/style.css` (Updated with high-contrast HUD and locked dispatch badge tokens)

---

## 2. Component Inventory & Workstation Structure

### 2.1 Main Application Shell (`MainApp.jsx`)
The main application console now dynamically adapts its layout and available sub-tabs based on the authenticated user's role (`user.role`).

#### Role-Based Tab Configurations:
1. **Municipal Administrator (`user.role === 'admin'`)**:
   - Strictly restricted to **2 operational tabs**:
     - `Live GIS Map` (`activeTab === 'map'`) — Full-width interactive municipal radar telemetry.
     - `Complaint Status Tracking` (`activeTab === 'table'`) — Triage management table with active status update dropdowns.
   - Any manual URL or state transition to citizen tabs (`report`, `ai_detector`) automatically defaults back to `map`.

2. **Citizen Reporter (`user.role === 'citizen'`)**:
   - Sequential 4-tab workflow:
     1. `Live GIS Map` (`activeTab === 'map'`) — View public issue pins across the city.
     2. `AI Issue Detection` (`activeTab === 'ai_detector'`) — Live camera and image defect scanner.
     3. `Citizen Complaint` (`activeTab === 'report'`) — GPS-enabled complaint filing form.
     4. `Complaint Status Tracking` (`activeTab === 'table'`) — Read-only complaint status and field verification timeline.

#### Header & Identity:
- **Role Badge**: Dynamically displays `ADMIN` (cyan) or `CITIZEN` (emerald) based on authenticated session state.
- **Theme Switcher**: Preserved smooth dark/light mode toggle with persistent localStorage syncing.

---

### 2.2 AI Issue Detection Workstation (`AIDetector.jsx`)
A dedicated, dual-mode visual defect intelligence suite.

1. **Mode 1: Real-Time Camera Scanner**:
   - Streams live webcam frames to `/ws` at ~3.5 FPS.
   - Live canvas overlay drawing bounding boxes with confidence labels:
     - 🕳️ Potholes: `#38BDF8` (Cyan)
     - 🌊 Waterlogging: `#F59E0B` (Amber)
     - 🗑️ Garbage/Waste: `#10B981` (Emerald)
   - Real-time defect counters: `Potholes: N`, `Water: N`, `Garbage: N`.
   - **High-Contrast Floating HUD Badge**:
     - Styled with `rgba(15, 23, 42, 0.85)` dark glass, `1px solid rgba(255, 255, 255, 0.2)` border, and drop shadow.
     - `#34D399` pulsing live dot + bold `STREAMING` indicator.
     - `#E2E8F0` text: `AI: Apple Silicon GPU (MPS)`.
     - 100% legible across both light mode and dark mode backgrounds.
   - `Convert Detection to Ticket` button captures current video frame, attaches coordinates, and stages for filing.

2. **Mode 2: Image File Analyzer**:
   - Upload dropzone supporting `.jpg`, `.jpeg`, `.png`, `.webp`, `.bmp` up to 12 MB.
   - Target model selector: `All 3 Models (Recommended)`, `Potholes Only`, `Waterlogging Only`, `Garbage Only`.
   - Annotated detection preview displaying computer vision bounding box overlays.
   - Metrics summary card (Pothole count, Waterlogging count, Garbage count).
   - **Identified Defect Objects List**: Itemizes every detected entity with its category icon, raw model match, and confidence percentage.
   - **Complaint Filing Actions**:
     - `File Complaint & Forward to Status` (Primary): Auto-submits complaint with AI data and immediately opens the status tracking table.
     - `Review & Edit in Registration Form` (Secondary): Pre-populates the registration form for manual GPS adjustments.

---

### 2.3 Live GIS Map Component (`MainApp.jsx` & `PrefaceSection.jsx`)
- **Default Coordinates & Zoom**:
  - `center={[22.5726, 88.3639]}`
  - `zoom={10}`
  - Displays the regional Kolkata metropolitan map, making all ward pins visible at once without manual zooming.
- **Geospatial Radial Pin Dispersion (`disperseOverlappingMarkers`)**:
  - Detects overlapping pins within ~100m.
  - Offsets subsequent pins outward radially along an anti-occlusion spiral (~700m radius).
  - Eliminates Leaflet's marker stacking bug, ensuring all 4 awaiting triage amber pins are visible and clickable.
- **Marker Color Coding**:
  - Amber (`#F59E0B`): `reported` (Awaiting GIS triage)
  - Cyan (`#0284C7`): `assigned` / `in_progress` (Crew mobilized / in field work)
  - Emerald (`#10B981`): `resolved` (Verified & repaired)
  - Red (`#EF4444`): `rejected` (Suppressed from live radar pins)

---

### 2.4 Complaint Status Tracking Table
- **Columns**:
  1. *Complaint & Timestamp*: Category icon, sanitized title, ticket ID, date, and 40m spatial deduplication badge.
  2. *Severity*: Hazard score (1–5) based on AI confidence and defect area.
  3. *GIS Coordinates*: Decimal latitude and longitude formatted to 4 decimal places.
  4. *Status Tracking*: Color-coded status badge (`reported`, `assigned`, `in_progress`, `resolved`, `rejected`).
  5. *Municipal Dispatch Action*:
     - **For Admins**: `<select>` dropdown allowing instant triage (`REPORTED`, `ASSIGNED`, `IN PROGRESS`, `RESOLVED`, `REJECTED`).
     - **For Citizens**: Read-only locked badge with `<Lock />` icon (`Awaiting Dispatch`, `Crew Assigned`, `In Field Work`, `Work Completed`).

---

## 3. Metric Integrity & Accounting
- Metric calculations strictly ignore dismissed/rejected tickets:
  ```javascript
  const validReports = reports.filter((r) => r.status !== 'rejected');
  ```
- **Total Tracked Complaints**: Displays `validReports.length`.
- **Awaiting GIS Triage**: `reports.filter(r => r.status === 'reported').length`.
- **Active Field Work Orders**: `reports.filter(r => r.status === 'in_progress' || r.status === 'assigned').length`.
- **Verified & Resolved**: `reports.filter(r => r.status === 'resolved').length`.
- The sum of active buckets matches the total count with zero discrepancy.
