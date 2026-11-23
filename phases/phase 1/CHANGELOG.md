# Phase 1: Iteration Log & Changelog

## Commit Baseline
- **Git Commit**: `9df0887`
- **Commit Message**: `feat: initial commit of CiviSense - AI-powered civic issue intelligence platform`
- **Branch**: `main`
- **Remote**: `https://github.com/samcore07/CiviSense.git`
- **Release State**: Phase 1 Prototype — Complete Presentation Frontend, Foundational Starter Backend.

---

## Detailed Iteration History

### Iteration 1: Workspace & Prototype Foundation
- Established local full-stack workspace: React + Vite frontend, Python FastAPI backend, SQLite database.
- Implemented basic citizen reporting form with image upload, GPS latitude/longitude capture, and 40m Haversine spatial duplicate detector.
- Implemented prototype Leaflet OpenStreetMap view with colored status pins.

### Iteration 2: React 19 Ecosystem Compatibility
- **Issue**: Standard `lucide-react` library crashed on load with:
  `Cannot read properties of null (reading 'useContext')`
  caused by dual React 19 runtime instances resolved during dynamic bundling.
- **Resolution**:
  - Authored a custom, zero-dependency pure SVG icon library at `frontend/src/components/Icons.jsx`.
  - Added React deduplication configuration in `frontend/vite.config.js`:
    ```javascript
    resolve: { dedupe: ['react', 'react-dom'] }
    ```
  - Result: 100% stable icon rendering across all browsers with zero runtime dependency overhead.

### Iteration 3: Architectural Landing Page Restructuring
- Restructured the single-page experience to match high-density, architectural presentation patterns:
  1. **Top Header**: Glassmorphic sticky navigation with brand badge, title, ScrollSpy section tracking, theme switcher, and auth triggers.
  2. **Hero Section**: Value proposition focusing on *"From Pixels to Asphalt Restoration"*, with dual CTAs (`Report Issue` and `Explore Live GIS Map`).
  3. **Preface Section**:
     - 3-column incident preview card (`Computer Vision`, `40m Spatial Deduplication`, `AI Complaint Synthesis`).
     - Interactive scenario selector (`Pothole`, `Waterlogging`, `Streetlight`, `Garbage Dump`).
     - Key metrics strip (`96.8%`, `40m`, `0.4s`, `100%`).
     - Live OpenStreetMap GIS console with category filtering.
  4. **Features Section**: 7 core architectural pillars.
  5. **Workflow Section**: 5-step operational lifecycle pipeline.
  6. **Tutorial Section**: Product walkthrough container with 8 timestamp chapter cards.
  7. **Bottom Banner**: GIS Console launch trigger.
  8. **Footer**: Municipal data standards, governance, and legal credentials.

### Iteration 4: Accessibility & Contrast Tuning (WCAG AAA)
- **Issue**: In light mode, pale pastel text colors (`#38BDF8`, `#34D399`, `#FBBF24`) inside the active incident preview badges washed out against light card backgrounds.
- **Resolution**:
  - Implemented high-contrast, theme-adaptive CSS classes in `frontend/src/style.css`:
    - `.cv-badge-blue`: Deep royal blue (`#1E40AF` on `#EFF6FF`) with blue status dot.
    - `.cv-badge-green`: Deep forest green (`#166534` on `#F0FDF4`) with green status dot.
    - `.cv-badge-amber`: Rich bronze/amber (`#78350F` on `#FEF3C7`) with amber status dot.
  - Added 3px top gradient accent bars to each metric box.
  - Styled AI complaint description inside an italic callout box with amber left accent.

### Iteration 5: Platform Rebranding (RoadGuard → CiviSense)
- Rebranded platform across the entire codebase:
  - Brand identity: Logo initials updated to **`CS`**; title rendered as **`CIVI`**`SENSE`.
  - Content: All headlines, incident ticket IDs (`CS-9482`), and copy updated to CiviSense.
  - Database: Migrated local SQLite database to `civisense.db` while preserving existing records.
  - Backend: Updated FastAPI application title and health check to `CIVISENSE API`.

### Iteration 6: UI Refinements & Sticky Header Fix
- **Pill Badge Removal**: Removed top pill chip (`✧ Computer Vision + AI + GIS for Smarter Civic Governance`) from hero, letting the headline open the page cleanly.
- **Tutorial Cleanup**: Removed the developer upload button (`Upload Video File`) and hackathon submission text (`Official Demo Submission (Under 4 minutes)`), presenting a clean video container with external YouTube reference.
- **Logotype Unification**: Removed the CSS gap and whitespace between `CIVI` and `SENSE` so it renders seamlessly as one unified word.
- **Sticky Header Stabilization**: Replaced `body { overflow-x: hidden; }` with `overflow-x: clip;` to fix browser scroll-container clipping, ensuring `.navbar-wrapper` remains firmly pinned at `top: 0` with frosted glass backdrop blur.
