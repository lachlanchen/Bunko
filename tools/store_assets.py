#!/usr/bin/env python3
"""Compose the Play and App Store artwork from real captures of the app.

Nothing here is a mock-up: each panel is a screenshot of the running reader,
placed on the app's own paper colour with one line of copy above it.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SHOTS = Path('/tmp/claude-1000/-home-lachlan-ProjectsLFS-ZhJpBook/f7c475b4-4e96-42bf-b3b3-46fed85dbc97/scratchpad/shots')
OUT = ROOT / 'store' / 'assets'
SERIF = '/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc'
SANS = '/usr/share/fonts/opentype/noto/NotoSansCJK-Medium.ttc'

PAPER = (250, 247, 241)
INK = (28, 27, 34)
INK_SOFT = (85, 82, 95)
INDIGO = (58, 56, 120)
CORAL = (194, 85, 60)

PANELS = [
    ('reader', 'A reading above every character', 'Pinyin for Chinese, furigana for Japanese'),
    ('reader-ja', '漱石も、杜甫も、原文で', 'The original text, with the reading you need'),
    ('lib', '56 classics, free of copyright', 'Chinese canon, Japanese literature, world classics'),
    ('settings', 'Show one language, or three', 'Interlinear, paragraph by paragraph, or source alone'),
    ('book', 'Download once, read anywhere', 'Every book works with the network off'),
]


def panel(shot_name: str, headline: str, sub: str, size=(1080, 1920)) -> Image.Image:
    width, height = size
    scale = width / 1080
    canvas = Image.new('RGB', size, PAPER)
    draw = ImageDraw.Draw(canvas)

    # a soft indigo wash at the top, so the copy has somewhere to sit
    wash = Image.new('RGB', (width, int(620 * scale)), INDIGO)
    mask = Image.linear_gradient('L').resize((width, int(620 * scale)))
    canvas.paste(wash, (0, 0), mask.point(lambda v: int((255 - v) * 0.10)))

    f_head = ImageFont.truetype(SERIF, int(58 * scale))
    f_sub = ImageFont.truetype(SANS, int(30 * scale))

    y = int(96 * scale)
    for line in wrap(draw, headline, f_head, width - int(150 * scale)):
        w = draw.textlength(line, font=f_head)
        draw.text(((width - w) / 2, y), line, font=f_head, fill=INK)
        y += int(76 * scale)
    y += int(10 * scale)
    for line in wrap(draw, sub, f_sub, width - int(170 * scale)):
        w = draw.textlength(line, font=f_sub)
        draw.text(((width - w) / 2, y), line, font=f_sub, fill=INK_SOFT)
        y += int(42 * scale)

    shot = Image.open(SHOTS / f'{shot_name}.png').convert('RGB')
    top = y + int(46 * scale)
    shot_w = int(width * 0.80)
    shot_h = int(shot.height * shot_w / shot.width)
    available = height - top - int(40 * scale)
    shot = shot.resize((shot_w, shot_h), Image.LANCZOS)
    if shot_h > available:
        shot = shot.crop((0, 0, shot_w, available))
        shot_h = available
    radius = int(34 * scale)
    corner = Image.new('L', (shot_w, shot_h), 0)
    ImageDraw.Draw(corner).rounded_rectangle((0, 0, shot_w - 1, shot_h - 1), radius=radius, fill=255)
    x = (width - shot_w) // 2
    shadow = Image.new('RGBA', size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(
        (x - 4, top + int(14 * scale), x + shot_w + 4, top + shot_h + int(26 * scale)),
        radius=radius, fill=(28, 27, 34, 70))
    shadow = shadow.filter(ImageFilter.GaussianBlur(int(26 * scale)))
    canvas = Image.alpha_composite(canvas.convert('RGBA'), shadow).convert('RGB')
    canvas.paste(shot, (x, top), corner)
    return canvas


def wrap(draw, text, font, max_width):
    words, lines, line = text.split(' '), [], ''
    if not any(ch == ' ' for ch in text):      # CJK copy has no spaces to break on
        return [text]
    for word in words:
        trial = f'{line} {word}'.strip()
        if draw.textlength(trial, font=font) <= max_width:
            line = trial
        else:
            lines.append(line); line = word
    if line: lines.append(line)
    return lines


def feature_graphic() -> Image.Image:
    width, height = 1024, 500
    canvas = Image.new('RGB', (width, height), (23, 22, 44))
    draw = ImageDraw.Draw(canvas)
    for y in range(height):
        t = y / height
        draw.line([(0, y), (width, y)],
                  fill=(round(47 - 24 * t), round(45 - 23 * t), round(99 - 55 * t)))
    glyph = ImageFont.truetype(SERIF, 200)
    reading = ImageFont.truetype(SANS, 40)
    box = draw.textbbox((0, 0), '文庫', font=glyph)
    gx = 92
    draw.text((gx, 250 - (box[3] - box[1]) / 2 - box[1]), '文庫', font=glyph, fill=(246, 241, 230))
    draw.text((gx + 18, 96), 'ぶん', font=reading, fill=(224, 122, 90))
    draw.text((gx + 224, 96), 'こ', font=reading, fill=(224, 122, 90))
    title = ImageFont.truetype(SERIF, 62)
    sub = ImageFont.truetype(SANS, 30)
    draw.text((560, 176), 'Bunko', font=title, fill=(246, 241, 230))
    draw.text((562, 264), 'Classics with a reading', font=sub, fill=(196, 192, 220))
    draw.text((562, 306), 'above every character', font=sub, fill=(196, 192, 220))
    return canvas


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    for index, (shot_name, headline, sub) in enumerate(PANELS, start=1):
        if not (SHOTS / f'{shot_name}.png').exists():
            print('skip', shot_name); continue
        panel(shot_name, headline, sub).save(OUT / f'play-phone-{index:02d}.png', optimize=True)
        panel(shot_name, headline, sub, size=(1242, 2688)).save(OUT / f'ios-65-{index:02d}.png', optimize=True)
        print('wrote', f'play-phone-{index:02d}.png')
    feature_graphic().save(OUT / 'play-feature.png', optimize=True)
    Image.open(ROOT / 'public/icon-512.png').convert('RGB').save(OUT / 'play-icon.png')
    print('wrote play-feature.png and play-icon.png')
