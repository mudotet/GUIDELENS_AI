from io import BytesIO

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from PIL import Image, UnidentifiedImageError

from ai_services.openai_vision import analyze_ui_image
from app.core.config import get_settings
from app.schemas.analysis import AnalyzeResponse
from app.services.image_renderer import render_steps_overlay_data_url

router = APIRouter(prefix="/api", tags=["analysis"])

MAX_IMAGE_BYTES = 10 * 1024 * 1024


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_image(
    file: UploadFile = File(...),
    user_goal: str = Form("Guide the user through the next useful UI actions."),
) -> AnalyzeResponse:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Upload must be an image.")

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image is empty.")
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image must be 10 MB or smaller.")

    try:
        with Image.open(BytesIO(image_bytes)) as image:
            image_width, image_height = image.size
    except UnidentifiedImageError as exc:
        raise HTTPException(status_code=400, detail="Invalid image file.") from exc

    settings = get_settings()

    try:
        analysis = await run_in_threadpool(
            analyze_ui_image,
            image_bytes=image_bytes,
            mime_type=file.content_type,
            user_goal=user_goal,
            image_size=(image_width, image_height),
            model=settings.openai_model,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI analysis failed: {exc}") from exc

    annotated_image_data_url = render_steps_overlay_data_url(
        image_bytes=image_bytes,
        steps=analysis.steps,
    )

    return AnalyzeResponse(
        source_filename=file.filename,
        image_width=image_width,
        image_height=image_height,
        summary=analysis.summary,
        steps=analysis.steps,
        annotated_image_data_url=annotated_image_data_url,
    )
