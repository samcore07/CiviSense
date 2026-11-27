import gradio as gr
from fastapi.middleware.cors import CORSMiddleware
from backend.app.main import app as fastapi_app

# 1. ZeroGPU hook so Hugging Face Space detects GPU functionality on startup
try:
    import spaces
    @spaces.GPU
    def _zerogpu_hook():
        return True
except Exception:
    pass

# 2. Build Gradio UI
with gr.Blocks(title="CiviSense AI Workstation") as demo:
    gr.Markdown("# 🛡️ CIVISENSE Multi-Defect Visual Intelligence Engine")
    gr.Markdown(
        "Serving live REST endpoints and WebSockets for YOLO11 defect detection.\n\n"
        "**Status**: Operational & Connected to Vercel."
    )

# 3. Add CORS middleware and attach all FastAPI routes directly to demo.app
demo.app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
demo.app.include_router(fastapi_app.router)

# 4. Launch with strict_cors=False to allow external Vercel frontend requests
if __name__ == "__main__":
    demo.launch(strict_cors=False)
