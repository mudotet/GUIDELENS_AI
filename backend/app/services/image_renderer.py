import base64
from io import BytesIO

from PIL import Image, ImageDraw, ImageFont

from ai_services.schemas import UIStep


def _font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    candidates = (
        "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    )
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def _clamp_box(step: UIStep, image_width: int, image_height: int) -> tuple[int, int, int, int]:
    x1 = max(0, min(step.x, image_width - 1))
    y1 = max(0, min(step.y, image_height - 1))
    x2 = max(x1 + 1, min(step.x + step.width, image_width))
    y2 = max(y1 + 1, min(step.y + step.height, image_height))
    return x1, y1, x2, y2


def render_steps_overlay_data_url(image_bytes: bytes, steps: list[UIStep]) -> str:
    with Image.open(BytesIO(image_bytes)) as source:
        image = source.convert("RGBA")

    image_width, image_height = image.size
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    label_font = _font(max(14, image_width // 80), bold=True)
    text_font = _font(max(12, image_width // 110), bold=False)

    accent = (37, 99, 235, 255)
    accent_fill = (37, 99, 235, 38)
    label_fill = (255, 255, 255, 255)
    shadow = (15, 23, 42, 150)

    for step in sorted(steps, key=lambda item: item.order):
        x1, y1, x2, y2 = _clamp_box(step, image_width, image_height)
        line_width = max(3, image_width // 350)

        draw.rounded_rectangle(
            (x1, y1, x2, y2),
            radius=max(6, line_width * 2),
            fill=accent_fill,
            outline=accent,
            width=line_width,
        )

        badge_text = str(step.order)
        badge_radius = max(13, image_width // 95)
        badge_x = max(badge_radius + 4, x1)
        badge_y = max(badge_radius + 4, y1)
        draw.ellipse(
            (
                badge_x - badge_radius,
                badge_y - badge_radius,
                badge_x + badge_radius,
                badge_y + badge_radius,
            ),
            fill=accent,
            outline=label_fill,
            width=max(2, line_width - 1),
        )
        text_box = draw.textbbox((0, 0), badge_text, font=label_font)
        draw.text(
            (
                badge_x - (text_box[2] - text_box[0]) / 2,
                badge_y - (text_box[3] - text_box[1]) / 2 - 1,
            ),
            badge_text,
            font=label_font,
            fill=label_fill,
        )

        caption = f"{step.action}: {step.label}"
        caption_box = draw.textbbox((0, 0), caption, font=text_font)
        caption_width = caption_box[2] - caption_box[0]
        caption_height = caption_box[3] - caption_box[1]
        pad_x = 8
        pad_y = 5
        caption_x = min(max(4, x1), max(4, image_width - caption_width - pad_x * 2 - 4))
        caption_y = y2 + 8
        if caption_y + caption_height + pad_y * 2 > image_height:
            caption_y = max(4, y1 - caption_height - pad_y * 2 - 8)

        draw.rounded_rectangle(
            (
                caption_x + 2,
                caption_y + 2,
                caption_x + caption_width + pad_x * 2 + 2,
                caption_y + caption_height + pad_y * 2 + 2,
            ),
            radius=6,
            fill=shadow,
        )
        draw.rounded_rectangle(
            (
                caption_x,
                caption_y,
                caption_x + caption_width + pad_x * 2,
                caption_y + caption_height + pad_y * 2,
            ),
            radius=6,
            fill=accent,
        )
        draw.text(
            (caption_x + pad_x, caption_y + pad_y - 1),
            caption,
            font=text_font,
            fill=label_fill,
        )

    composed = Image.alpha_composite(image, overlay).convert("RGB")
    output = BytesIO()
    composed.save(output, format="PNG")
    encoded = base64.b64encode(output.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded}"
