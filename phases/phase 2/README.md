# Phase 2: Live Vision Inference, Role-Based Workstation & Geospatial Intelligence

## 1. Executive Summary
**Phase 2** transitions **CiviSense** from an architectural presentation baseline into a **fully functional, real-time civic intelligence platform**. 

Where Phase 1 established a high-fidelity presentation frontend with mock computer vision and a starter schema, Phase 2 implements **live multi-model neural vision inference on Apple Silicon MPS**, **hardware-accelerated live camera WebSocket streaming**, **strict role-based access control (Admin vs. Citizen)**, **1-click automated AI complaint dispatch**, and **geospatial coordinate dispersion on the live GIS radar**.

---

## 2. Core Differences: Phase 1 vs. Phase 2 (Comparative Analysis)

| Architectural Vector | Phase 1 (Baseline Starter) | Phase 2 (Operational System) |
| :--- | :--- | :--- |
| **Defect Scope** | 5 Categories (pothole, waterlogging, garbage, streetlight, road_damage) | **3 Core Categories** (pothole, waterlogging, garbage); obsolete classes fully purged |
| **Computer Vision** | Mock adapter returning static synthetic bounding boxes | **Triple Neural Pipeline** (Custom YOLO11 pothole, Custom YOLO11 waterlogging, Open-Vocab YOLO-World garbage) |
| **Vision Acceleration** | CPU simulation | **Apple Silicon Metal Performance Shaders (`mps`)** with GPU fallback |
| **Live Streaming** | None (static photo upload only) | **Full-Duplex WebSockets (`/ws`)** at ~3.5 FPS with centroid tracking & temporal smoothing |
| **Garbage Detection** | Non-functional mock | **Multi-Token Open Vocabulary** (`black bag`, `garbage bags`, `waste bin`, `dumpster`) at `conf=0.15` |
| **False-Positive Filtering** | None | **Degenerate Box Filter** (`w > 0.85 && h > 0.78` and area > 70%) eliminating webcam room flood false positives |
| **Main App UX** | Legacy "Dual Workstation" (form + map crammed together) | **Tabular Workstation** with Live GIS Map, AI Detector, Citizen Complaint & Tracking |
| **Role-Based Access (RBAC)** | Decorative role pill; anyone could change any status | **Enforced RBAC**: Admin has Map + Tracking only; Citizen has Map + AI + Complaint + Tracking |
| **Municipal Dispatch** | Unrestricted dropdown for all users | **Admin-Exclusive Dropdown**; Citizens see read-only `<Lock />` dispatch state |
| **GIS Map View** | Street-level zoom (`13`), requiring manual zoom-out | **Regional Default View** (`zoom=10`, `[22.5726, 88.3639]`) showing all metropolitan Kolkata pins |
| **Map Pin Overlap** | Identical coordinates stacked directly on top of each other, hiding pins | **Radial Pin Dispersion (`disperseOverlappingMarkers`)** blooming overlapping pins into visible cluster rings |
| **Rejected Ticket Accounting** | Counted in Total Tracked Complaints (causing metric mismatch) | **Strictly Excluded** from Total Count, tab count, and GIS radar pins |
| **AI Ticket Filing** | Manual copy-pasting | **1-Click Direct Filing & Forwarding** (auto-fills category, severity, photo, description & opens tracking) |

---

## 3. Platform Architecture (Phase 2 Snapshot)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CIVISENSE ARCHITECTURE (PHASE 2)                │
└────────────────────────────────────────────────────────────────────────┘

    [ Citizen Capture / WebCam Stream ]          [ Image Upload Analyzer ]
                    │                                        │
                    ▼ (~3.5 FPS WebSocket)                   ▼ (REST POST)
    ┌────────────────────────────────────────────────────────────────────┐
    │                     FASTAPI NEURAL INFERENCE ENGINE                │
    │                                                                    │
    │  • Model 1: Custom YOLO11 Road Surface Pothole Detector           │
    │  • Model 2: Custom YOLO11 Urban Stormwater Waterlogging Detector   │
    │  • Model 3: Open-Vocabulary YOLO-World Real-Time Garbage Detector  │
    │                                                                    │
    │  Filtering: Degenerate Box Area Filter (<0.70) + Aspect Ratio Check │
    │  Tracking: Centroid Euclidean Tracker with Confirmation Threshold  │
    │  Hardware: PyTorch Metal Performance Shaders (Apple Silicon MPS)   │
    └─────────────────────────────────┬──────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
        [ Citizen Reporting Portal ]         [ Admin GIS Operations Console ]
        • Regional Live GIS Map (1st)        • Regional Live GIS Map (1st)
        • AI Issue Detection (2nd)           • Complaint Status Tracking (2nd)
        • Citizen Complaint Form (3rd)       • Municipal Work Order Dropdown
        • Complaint Status Tracking (4th)    • Lifecycle: Assign -> In Progress
        • Read-Only Dispatch (<Lock />)        -> Resolve / Reject
                    │                                   │
                    └─────────────────┬─────────────────┘
                                      ▼
    ┌────────────────────────────────────────────────────────────────────┐
    │             HYBRID GEOSPATIAL STORAGE & TRIAGE ENGINE              │
    │                                                                    │
    │  • Database: Dual-Driver Supabase PostgreSQL + Local SQLite Fallback│
    │  • Deduplication: 40m Haversine Spatial Cluster Detection          │
    │  • Visualization: Radial Marker Dispersion (Anti-Occlusion Spiral) │
    │  • Filtering: Automatic Dismissal of Rejected Records from Radar   │
    └────────────────────────────────────────────────────────────────────┘
```

---

## 4. Key Highlights of Phase 2

1. **True AI Vision Workstation (`AIDetector.jsx`)**:
   - Live hardware-accelerated video camera stream over WebSockets.
   - High-contrast, theme-agnostic streaming HUD overlay (`STREAMING | AI: Apple Silicon GPU (MPS)`).
   - High-precision file upload analyzer with itemized defect entity breakdown (confidence score, class pill, and bounding box image).
   - 1-click **"File Complaint & Forward to Status"** button that auto-populates complaint metadata and redirects directly to status tracking.

2. **Strict Role-Based Workstation (Admin vs. Citizen)**:
   - **Admin View**: Cleaned down strictly to **Live GIS Map** and **Complaint Status Tracking**.
   - **Citizen View**: Structured 4-tab workflow: **Live GIS Map → AI Issue Detection → Citizen Complaint → Complaint Status Tracking**.
   - **Municipal Dispatch Authority**: Dropdown status selector is restricted to Municipal Administrators. Citizens see an informative, locked dispatch badge.

3. **Geospatial Map Dispersion Engine**:
   - Solved Leaflet's marker occlusion problem where multiple complaints at the same landmark stacked on the identical pixel.
   - Identical/adjacent coordinates bloom outward in a clean radial spiral ring (~700m offset), ensuring all 4 awaiting triage pins and active work orders are 100% visible and clickable.

4. **Accurate Metrics & Rejected Complaint Lifecycle**:
   - Complaints marked `rejected` are immediately subtracted from the "Total Tracked Complaints" metric card, the tab badge, and the map vector layer.
   - Totals now maintain mathematical integrity across all triage buckets.

---

## 5. Documentation Directory
- [CHANGELOG.md](CHANGELOG.md) — Comprehensive technical iteration history, bugs investigated and resolved, and release notes.
- [FRONTEND_STATE.md](FRONTEND_STATE.md) — Exhaustive inventory of UI components, tab configurations, RBAC permissions, and styling systems.
- [BACKEND_ROADMAP.md](BACKEND_ROADMAP.md) — Machine learning model benchmarks, WebSocket protocols, REST APIs, and database schemas.
