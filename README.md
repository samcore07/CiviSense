# 🛡️ CIVISENSE
### *AI-Powered Civic Issue Intelligence: From Pixels to Asphalt Restoration*

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![PyTorch MPS](https://img.shields.io/badge/PyTorch-MPS_Accelerated-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org)
[![YOLO11](https://img.shields.io/badge/YOLO11-Multi--Model-00FFFF?style=for-the-badge)](https://ultralytics.com)
[![Leaflet GIS](https://img.shields.io/badge/Leaflet-OpenStreetMap-199900?style=for-the-badge&logo=leaflet)](https://leafletjs.com)
[![Supabase](https://img.shields.io/badge/Supabase-Database_%26_Auth-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)

---

## 🌟 Overview

**CiviSense** is a full-stack, real-time civic intelligence workstation that automates municipal issue triage. By combining **hardware-accelerated computer vision**, **high-frequency WebSocket video telemetry**, **40-metre Haversine spatial deduplication**, and **OpenStreetMap GIS radars**, CiviSense bridges the gap between a citizen taking a photo and a municipal field crew repairing infrastructure.

> **Primary Mission:** Detect road hazards instantly, prevent duplicate work orders, auto-generate structured municipal dispatch briefs, and provide municipal engineers with an interactive live telemetry radar.

---

## 🏗️ System Architecture

```
                                  CITIZEN OR MUNICIPAL VEHICLE
                                                │
                     ┌──────────────────────────┴──────────────────────────┐
                     ▼                                                     ▼
           [ Live Camera Stream ]                                [ Photo File Upload ]
         Webcam / Smartphone Sensor                             JPG / PNG / WebP / BMP
                     │                                                     │
                     ▼ (3.5 FPS WebSocket /ws)                             ▼ (REST POST /api/detect/image)
    ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
    │                               FASTAPI NEURAL VISION ENGINE                                  │
    │                                                                                             │
    │   🕳️ Pothole Model           🌊 Waterlogging Model           🗑️ Solid Waste Model            │
    │      Custom YOLO11                Custom YOLO11                 Open-Vocab YOLO-World       │
    │      Weights: pothole.pt          Weights: waterlogging.pt      Weights: yolov8s-worldv2.pt │
    │      Conf: 0.50                   Conf: 0.70 + Area Filter      Conf: 0.15 + Custom Lexicon │
    │                                                                                             │
    │   ⚡ Hardware Engine: Apple Silicon Metal Performance Shaders (MPS) · Thread-Locked Safe     │
    │   🎯 False-Positive Guard: Degenerate Aspect Ratio & Area Threshold (<70% Frame)            │
    │   ⏱️ Temporal Smoothing: Centroid Euclidean Tracker across Streaming Frames                 │
    └──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                                   │
                                                   ▼
    ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
    │                            HYBRID GEOSPATIAL & LIFECYCLE ENGINE                             │
    │                                                                                             │
    │   📍 40m Haversine Clustering: Auto-suppresses nearby duplicates & links to parent ticket    │
    │   🗺️ Radial Spiral Dispersion: Anti-occlusion algorithm blooms overlapping pins (~700m)     │
    │   🛡️ Strict Role-Based Access: Admin Workstation vs. Citizen Reporting Console               │
    │   💾 Dual-Driver Persistence: Supabase Cloud PostgreSQL + Local SQLite Resilient Fallback   │
    └──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                                   │
                         ┌─────────────────────────┴─────────────────────────┐
                         ▼                                                   ▼
            [ 🛡️ MUNICIPAL ADMIN GIS ]                           [ 👤 CITIZEN CONSOLE ]
            • Regional Radar (Zoom 10 Kolkata)                  • Regional GIS Live Map (1st)
            • Live GIS Map & Triage Only                        • AI Issue Detection Suite (2nd)
            • Dispatch Dropdown: Assign/In-Progress/Resolve     • Citizen Complaint Form (3rd)
            • Suppressed Dismissal of Rejected Tickets          • Complaint Status Tracking (4th)
                                                                • Read-Only Dispatch State (<Lock />)
```

---

## ⚡ Key Capabilities & Features

### 1. 👁️ Live Multi-Model Defect Detection (`vision.py`)
- **Pothole Detection:** Custom YOLO11 neural network trained on asphalt rupture datasets.
- **Stormwater Waterlogging:** Custom YOLO11 segmentation model calibrated with a degenerate bounding box ratio filter (`w > 0.85 && h > 0.78`) to eliminate room/wall false positives.
- **Garbage & Municipal Waste:** Open-Vocabulary YOLO-World model configured with concrete urban lexical tokens (`black bag`, `garbage bags`, `trash bags`, `dumpster`, `waste bin`, `bin`) at `conf=0.15`.
- **Apple Silicon Hardware Acceleration:** Native PyTorch Metal Performance Shaders (`mps`) execution serialized via `inference_lock` for concurrent thread safety.

### 2. 🎥 WebSocket Real-Time Camera Telemetry (`/ws`)
- Real-time video frame streaming at **~3.5 FPS** over binary WebSockets.
- Client-side canvas overlay drawing high-contrast bounding boxes with confidence scores.
- High-contrast, theme-agnostic floating HUD overlay (`STREAMING | AI: Apple Silicon GPU (MPS)`) engineered with dark frosted glass for 100% legibility in both Light and Dark modes.
- Instant frame snapshot to ticket conversion.

### 3. 🎯 1-Click AI Ticket Filing
- **Visual Annotations & Metrics:** Itemized breakdown of defect objects (category, raw label match, confidence percentage).
- **One-Click Action:** Citizens can click **"File Complaint & Forward to Status"** to automatically populate defect classification, hazard severity (1–5), synthesized description, and photo, submit to the database, and immediately view their ticket in the tracking console.

### 4. 🗺️ Geospatial Radar & Pin Dispersion Engine
- **Default Regional View:** Calibrated at `zoom={10}` centered over metropolitan Kolkata `[22.5726, 88.3639]`, displaying all municipal pins immediately upon load.
- **Radial Spiral Dispersion (`disperseOverlappingMarkers`):** Solves Leaflet's marker stacking problem where multiple complaints at the same landmark overlap on the exact same pixel. Subsequent markers bloom outward in a clean spiral cluster ring (~700m offset), ensuring 100% visibility.
- **40m Haversine Deduplication:** Automatically detects whether another complaint has been filed within 40 metres of an active incident and flags it as a duplicate to prevent redundant dispatch.

### 5. 🔐 Role-Based Access Control (RBAC) & Municipal Authority
- **Admin Console:** Restricted strictly to **Live GIS Map** and **Complaint Status Tracking**.
- **Citizen Portal:** Sequential 4-tab workflow: **Live GIS Map → AI Issue Detection → Citizen Complaint → Complaint Status Tracking**.
- **Municipal Dispatch Authority:** Only administrators have the `<select>` dropdown in the tracking table to advance status (`reported` → `assigned` → `in_progress` → `resolved` → `rejected`). Citizens see a secure, read-only locked badge with `<Lock />`.
- **Mathematical Metric Integrity:** Dismissed/rejected complaints are automatically excluded from the "Total Tracked Complaints" count, tab badges, and live map pins.

---

## 🚀 Quickstart Guide

### Prerequisites
- **OS:** macOS (Apple Silicon recommended for MPS acceleration)
- **Runtime:** Python 3.11+, Node.js 20+

### 1. Backend Setup
```bash
# Navigate to backend
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies (FastAPI, PyTorch, Ultralytics, OpenCV, etc.)
pip install -r requirements.txt

# Launch FastAPI server with auto-reload
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*API Swagger Documentation:* `http://127.0.0.1:8000/docs`  
*Health Check:* `http://127.0.0.1:8000/api/health`

### 2. Frontend Setup
In a new terminal window:
```bash
# Navigate to frontend
cd frontend

# Install packages
npm install

# Start Vite development server
npm run dev
```
*Web Application:* `http://localhost:5173/`

---

## 📂 Project Directory Structure

```
roadguard/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app, WebSockets (/ws), REST API, deduplication
│   │   └── vision.py          # YOLO11 + YOLO-World models, MPS GPU accelerator, filters
│   ├── weights/               # Neural network weights (pothole.pt, waterlogging.pt)
│   ├── data/                  # SQLite persistent storage (civisense.db)
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MainApp.jsx    # Role-based workspace, GIS radar, tracking table
│   │   │   ├── AIDetector.jsx # Live camera WebSocket scanner & upload analyzer
│   │   │   ├── Hero.jsx       # Landing page presentation hero
│   │   │   ├── PrefaceSection.jsx # Telemetry cards & public GIS radar
│   │   │   ├── AuthModal.jsx  # Supabase RBAC login (Admin / Citizen)
│   │   │   ├── Icons.jsx      # Zero-dependency SVG icon system
│   │   │   └── style.css      # Glassmorphic dual-theme design system
│   │   ├── App.jsx            # Top-level state and ScrollSpy controller
│   │   └── supabase.js        # Supabase client, auth & realtime subscriptions
│   ├── vite.config.js         # Vite configuration with React deduplication
│   └── package.json           # Frontend dependencies
├── phases/
│   ├── phase 1/               # Phase 1 Documentation (Baseline Presentation Prototype)
│   │   ├── README.md
│   │   ├── CHANGELOG.md
│   │   ├── FRONTEND_STATE.md
│   │   └── BACKEND_ROADMAP.md
│   └── phase 2/               # Phase 2 Documentation (Real-time MPS AI & RBAC Workstation)
│       ├── README.md
│       ├── CHANGELOG.md
│       ├── FRONTEND_STATE.md
│       └── BACKEND_ROADMAP.md
└── supabase/
    ├── schema.sql             # Cloud PostgreSQL database schema
    └── FIX_DATABASE_PERMISSIONS.sql # Row-Level Security (RLS) policies
```

---

## 📖 Phase Documentation & Changelogs

Detailed technical post-mortems, architectural comparisons, and iteration logs are preserved in the `phases/` directory:

- 📘 [**Phase 1 Archive**](phases/phase%201/README.md): Presentation frontend baseline, React 19 icon compatibility, and starter schema.
- 🚀 [**Phase 2 System Record**](phases/phase%202/README.md): Live Apple Silicon MPS neural vision, WebSocket camera streaming, garbage model vocabulary tuning, waterlogging false-positive suppression, Leaflet radial pin dispersion, and strict role-based access control.

---

## ⚖️ Governance & License
Built with Open Source technologies (OpenStreetMap, PyTorch, Ultralytics YOLO, FastAPI, React). Distributed under the MIT License.
