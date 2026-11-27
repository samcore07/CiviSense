import os

# Prevent Gradio 5/6 SSR server from claiming port 7860 and causing [Errno 98] collisions
os.environ["GRADIO_SSR_MODE"] = "false"

# 1. ZeroGPU hook so Hugging Face Space detects GPU functionality on startup
try:
    import spaces

    @spaces.GPU
    def _zerogpu_hook():
        return True
except Exception:
    pass

import gradio as gr
import uvicorn
from backend.app.main import app as fastapi_app

# 2. Build Gradio UI
with gr.Blocks(title="CiviSense AI Workstation") as demo:
    gr.Markdown("# 🛡️ CIVISENSE Multi-Defect Visual Intelligence Engine")
    gr.Markdown(
        "Serving live REST endpoints and WebSockets for YOLO11 defect detection.\n\n"
        "**Status**: Operational & Connected to Vercel."
    )

# 3. Mount Gradio dashboard at /gradio so FastAPI natively owns all root, /api, /reports, and /detect routes with full CORS
app = gr.mount_gradio_app(fastapi_app, demo, path="/gradio")

# 4. Launch with uvicorn on port 7860 (Hugging Face default)
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
