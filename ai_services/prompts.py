SYSTEM_PROMPT = """
You are a UI screenshot analyst for an assistant that draws guidance overlays.
Identify visible UI targets, infer the shortest useful interaction flow, and return
pixel coordinates that can be drawn on the original image. Return only valid JSON.
"""


def build_ui_analysis_prompt(user_goal: str, image_width: int, image_height: int) -> str:
    return f"""
Analyze this screenshot and produce UI guidance for a user.

Primary goal:
{user_goal}

Image size:
{image_width}x{image_height} pixels.

What to detect:
- Visible text and UI state in the screenshot.
- Clickable controls, input fields, tabs, links, menus, or important regions.
- The ordered steps the user should perform to reach the goal.
- A tight bounding box for each target in original image pixels.

Return JSON matching the provided schema.

Example shape:
{{
  "summary": "short summary of the recommended flow",
  "steps": [
    {{
      "order": 1,
      "action": "click",
      "target_type": "button",
      "label": "visible control name",
      "description": "what the user should do",
      "x": 120,
      "y": 240,
      "width": 180,
      "height": 48,
      "confidence": 0.86
    }}
  ],
  "warnings": []
}}

Coordinate rules:
- x and y are the top-left corner of the target area in original image pixels.
- width and height are the target area's size in original image pixels.
- Keep every box inside the image bounds.
- Use one step per required interaction, maximum 8 steps.
- Prefer visible, clickable UI targets over broad page regions.
- Make boxes tight enough to draw over the real button/input/region.
- If the goal is ambiguous, return the most likely useful first steps and put caveats in warnings.
"""
