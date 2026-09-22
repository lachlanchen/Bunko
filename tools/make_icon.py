#!/usr/bin/env python3
"""Draw the Bunko icon: 文 under its own ruby reading, on an indigo tile.

The icon says what the app does in one glance, which no abstract mark would:
a character with its reading floating above it.
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

SERIF = "/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc"
SANS = "/usr/share/fonts/opentype/noto/NotoSansCJK-Medium.ttc"
ROOT = Path(__file__).resolve().parent.parent


def draw(size: int, rounded: bool = True) -> Image.Image:
    scale = size / 512
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas = ImageDraw.Draw(image)

    # Tile with a vertical indigo gradient, drawn by hand so there is no dependency.
    top, bottom = (47, 45, 99), (23, 22, 44)
    for y in range(size):
        t = y / max(1, size - 1)
        canvas.line(
            [(0, y), (size, y)],
            fill=tuple(round(top[i] + (bottom[i] - top[i]) * t) for i in range(3)) + (255,),
        )
    if rounded:
        mask = Image.new("L", (size, size), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1], radius=round(114 * scale), fill=255)
        image.putalpha(mask)
        canvas = ImageDraw.Draw(image)

    canvas.rounded_rectangle(
        [round(34 * scale), round(34 * scale), size - round(34 * scale), size - round(34 * scale)],
        radius=round(86 * scale), outline=(244, 239, 228, 46), width=max(1, round(3 * scale)),
    )

    glyph = ImageFont.truetype(SERIF, round(272 * scale))
    reading = ImageFont.truetype(SANS, round(56 * scale))

    box = canvas.textbbox((0, 0), "文", font=glyph)
    canvas.text(
        ((size - (box[2] - box[0])) / 2 - box[0], round(size * 0.60) - (box[3] - box[1]) / 2 - box[1]),
        "文", font=glyph, fill=(246, 241, 230, 255),
    )
    box = canvas.textbbox((0, 0), "ぶん", font=reading)
    canvas.text(
        ((size - (box[2] - box[0])) / 2 - box[0], round(size * 0.205) - (box[3] - box[1]) / 2 - box[1]),
        "ぶん", font=reading, fill=(224, 122, 90, 255),
    )
    return image


if __name__ == "__main__":
    for size, path in (
        (192, ROOT / "public/icon-192.png"),
        (512, ROOT / "public/icon-512.png"),
        (1024, ROOT / "assets/icon.png"),
    ):
        path.parent.mkdir(parents=True, exist_ok=True)
        draw(size).save(path)
        print("wrote", path.relative_to(ROOT), f"{size}x{size}")
    # Capacitor wants a square, full-bleed source for the native icon and splash.
    square = draw(1024, rounded=False)
    square.save(ROOT / "assets/icon-foreground.png")
    splash = Image.new("RGB", (2732, 2732), (23, 22, 44))
    mark = draw(900, rounded=False).convert("RGBA")
    splash.paste(mark, ((2732 - 900) // 2, (2732 - 900) // 2), mark)
    splash.save(ROOT / "assets/splash.png")
    print("wrote assets/icon-foreground.png and assets/splash.png")
