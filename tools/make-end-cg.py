# -*- coding: utf-8 -*-
"""结算 CG（四档默契各一张 · 三人合影版）

用法：python tools/make-end-cg.py
产出：assets/cg/cg-end-{cold,timid,warm,close}.jpg

构图：场景背景（双色调、提亮）+ 三张「漫画照片卡」错落叠放。
照片卡带米白相框边 + 墨线 + 投影，和对话里的头像卡是同一套语言，
因此不会像把人直接抠图贴上去。
"""
import os
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BG = os.path.join(ROOT, "assets", "bg")
FACE = os.path.join(ROOT, "assets", "face")
OUT = os.path.join(ROOT, "assets", "cg")
os.makedirs(OUT, exist_ok=True)

W, H = 1600, 1000
INK = (26, 34, 44)
CREAM = (248, 242, 228)

# key, 背景, 提亮, 暖/冷, 三张卡的 (x, 底边y, 尺寸, 角度)
VARIANTS = [
    ("cg-end-cold",  "station.jpg",    1.16, (206, 218, 232), 0.86,
     [(0.30, 0.90, 300, -7), (0.52, 0.93, 320, 2), (0.74, 0.90, 300, 7)]),
    ("cg-end-timid", "cafe-in.jpg",    1.55, (244, 234, 212), 0.72,
     [(0.31, 0.90, 300, -6), (0.53, 0.93, 320, 1), (0.75, 0.90, 300, 6)]),
    ("cg-end-warm",  "street-out.jpg", 1.10, (252, 238, 206), 0.88,
     [(0.30, 0.91, 320, -5), (0.52, 0.94, 340, 0), (0.74, 0.91, 320, 5)]),
    ("cg-end-close", "night-city.jpg", 1.02, (255, 232, 180), 0.98,
     [(0.29, 0.92, 340, -4), (0.52, 0.95, 360, 0), (0.75, 0.92, 340, 4)]),
]

ORDER = ["zq", "lb", "cq"]   # 左中右


def fit_cover(im, w, h, focus=0.45):
    s = max(w / im.width, h / im.height)
    im = im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))), Image.LANCZOS)
    left = (im.width - w) // 2
    top = int((im.height - h) * focus)
    return im.crop((left, top, left + w, top + h))


def brighten(im, lift, tint, gamma=0.76):
    im = ImageEnhance.Brightness(im).enhance(lift)
    im = Image.blend(im, Image.new("RGB", im.size, tint), 0.14)
    lut = [min(255, int(255 * ((i / 255) ** gamma))) for i in range(256)]
    im = im.point(lut * 3)
    im = ImageEnhance.Color(im).enhance(0.62)
    return im


def photo_card(path, size, angle):
    """米白相框 + 墨线 + 投影，旋转后返回 RGBA"""
    pad = int(size * 0.06)
    canvas_size = size + pad * 2
    card = Image.new("RGBA", (canvas_size, canvas_size), CREAM + (255,))
    img = Image.open(path).convert("RGB").resize((size, size), Image.LANCZOS)
    card.paste(img, (pad, pad))

    d = ImageDraw.Draw(card)
    d.rectangle((0, 0, canvas_size - 1, canvas_size - 1), outline=INK, width=5)
    d.rectangle((pad - 3, pad - 3, pad + size + 2, pad + size + 2), outline=INK, width=3)

    # 投影
    shadow = Image.new("RGBA", (canvas_size + 40, canvas_size + 40), (0, 0, 0, 0))
    sil = Image.new("RGBA", card.size, (0, 0, 0, 150))
    sil.putalpha(card.getchannel("A").point(lambda a: int(a * 0.55)))
    shadow.paste(sil, (20, 24))
    shadow = shadow.filter(ImageFilter.GaussianBlur(14))

    out = Image.new("RGBA", shadow.size, (0, 0, 0, 0))
    out.alpha_composite(shadow)
    out.alpha_composite(card, (20, 20))
    return out.rotate(angle, resample=Image.BICUBIC, expand=True)


def halftone(img, dot=6, strength=0.14):
    g = ImageOps.grayscale(img)
    small = g.resize((max(1, img.width // dot), max(1, img.height // dot)), Image.LANCZOS)
    dots = Image.new("L", img.size, 0)
    d = ImageDraw.Draw(dots)
    for y in range(0, img.height, dot):
        for x in range(0, img.width, dot):
            v = 255 - small.getpixel((min(small.width - 1, x // dot), min(small.height - 1, y // dot)))
            r = int(dot * 0.55 * (v / 255))
            if r >= 1:
                d.ellipse((x + dot // 2 - r, y + dot // 2 - r,
                           x + dot // 2 + r, y + dot // 2 + r), fill=255)
    mask = dots.point(lambda p: int(p * strength))
    return Image.composite(Image.new("RGB", img.size, INK), img, mask)


for name, bg, lift, tint, gamma, cards in VARIANTS:
    base = fit_cover(Image.open(os.path.join(BG, bg)).convert("RGB"), W, H)
    base = brighten(base, lift, tint, gamma)
    canvas = base.convert("RGBA")

    for key, (cx, by, size, angle) in zip(ORDER, cards):
        card = photo_card(os.path.join(FACE, key + ".jpg"), size, angle)
        x = int(W * cx - card.width / 2)
        y = int(H * by - card.height)
        canvas.alpha_composite(card, (x, y))

    img = canvas.convert("RGB")
    img = halftone(img, dot=6, strength=0.14)

    vig = Image.new("L", img.size, 0)
    d = ImageDraw.Draw(vig)
    d.ellipse((-W * 0.10, -H * 0.16, W * 1.10, H * 1.16), fill=255)
    vig = ImageOps.invert(vig).point(lambda p: int(p * 0.22))
    img = Image.composite(Image.new("RGB", img.size, (32, 38, 46)), img, vig)

    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, W - 1, H - 1), outline=INK, width=14)

    img.save(os.path.join(OUT, name + ".jpg"), "JPEG", quality=86, optimize=True)
    lum = sum(ImageOps.grayscale(img).tobytes()) / (W * H)
    print(f"  OK {name}.jpg  亮度 {lum:.0f}")
