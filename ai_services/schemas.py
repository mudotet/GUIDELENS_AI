from pydantic import BaseModel, Field


class UIStep(BaseModel):
    order: int = Field(..., ge=1)
    action: str = Field(..., min_length=1)
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
