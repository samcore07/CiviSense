import cv2
import numpy as np
import gradio as gr

# Import spaces for Hugging Face ZeroGPU dynamic allocation
try:
    import spaces
    has_spaces = True
except ImportError:
    has_spaces = False

from backend.app.vision import (
    load_models,
    detect_all,
    draw_detections,
    detect_objects,
    pothole_model,
    waterlogging_model,
    garbage_model,
    CONFIDENCE_THRESHOLD,
    WATERLOGGING_CONFIDENCE_THRESHOLD,
    GARBAGE_CONFIDENCE_THRESHOLD,
    normalize_garbage_name
)

# Pre-load YOLO models into memory
load_models()

def _run_inference(image, target_model="all"):
    if image is None:
        return None, "Please upload a road photograph."

    # Convert RGB to BGR for OpenCV processing
    frame = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    potholes, waterlogging, garbage = [], [], []

    if target_model == "potholes":
        potholes = detect_objects(frame, pothole_model, conf=CONFIDENCE_THRESHOLD)
    elif target_model == "waterlogging":
        waterlogging = detect_objects(
            frame, waterlogging_model, conf=WATERLOGGING_CONFIDENCE_THRESHOLD, max_area_ratio=0.70
        )
    elif target_model == "garbage":
        garbage = detect_objects(
            frame, garbage_model, conf=GARBAGE_CONFIDENCE_THRESHOLD, normalize_fn=normalize_garbage_name
        )
    else:
        potholes, waterlogging, garbage = detect_all(frame)

    annotated = frame.copy()
    annotated = draw_detections(annotated, potholes, (255, 130, 0))
    annotated = draw_detections(annotated, waterlogging, (0, 180, 245))
    annotated = draw_detections(annotated, garbage, (0, 220, 120))

    annotated_rgb = cv2.cvtColor(annotated, cv2.COLOR_BGR2RGB)
    
    total = len(potholes) + len(waterlogging) + len(garbage)
    summary = (
        f"✅ Detections Complete: {total} total defects found.\n"
        f"• Potholes: {len(potholes)}\n"
        f"• Waterlogging: {len(waterlogging)}\n"
        f"• Garbage / Waste: {len(garbage)}"
    )
    return annotated_rgb, summary

# Decorate inference with spaces.GPU for ZeroGPU dynamic hardware
if has_spaces:
    predict = spaces.GPU(_run_inference)
else:
    predict = _run_inference

with gr.Blocks(title="CiviSense AI Workstation") as demo:
    gr.Markdown("# 🛡️ CIVISENSE Multi-Defect Visual Intelligence")
    gr.Markdown("Real-time GPU-accelerated triage for potholes, waterlogging, and municipal garbage.")
    
    with gr.Row():
        with gr.Column():
            input_img = gr.Image(type="numpy", label="Upload Road Image")
            model_choice = gr.Radio(
                choices=["all", "potholes", "waterlogging", "garbage"],
                value="all",
                label="Target Defect Model"
            )
            btn = gr.Button("🔍 Run AI Detection", variant="primary")
        
        with gr.Column():
            output_img = gr.Image(type="numpy", label="AI Annotated Defect Map")
            output_text = gr.Textbox(label="Analysis Summary", lines=4)

    btn.click(fn=predict, inputs=[input_img, model_choice], outputs=[output_img, output_text])

if __name__ == "__main__":
    demo.launch()
