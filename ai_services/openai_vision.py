import base64
import json
import os
from typing import Any

from openai import OpenAI

from ai_services.prompts import SYSTEM_PROMPT, build_ui_analysis_prompt
from ai_services.schemas import UI_ANALYSIS_JSON_SCHEMA, UIAnalysis, UIStep


def _image_to_data_url(image_bytes: bytes, mime_type: str) -> str:
    encoded = base64.b64encode(image_bytes).decode("ascii")
    return f"data:{mime_type};base64,{encoded}"


def _parse_json_content(content: str) -> dict:
    cleaned = content.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:].strip()
    return json.loads(cleaned)


def _extract_output_text(response: Any) -> str:
    output_text = getattr(response, "output_text", None)
    if output_text:
        return output_text

    chunks: list[str] = []
    for output_item in getattr(response, "output", []) or []:
        for content_item in getattr(output_item, "content", []) or []:
            text = getattr(content_item, "text", None)
            if text:
                chunks.append(text)
    return "".join(chunks)


def _normalize_steps(analysis: UIAnalysis, image_size: tuple[int, int]) -> UIAnalysis:
    image_width, image_height = image_size
    normalized_steps: list[UIStep] = []

    for order, step in enumerate(sorted(analysis.steps, key=lambda item: item.order), start=1):
        x = max(0, min(step.x, image_width - 1))
        y = max(0, min(step.y, image_height - 1))
        width = max(1, min(step.width, image_width - x))
        height = max(1, min(step.height, image_height - y))

        normalized_steps.append(
            step.model_copy(
                update={
                    "order": order,
                    "x": x,
                    "y": y,
                    "width": width,
                    "height": height,
                }
            )
        )

    return analysis.model_copy(update={"steps": normalized_steps[:8]})


def analyze_ui_image(
    *,
    image_bytes: bytes,
    mime_type: str,
    user_goal: str,
    image_size: tuple[int, int],
    model: str | None = None,
    api_key: str | None = None,
) -> UIAnalysis:
    resolved_api_key = api_key or os.getenv("OPENAI_API_KEY") or os.getenv("OPEN_AI_KEY") or os.getenv("OPEN_API_KEY")
    if not resolved_api_key:
        raise RuntimeError("OPENAI_API_KEY, OPEN_AI_KEY, or OPEN_API_KEY is missing.")

    image_width, image_height = image_size
    client = OpenAI(api_key=resolved_api_key)
    selected_model = model or os.getenv("OPENAI_MODEL") or os.getenv("OPEN_AI_MODEL") or "gpt-5.5-pro"

    response = client.responses.create(
        model=selected_model,
        instructions=SYSTEM_PROMPT,
        input=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": build_ui_analysis_prompt(
                            user_goal=user_goal,
                            image_width=image_width,
                            image_height=image_height,
                        ),
                    },
                    {
                        "type": "input_image",
                        "image_url": _image_to_data_url(image_bytes, mime_type),
                    },
                ],
            },
        ],
        text={
            "format": {
                "type": "json_schema",
                "name": "ui_analysis",
                "schema": UI_ANALYSIS_JSON_SCHEMA,
                "strict": True,
            }
        },
        max_output_tokens=3000,
    )

    content = _extract_output_text(response)
    analysis = UIAnalysis.model_validate(_parse_json_content(content))
    return _normalize_steps(analysis, image_size)
