from pydantic import BaseModel

from ai_services.schemas import UIStep


class AnalyzeResponse(BaseModel):
    source_filename: str | None = None
    image_width: int
    image_height: int
    summary: str = ""
    steps: list[UIStep]
    annotated_image_data_url: str
