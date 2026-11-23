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
CHAR = os.path.join(ROOT, "assets", "char")
OUT = os.path.join(ROOT, "assets", "cg")
os.makedirs(OUT, exist_ok=True)

W, H = 1600, 1000
INK = (26, 34, 44)
CREAM = (248, 242, 228)

# key, 背景, 提亮, 暖/冷, 三张卡的 (x, 底边y, 尺寸, 角度)
VARIANTS = [
    ("cg-end-cold",  "station.jpg",    1.05, (206, 218, 232), 0.95,
     [(0.30, 0.90, 300, -7), (0.52, 0.93, 320, 2), (0.74, 0.90, 300, 7)]),
    ("cg-end-timid", "cafe-in.jpg",    1.10, (244, 234, 212), 0.92,
     [(0.31, 0.90, 300, -6), (0.53, 0.93, 320, 1), (0.75, 0.90, 300, 6)]),
    ("cg-end-warm",  "street-out.jpg", 1.02, (252, 238, 206), 0.96,
     [(0.30, 0.91, 320, -5), (0.52, 0.94, 340, 0), (0.74, 0.91, 320, 5)]),
    ("cg-end-close", "night-city.jpg", 1.04, (255, 232, 180), 0.98,
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
    im = Image.blend(im, Image.new("RGB", im.size, tint), 0.07)
    lut = [min(255, int(255 * ((i / 255) ** gamma))) for i in range(256)]
    im = im.point(lut * 3)
    im = ImageEnhance.Color(im).enhance(0.62)
    return im


def sprite(path, height_ratio, mirror=False):
    """透明立绘 + 柔和接地投影"""
    ch = Image.open(path).convert("RGBA")
    th = int(H * height_ratio)
    tw = max(1, int(ch.width * th / ch.height))
    ch = ch.resize((tw, th), Image.LANCZOS)
    if mirror:
        ch = ImageOps.mirror(ch)
    return ch


def place(canvas, ch, cx_ratio, base_ratio):
    x = int(W * cx_ratio - ch.width / 2)
    y = int(H * base_ratio - ch.height)
    sh = Image.new("RGBA", ch.size, (0, 0, 0, 0))
    sh.putalpha(ch.getchannel("A").point(lambda a: int(a * 0.45)))
    sh = sh.filter(ImageFilter.GaussianBlur(12))
    canvas.alpha_composite(sh, (x + 6, y + 10))
    canvas.alpha_composite(ch, (x, y))

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

    # (取景框高度比例, 显示高度)：按头部大小对齐，而不是按图片高度
    # 赵祈岳站得远（小），刘博康与蔡奇衡在前景（大）
    look = {"zq": (1.00, 0.50), "lb": (1.00, 0.78), "cq": (1.00, 0.72)}
    for key, (cx, by, size, angle) in zip(ORDER, cards):
        ch = sprite(os.path.join(CHAR, key + ".png"), look[key][1], mirror=(key == "cq"))
        if look[key][0] < 1.0:                       # 只留头到胸
            ch = ch.crop((0, 0, ch.width, int(ch.height * look[key][0])))
        place(canvas, ch, cx, min(0.99, by + 0.05))

    img = canvas.convert("RGB")
    img = halftone(img, dot=6, strength=0.07)

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
