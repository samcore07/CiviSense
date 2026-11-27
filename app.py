import gradio as gr
from backend.app.main import app

# Mount a sleek Gradio dashboard on top of the CiviSense FastAPI app
with gr.Blocks(title="CiviSense AI Engine") as demo:
    gr.Markdown("# 🚦 CiviSense Civic Intelligence & Computer Vision Engine")
    gr.Markdown(
        "**Status**: Active & Operational.\n\n"
        "Serving live REST endpoints and persistent WebSockets for YOLO11 defect detection."
    )

# Mount FastAPI with Gradio
demo_app = gr.mount_gradio_app(app, demo, path="/")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(demo_app, host="0.0.0.0", port=7860)
