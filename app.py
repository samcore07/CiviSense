import gradio as gr
import uvicorn
import os
from backend.app.main import app

with gr.Blocks(title="CiviSense AI Engine") as demo:
    gr.Markdown("# 🚦 CiviSense Computer Vision & GIS Engine")
    gr.Markdown("Serving live REST endpoints and persistent WebSockets for YOLO11 defect detection.")

# Mount Gradio dashboard at /gradio so FastAPI owns all /api and /ws routes
app = gr.mount_gradio_app(app, demo, path="/gradio")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
