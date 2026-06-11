import base64
import io
import os
import random


PIPELINE = None
PIPELINE_MODEL = None


def _load_pipeline(model_id):
    try:
        import torch
        from diffusers import StableDiffusionPipeline
    except ImportError as exc:
        raise RuntimeError(
            "Stable Diffusion dependencies are not installed. "
            "Install the optional GPU requirements first."
        ) from exc

    device = "cuda" if torch.cuda.is_available() else "cpu"
    dtype = torch.float16 if device == "cuda" else torch.float32
    pipe = StableDiffusionPipeline.from_pretrained(
        model_id,
        torch_dtype=dtype,
        safety_checker=None,
        requires_safety_checker=False,
    )
    pipe = pipe.to(device)
    pipe.enable_attention_slicing()
    return pipe


def generate_stable_diffusion_image(prompt, negative_prompt="", width=512, height=768, steps=25, guidance=7.5, seed=None):
    global PIPELINE, PIPELINE_MODEL

    model_id = os.getenv("SD_MODEL_ID", "runwayml/stable-diffusion-v1-5")
    if PIPELINE is None or PIPELINE_MODEL != model_id:
        PIPELINE = _load_pipeline(model_id)
        PIPELINE_MODEL = model_id

    import torch

    device = "cuda" if torch.cuda.is_available() else "cpu"
    seed = int(seed if seed is not None else random.randint(0, 2**31 - 1))
    generator = torch.Generator(device=device).manual_seed(seed)
    image = PIPELINE(
        prompt=prompt,
        negative_prompt=negative_prompt or "low quality, blurry, watermark, distorted text",
        width=int(width),
        height=int(height),
        num_inference_steps=int(steps),
        guidance_scale=float(guidance),
        generator=generator,
    ).images[0]

    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    return {
        "image": f"data:image/png;base64,{encoded}",
        "model": model_id,
        "seed": seed,
        "width": int(width),
        "height": int(height),
        "steps": int(steps),
        "guidance": float(guidance),
    }
