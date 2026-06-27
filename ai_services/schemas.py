from pydantic import BaseModel, Field


class UIStep(BaseModel):
    order: int = Field(..., ge=1)
    action: str = Field(..., min_length=1)
    target_type: str = Field(default="button", min_length=1)
    label: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    x: int = Field(..., ge=0)
    y: int = Field(..., ge=0)
    width: int = Field(..., ge=1)
    height: int = Field(..., ge=1)
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)


class UIAnalysis(BaseModel):
    summary: str = ""
    steps: list[UIStep] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


UI_ANALYSIS_JSON_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["summary", "steps", "warnings"],
    "properties": {
        "summary": {
            "type": "string",
            "description": "A concise description of the detected user flow.",
        },
        "warnings": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Short caveats when the screenshot or goal is ambiguous.",
        },
        "steps": {
            "type": "array",
            "minItems": 1,
            "maxItems": 8,
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "order",
                    "action",
                    "target_type",
                    "label",
                    "description",
                    "x",
                    "y",
                    "width",
                    "height",
                    "confidence",
                ],
                "properties": {
                    "order": {"type": "integer", "minimum": 1},
                    "action": {
                        "type": "string",
                        "enum": ["click", "type", "select", "scroll", "drag", "read", "wait"],
                    },
                    "target_type": {
                        "type": "string",
                        "enum": ["button", "input", "link", "menu", "tab", "checkbox", "radio", "text", "region", "other"],
                    },
                    "label": {"type": "string"},
                    "description": {"type": "string"},
                    "x": {"type": "integer", "minimum": 0},
                    "y": {"type": "integer", "minimum": 0},
                    "width": {"type": "integer", "minimum": 1},
                    "height": {"type": "integer", "minimum": 1},
                    "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                },
            },
        },
    },
}
