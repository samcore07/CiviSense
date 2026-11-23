# Phase 1: Presentation Frontend & Architectural Baseline

## 1. Overview
**Phase 1** documents the initial release and baseline versioning of **CiviSense** (originally initiated as *RoadGuard*). 

The focus of this phase is establishing a **high-fidelity presentation frontend**, establishing core architectural UX patterns, and creating a working prototype for demonstration and initial stakeholder feedback. In this state:
- The **frontend presentation layer is intact and fully operational** with an integrated Leaflet GIS map, interactive defect telemetry simulator, operational workflow pipeline, and structured chapter walkthrough.
- The **backend is currently a foundational starter**, containing an SQLite database schema, mock computer vision adapter, and basic REST endpoints. Comprehensive backend functionality, real ML model inference, and production GIS services are slated for subsequent phases.

---

## 2. Core Platform Identity & Concept
- **Platform Name**: CiviSense (`CS`)
- **Core Concept**: `Computer Vision + AI + GIS for Smarter Civic Governance`
- **Primary Mission**: Automate the detection, classification, spatial deduplication, description synthesis, and GIS routing of urban civic infrastructure defects (potholes, garbage overflow, waterlogging, broken streetlights).

```
[ Citizen Smartphone / GPS ]
            │
            ▼
┌───────────────────────────┐
│   CiviSense AI Pipeline   │
│ 1. YOLOv8 Defect Vision   │
│ 2. 40m Haversine Dedup    │
│ 3. Natural Language Brief │
└───────────┬───────────────┘
            │
            ▼
┌───────────────────────────┐
│  Municipal GIS Operations │
│ • OpenStreetMap Live Map  │
│ • Ward / Crew Dispatch    │
│ • Status Lifecycle Triage │
└───────────────────────────┘
```

---

## 3. Phase 1 Architecture Snapshot

| Domain | Phase 1 Status | Technology Stack |
| :--- | :--- | :--- |
| **Frontend UI** | **Complete & Operational** | React 19, Vite, Leaflet, Custom CSS Design System |
| **Icons & Assets** | **Complete** | Pure SVG zero-dependency icon system (`Icons.jsx`) |
| **GIS Radar** | **Functional Demo** | OpenStreetMap via Leaflet (`react-leaflet`) with custom status pins |
| **Backend API** | **Starter Baseline** | FastAPI, Python 3.12, Uvicorn |
| **Database** | **Starter Schema** | Local SQLite (`civisense.db`) |
| **Vision Model** | **Adapter Mock** | Mock response contract (YOLO integration ready) |
| **Spatial Engine** | **Mathematical Heuristic** | 40-metre Haversine formula distance calculation |

---

## 4. Key Highlights of Phase 1
1. **Glassmorphic Sticky Navigation**:
   - Seamless brand typography (`CIVISENSE`) with responsive ScrollSpy tracking across `Preface`, `Features`, `Workflow`, and `Tutorial`.
   - Dual-theme engine (dark mode tech default + high-contrast light mode) with localStorage persistence.
2. **Interactive Preface Telemetry**:
   - 3-column architectural cards simulating YOLO detection bounding boxes, 40m spatial deduplication matches, and local AI dispatch descriptions.
   - High-contrast WCAG AAA color badges (Royal Blue, Emerald Green, Rich Amber).
3. **Core Architectural Pillars**:
   - 7 defined functional pillars detailing automated pothole detection, multi-class triage, GPS tagging, deduplication, description generation, admin console, and lifecycle tracking.
4. **End-to-End Civic Workflow**:
   - 5-stage pipeline: Citizen Geotag → Edge Vision → Spatial Haversine → AI Synthesis → Field Dispatch.
5. **Tutorial & Walkthrough Architecture**:
   - Clean 16:9 walkthrough video container with 8 timestamped chapter cards.

---

## 5. Phase Documentation Index
Detailed technical records for Phase 1 are organized into the following documents:
- [FRONTEND_STATE.md](FRONTEND_STATE.md) — Comprehensive breakdown of components, styles, design tokens, and UI items to refine in Phase 2.
- [BACKEND_ROADMAP.md](BACKEND_ROADMAP.md) — Current state of backend services, database schema, and detailed implementation plan for full production backend.
- [CHANGELOG.md](CHANGELOG.md) — Chronological development logs, bug fixes (React 19 icon compatibility, sticky headers, contrast tuning), and version history.
