from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE_BRAND = ROOT / "imgs" / "해피닥터-og이미지.png"
SOURCE_CHAT = ROOT / "imgs" / "해피닥터-앱스크린샷.png"

OUTPUT_BRAND = ROOT / "frontend" / "homepage" / "public" / "design" / "brand-og.png"
OUTPUT_CHAT = ROOT / "frontend" / "homepage" / "public" / "design" / "chat-preview.png"
OUTPUT_APP = ROOT / "frontend" / "app" / "public" / "app-screenshot.png"

FONT_REGULAR = Path(r"C:\Windows\Fonts\malgun.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\malgunbd.ttf")


def load_font(size: int, *, bold: bool = False) -> ImageFont.FreeTypeFont:
    path = FONT_BOLD if bold else FONT_REGULAR
    return ImageFont.truetype(str(path), size=size)


def resize_cover(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    target_w, target_h = size
    src_w, src_h = image.size
    scale = max(target_w / src_w, target_h / src_h)
    resized = image.resize((int(src_w * scale), int(src_h * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - target_w) // 2
    top = (resized.height - target_h) // 2
    return resized.crop((left, top, left + target_w, top + target_h))


def add_shadow(image: Image.Image, box: tuple[int, int, int, int], blur: int = 18, alpha: int = 90) -> None:
    shadow = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(shadow)
    draw.rounded_rectangle(box, radius=28, fill=(13, 34, 61, alpha))
    shadow = shadow.filter(ImageFilter.GaussianBlur(blur))
    image.alpha_composite(shadow)


def draw_brand_og() -> None:
    base = resize_cover(Image.open(SOURCE_BRAND).convert("RGBA"), (1200, 630))
    panel_box = (58, 430, 1142, 604)

    add_shadow(base, panel_box, blur=18, alpha=100)

    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    draw.rounded_rectangle(panel_box, radius=28, fill=(15, 47, 89, 218))
    draw.rounded_rectangle((92, 455, 336, 499), radius=22, fill=(244, 204, 61, 255))

    badge_font = load_font(18, bold=True)
    title_font = load_font(48, bold=True)
    body_font = load_font(21, bold=False)

    draw.text((118, 462), "무료 온라인 의료상담", font=badge_font, fill=(17, 53, 98, 255))
    title_position = (92, 507)
    title_text = "의료 접근성 취약계층을 위해"
    body_text = "AI 인턴 보듬이와 자원봉사 의료진이 함께 움직입니다."

    draw.text(title_position, title_text, font=title_font, fill=(255, 255, 255, 255))

    title_bounds = draw.textbbox(title_position, title_text, font=title_font)
    body_position = (92, title_bounds[3] + 16)
    draw.text(body_position, body_text, font=body_font, fill=(224, 236, 250, 255))

    result = Image.alpha_composite(base, overlay)
    result.save(OUTPUT_BRAND, format="PNG", optimize=True)


def draw_chat_preview() -> Image.Image:
    base = Image.open(SOURCE_CHAT).convert("RGBA")
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    bubble_box = (610, 478, 846, 582)
    draw.rounded_rectangle(bubble_box, radius=20, fill=(255, 255, 255, 252), outline=(16, 95, 165, 255), width=4)

    reply_font = load_font(18, bold=False)
    draw.multiline_text(
        (632, 497),
        "복통이 며칠째 계속돼요.\n어떻게 해야 하나요?",
        font=reply_font,
        fill=(33, 41, 58, 255),
        spacing=6,
    )

    result = Image.alpha_composite(base, overlay)
    result.save(OUTPUT_CHAT, format="PNG", optimize=True)
    return result


def draw_app_share(chat_preview: Image.Image) -> None:
    canvas = Image.new("RGBA", (1200, 630), (235, 246, 255, 255))
    gradient = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    grad_draw = ImageDraw.Draw(gradient)
    grad_draw.ellipse((-120, -140, 620, 500), fill=(190, 222, 248, 180))
    grad_draw.ellipse((720, 60, 1320, 700), fill=(171, 214, 246, 140))
    grad_draw.rounded_rectangle((0, 0, 1200, 630), radius=0, fill=(235, 246, 255, 255))
    canvas.alpha_composite(gradient.filter(ImageFilter.GaussianBlur(40)))

    panel_shadow_box = (68, 108, 620, 524)
    add_shadow(canvas, panel_shadow_box, blur=22, alpha=60)

    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    draw.rounded_rectangle((70, 110, 618, 520), radius=34, fill=(255, 255, 255, 236))
    draw.rounded_rectangle((108, 146, 206, 190), radius=22, fill=(244, 204, 61, 255))

    badge_font = load_font(20, bold=True)
    title_font = load_font(36, bold=True)
    body_font = load_font(22, bold=False)

    draw.text((137, 154), "앱", font=badge_font, fill=(17, 53, 98, 255))
    draw.text((108, 220), "카카오톡으로 시작하고", font=title_font, fill=(20, 54, 93, 255))
    draw.text((108, 272), "앱에서 상담 흐름 다시 확인", font=title_font, fill=(20, 54, 93, 255))
    draw.multiline_text(
        (108, 344),
        "보듬이와 자원봉사 의료진이 함께하는\n해피닥터 의료상담 앱",
        font=body_font,
        fill=(68, 92, 122, 255),
        spacing=10,
    )

    canvas = Image.alpha_composite(canvas, overlay)

    phone_crop = chat_preview.crop((470, 38, 896, 728))
    phone_image = resize_cover(phone_crop, (414, 500))

    phone_shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    phone_shadow_draw = ImageDraw.Draw(phone_shadow)
    phone_shadow_draw.rounded_rectangle((714, 74, 1118, 556), radius=42, fill=(13, 34, 61, 76))
    phone_shadow = phone_shadow.filter(ImageFilter.GaussianBlur(18))
    canvas.alpha_composite(phone_shadow)

    phone_frame = Image.new("RGBA", (430, 516), (0, 0, 0, 0))
    frame_draw = ImageDraw.Draw(phone_frame)
    frame_draw.rounded_rectangle((0, 0, 430, 516), radius=44, fill=(248, 252, 255, 255))
    frame_draw.rounded_rectangle((16, 16, 414, 500), radius=34, fill=(223, 239, 252, 255))
    phone_frame.alpha_composite(phone_image, (16, 16))

    canvas.alpha_composite(phone_frame, (700, 62))
    canvas.save(OUTPUT_APP, format="PNG", optimize=True)


def main() -> None:
    for path in (SOURCE_BRAND, SOURCE_CHAT, FONT_REGULAR, FONT_BOLD):
        if not path.exists():
            raise FileNotFoundError(path)

    draw_brand_og()
    chat_preview = draw_chat_preview()
    draw_app_share(chat_preview)
    print("updated:")
    print(OUTPUT_BRAND)
    print(OUTPUT_CHAT)
    print(OUTPUT_APP)


if __name__ == "__main__":
    main()
