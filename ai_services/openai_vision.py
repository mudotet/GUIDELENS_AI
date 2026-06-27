import base64
import json
import os

from openai import OpenAI

from ai_services.prompts import SYSTEM_PROMPT, build_ui_analysis_prompt
from ai_services.schemas import UIAnalysis


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


def analyze_ui_image(
    *,
    image_bytes: bytes,
    mime_type: str,
    user_goal: str,
    image_size: tuple[int, int],
    model: str | None = None,
) -> UIAnalysis:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is missing.")

    image_width, image_height = image_size
    client = OpenAI(api_key=api_key)
    selected_model = model or os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    response = client.chat.completions.create(
        model=selected_model,
        temperature=0.1,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": build_ui_analysis_prompt(
                            user_goal=user_goal,
                            image_width=image_width,
                            image_height=image_height,
                        ),
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": _image_to_data_url(image_bytes, mime_type)},
                    },
                ],
            },
        ],
    )

    content = response.choices[0].message.content or "{}"
    return UIAnalysis.model_validate(_parse_json_content(content))
