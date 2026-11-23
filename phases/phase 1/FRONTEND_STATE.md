# Phase 1: Frontend Architecture & Component State

## 1. Frontend System Overview
The frontend is built on **React 19** using **Vite v8.3.8** as the build tool and development server. It provides a client-side single-page application (SPA) capable of toggling seamlessly between the public architectural landing page and the internal civic reporting/admin application.

- **Working Directory**: `frontend/`
- **Entry Points**: `frontend/index.html` → `frontend/src/main.jsx` → `frontend/src/App.jsx`
- **Styling Architecture**: Vanilla CSS with custom properties (`frontend/src/style.css`, ~2,460 lines)
- **GIS Engine**: `leaflet` and `react-leaflet` rendering OpenStreetMap tiles

---

## 2. Component Inventory

### 2.1 Navigation & Shell
- **`Navbar.jsx`**:
  - Sticky glassmorphic header (`position: sticky; top: 0; z-index: 1000`) with backdrop blur (`blur(16px)`).
  - Brand identity: Rounded cyan-gradient badge (`CS`), unified logotype (`CIVISENSE`), and platform tagline (`CV · AI · GIS CIVIC PLATFORM`).
  - ScrollSpy Navigation Pills: Dynamically highlights active section (`Preface`, `Features`, `Workflow`, `Tutorial`) as the user scrolls.
  - Controls: Dark/light mode theme toggle button and authentication entry button (`Login` or user status pill `● Logged in as [Name]`).
- **`Footer.jsx`**:
  - 4-column municipal governance footer linking to core capabilities, civic architecture, and compliance standards.
  - Copyright line: `© 2026 CiviSense — Computer Vision + AI + GIS for Smarter Civic Governance`.
- **`BottomBanner.jsx`**:
  - Full-width call-to-action banner linking directly to the live OpenStreetMap console.

### 2.2 Landing Page Sections
- **`Hero.jsx`**:
  - Main platform headline: *"AI–Powered Civic Issue Intelligence. From Pixels to Asphalt Restoration."*
  - Dual primary CTAs:
    - `Report Issue →` (Transitions view to citizen filing form in `MainApp.jsx`)
    - `Explore Live GIS Map` (Smooth-scrolls directly to the active Leaflet GIS radar console)
- **`PrefaceSection.jsx`**:
  - **Active Incident Telemetry Card**: Replicates high-density telemetry displays with three distinct columns:
    1. *Computer Vision (YOLO)*: Displays model classification, bounding box coordinates (`bbox`), and hazard severity in high-contrast blue (`.cv-badge-blue`).
    2. *40m Spatial Deduplication*: Displays Haversine match proximity, parent ticket reference, and suppression status in high-contrast green (`.cv-badge-green`).
    3. *AI Complaint Synthesis*: Displays automated municipal dispatch brief in italic callout with high-contrast amber badge (`.cv-badge-amber`).
  - **Category Switcher**: Allows interactive switching between simulated civic defect profiles (`🕳️ Pothole Damage`, `🌊 Waterlogging & Sump`, `💡 Broken Streetlight`, `🗑️ Garbage Dump`).
  - **Telemetry Numbers Strip**: Metric callouts (`96.8% Detection Accuracy`, `40m Dedup Radius`, `0.4s AI Latency`, `100% GIS Coverage`).
  - **Live GIS Radar Console**: Interactive Leaflet map visualizing actual reports fetched from the FastAPI backend with category filtering.
- **`Features.jsx`**:
  - 7 architectural pillar cards detailing:
    1. AI Pothole & Road Damage Detection
    2. Garbage, Waterlogging & Streetlight Classification
    3. GPS-Based Complaint Registration
    4. Duplicate Complaint Detection (40m Haversine)
    5. AI-Generated Complaint Descriptions
    6. Admin Dashboard with Live GIS Issue Map
    7. End-to-End Complaint Status Tracking
- **`WorkflowSection.jsx`**:
  - 5-step operational pipeline with sequential step badges:
    1. Citizen Geotag & Photo Capture
    2. Edge Computer Vision (YOLO) Defect Scan
    3. Spatial Deduplication (40m Radius Cluster)
    4. Local AI Prompt & Municipal Triage Brief
    5. Field Crew Mobilization & Live GIS Tracking
- **`TutorialSection.jsx`**:
  - Walkthrough media container with center play CTA and external YouTube reference.
  - 8 synchronized chapter cards (`Intro & Auth`, `Dashboard`, `AI Architect`, `Overview & Budget`, `Timeline & Logistics`, `Risk Radar`, `Theme Studio`, `Export Pack`).

### 2.3 Application & Modals
- **`MainApp.jsx`**:
  - Two primary operational modes:
    - **Citizen Portal**: Camera photo upload, one-tap GPS coordinate geolocation capture, category selection, and instant submission.
    - **Admin GIS Console**: Interactive full-page map with color-coded issue markers, live issue list, status dropdown editor (`reported`, `assigned`, `in_progress`, `resolved`, `rejected`), and duplicate ticket suppression indicators.
- **`AuthModal.jsx`**:
  - Modal authentication supporting simulated login for both **Officer Sharma (Municipal GIS Admin)** and **Ananya Sen (Citizen Reporter)**.
- **`Icons.jsx`**:
  - Standalone, zero-dependency SVG icon system. Eliminates React 19 duplicate Context crashes commonly encountered with standard `lucide-react` distributions.

---

## 3. Design System & CSS Tokens (`frontend/src/style.css`)

### Color Palette (WCAG AAA Compliant)
- **Primary Page Backgrounds**:
  - Dark Theme: `#0B0F19` (default tech aesthetic)
  - Light Theme: `#F8FAFC`
- **Surface & Cards**:
  - Dark Theme: `#111827`, `#172033`, `#1E293B`
  - Light Theme: `#FFFFFF`, `#F1F5F9`, `#E2E8F0`
- **Telemetry Accents**:
  - Blue (CV / Bounding Box): `#1E40AF` text on `#EFF6FF` background with `#93C5FD` border (Dark: `#BAE6FD` on `rgba(2, 132, 199, 0.22)`).
  - Green (Deduplication): `#166534` text on `#F0FDF4` background with `#86EFAC` border (Dark: `#BBF7D0` on `rgba(16, 185, 129, 0.22)`).
  - Amber (AI Synthesis): `#78350F` text on `#FEF3C7` background with `#FCD34D` border (Dark: `#FEF08A` on `rgba(245, 158, 11, 0.22)`).

---

## 4. UI Items to Refine in Phase 2
1. **Interactive Map Heatmap**:
   - Add density heatmap layer to the Leaflet GIS console to visualize pothole frequency clusters along transit corridors.
2. **Citizen Mobile Bottom Sheet**:
   - Create a mobile-first sliding bottom drawer for quick camera capture when accessed via smartphone viewport.
3. **Tutorial Video Asset**:
   - Replace the media placeholder with an embedded production walkthrough MP4.
4. **Enhanced Filter Bar**:
   - Add date range and severity filters (`Grade 1` to `Grade 5`) to the GIS map console.
