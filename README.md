# CIVISENSE — Civic Issue Reporting MVP

A free/local-first starter for an AI-powered civic issue reporting platform.

## Requirements
- macOS
- Python 3.11+
- Node.js 20+
- VS Code

## 1. Start the backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open http://127.0.0.1:8000/docs

## 2. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite.

## Current MVP functionality
- Submit a civic issue with a photo, category and GPS coordinates.
- Store reports in SQLite.
- Detect likely duplicates using nearby coordinates and matching category.
- View reports in a dashboard and on an OpenStreetMap map.
- Update report status from the dashboard.
- Generate a basic complaint description locally from submitted fields.

## Important AI note
The API currently includes a safe detection adapter. It works in demo mode and clearly marks detection as
`not_configured` until you add a trained civic-issue YOLO model. A generic YOLO model does not reliably
recognize potholes, garbage, waterlogging, streetlights and road damage. We will train/test a custom model
with a suitable dataset before presenting AI detection as operational.

Ollama integration is optional and can be added after the core workflow works. No paid API is required.

## Project structure
- `backend/app/main.py` — API, SQLite, uploads, duplicate checks
- `backend/app/vision.py` — model integration point
- `frontend/src/App.jsx` — citizen form and admin dashboard
- `frontend/src/main.jsx` — React entry point

## Development order
1. Run this starter locally.
2. Test issue submission and status updates.
3. Add and evaluate a custom YOLO model.
4. Add local Ollama descriptions.
5. Add authentication, roles and audit history.
6. Deploy only after security and privacy review.
