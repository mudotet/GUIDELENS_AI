SYSTEM_PROMPT = """
You analyze UI screenshots and produce clear step-by-step guidance.
Return only valid JSON. Do not include markdown, commentary, or code fences.
"""


def build_ui_analysis_prompt(user_goal: str, image_width: int, image_height: int) -> str:
    return f"""
Analyze this UI screenshot and identify the most likely buttons, fields, or controls
the user should interact with to complete this goal:

Goal: {user_goal}

Image size: {image_width}x{image_height} pixels.

Return JSON with this exact shape:
{{
  "summary": "short summary",
  "steps": [
    {{
      "order": 1,
      "action": "click",
      "label": "visible control name",
      "description": "what the user should do",
      "x": 120,
      "y": 240,
      "width": 180,
      "height": 48,
      "confidence": 0.86
    }}
  ]
}}

Coordinate rules:
- x and y are the top-left corner of the target area in original image pixels.
- width and height are the target area's size in original image pixels.
- Keep every box inside the image bounds.
- Use one step per required interaction.
- Prefer visible, clickable UI targets over broad page regions.
- If the task is ambiguous, return the most likely useful first steps.
"""
