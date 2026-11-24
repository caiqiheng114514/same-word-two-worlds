# -*- coding: utf-8 -*-
"""结算 CG（四档默契各一张 · 三人合影版）

用法：python tools/make-end-cg.py
产出：assets/cg/cg-end-{cold,timid,warm,close}.jpg

构图：场景背景（双色调、提亮）+ 三张「漫画照片卡」错落叠放。
照片卡带米白相框边 + 墨线 + 投影，和对话里的头像卡是同一套语言，
因此不会像把人直接抠图贴上去。
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageOps, ImageFont

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


def head_box(src):
    """用「肩宽突然变宽」定位下巴，得到 (头顶 y, 头高)。
    比肤色检测稳：不依赖光线和眼镜。src 可以是路径或已打开的 RGBA 图。"""
    im = Image.open(src).convert("RGBA") if isinstance(src, str) else src.convert("RGBA")
    a = np.asarray(im.getchannel("A")) > 128
    h, w = a.shape
    rows = a.sum(axis=1)
    nz = np.where(rows > max(3, w * 0.02))[0]
    top = int(nz.min()) if len(nz) else 0
    head_w = float(np.median(rows[top:top + max(4, int(h * 0.10))])) or 1.0
    chin = None
    for y in range(top + int(h * 0.08), h):
        if rows[y] > head_w * 1.85 and rows[min(h - 1, y + 5)] > head_w * 1.85:
            chin = y
            break
    if chin is None:
        chin = top + int(h * 0.35)
    return top, max(20, chin - top)


def sprite(path, height_ratio, crop_top=1.0, mirror=False):
    """透明立绘，可按头部比例裁到「头 + 上胸」，再统一缩放到同一显示高度"""
    ch = Image.open(path).convert("RGBA")
    if crop_top < 1.0:
        ch = ch.crop((0, 0, ch.width, max(1, int(ch.height * crop_top))))
    th = int(H * height_ratio)
    tw = max(1, int(ch.width * th / ch.height))
    ch = ch.resize((tw, th), Image.LANCZOS)
    if mirror:
        ch = ImageOps.mirror(ch)
    return ch


def place(canvas, ch, cx_ratio, base_ratio, x_px=None):
    x = int(x_px) if x_px is not None else int(W * cx_ratio - ch.width / 2)
    y = int(H * base_ratio - ch.height)
    sh = Image.new("RGBA", ch.size, (0, 0, 0, 0))
    sh.putalpha(ch.getchannel("A").point(lambda a: int(a * 0.45)))
    sh = sh.filter(ImageFilter.GaussianBlur(12))
    canvas.alpha_composite(sh, (x + 6, y + 10))
    canvas.alpha_composite(ch, (x, y))

def paste_icon(canvas, name, cx, cy, size, badge=False):
    """贴一个 emoji 图标（CC-BY Twemoji），可选白色圆形底"""
    p = os.path.join(ROOT, "assets", "_icon", name)
    if not os.path.exists(p):
        return
    ic = Image.open(p).convert("RGBA").resize((size, size), Image.LANCZOS)
    x, y = int(cx - size / 2), int(cy)
    if badge:
        r = int(size * 0.78)
        cir = Image.new("RGBA", (r * 2 + 8, r * 2 + 8), (0, 0, 0, 0))
        d = ImageDraw.Draw(cir)
        d.ellipse((4, 4, r * 2 + 4, r * 2 + 4), fill=(252, 248, 238, 255), outline=INK + (255,), width=6)
        canvas.alpha_composite(cir, (int(x + size / 2 - r - 4), int(y + size / 2 - r - 4)))
    canvas.alpha_composite(ic, (x, y))


def draw_annoyed(canvas, cx, cy):
    """漫画式「无语」竖线：三条粗短竖线"""
    d = ImageDraw.Draw(canvas)
    for i in (-1, 0, 1):
        x = int(cx + i * 34)
        d.line([(x, cy), (x, cy + 58)], fill=INK + (235,), width=9)
        d.line([(x, cy), (x, cy + 58)], fill=(252, 248, 238, 255), width=3)


def draw_great(canvas, cx, cy, size):
    """漫画特效字 GREAT!"""
    text = "GREAT!"
    font = None
    for name in ("ariblk.ttf", "impact.ttf", "arialbd.ttf"):
        p = os.path.join("C:\\Windows\\Fonts", name)
        if os.path.exists(p):
            font = ImageFont.truetype(p, size)
            break
    if font is None:
        font = ImageFont.load_default()

    layer = Image.new("RGBA", (int(size * 6), int(size * 2.4)), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.text((size * 0.2, size * 0.4), text, font=font, fill=(255, 214, 64, 255),
           stroke_width=int(size * 0.14), stroke_fill=INK + (255,))
    layer = layer.rotate(-9, resample=Image.BICUBIC, expand=True)
    bb = layer.getbbox()
    if bb:
        layer = layer.crop(bb)
    canvas.alpha_composite(layer, (int(cx), int(cy)))


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

    # 三个人一样高、同一基线：这是「结算合影」，不是分镜，不需要景深
    # 最高一档（老友）换成刘博康 / 蔡奇衡的另一张照片
    cast = {"zq": "zq", "lb": "lb", "cq": "cq"}
    if name == "cg-end-close":
        cast["lb"] = "lb-alt"
        cast["cq"] = "cq-alt"

    # 1) 裁好、缩放；按「人」而不是「图」等间距 —— 先量出每张图里人的中心
    def build(th):
        out = []
        for key in ORDER:
            who = cast[key]
            path = os.path.join(CHAR, who + ".png")
            top, hh = head_box(path)
            ch = Image.open(path).convert("RGBA")
            cut_top = max(0, top - int(hh * 0.06))
            cut_bottom = min(ch.height, top + int(hh * 1.6))
            ch = ch.crop((0, cut_top, ch.width, cut_bottom))

            # 横向也裁成统一比例（以脸为中心），否则宽图会把整体缩小
            a0 = np.asarray(ch.getchannel("A")) > 60
            head_rows = max(8, int(hh * 1.6 * 0.62))
            band0 = a0[:head_rows, :]
            cols0 = band0.sum(axis=0)
            fx = float((cols0 * np.arange(len(cols0))).sum() / cols0.sum()) if cols0.sum() else ch.width / 2
            half = max(40, int(min(ch.width / 2, hh * 1.05)))
            left = int(max(0, min(ch.width - half * 2, fx - half)))
            ch = ch.crop((left, 0, left + half * 2, ch.height))

            # 以「裁切后实测的头高」为基准统一缩放：三个人头一样大
            _, hh2 = head_box(ch)
            scale = (H * 0.30) / max(1, hh2)
            ch = ch.resize((max(1, int(ch.width * scale)), max(1, int(ch.height * scale))), Image.LANCZOS)
            th = ch.height
            if key == "cq":
                ch = ImageOps.mirror(ch)

            # 头部区域里不透明像素的重心 = 脸的横向中心
            a = np.asarray(ch.getchannel("A")) > 60
            head_y0 = int((top - cut_top) * th / (cut_bottom - cut_top))
            head_y1 = min(ch.height, head_y0 + int(hh * th / (cut_bottom - cut_top)))
            band = a[head_y0:head_y1, :]
            cols = band.sum(axis=0)
            if cols.sum() > 0:
                face_cx = float((cols * np.arange(len(cols))).sum() / cols.sum())
            else:
                face_cx = ch.width / 2.0
            # 整体轮廓重心（判断会不会压到别人）
            all_cols = a.sum(axis=0)
            body_cx = float((all_cols * np.arange(len(all_cols))).sum() / all_cols.sum()) if all_cols.sum() else ch.width / 2.0

            out.append({
                "key": key, "img": ch, "face_cx": face_cx, "body_cx": body_cx,
                "head_y": head_y0, "head_h": head_y1 - head_y0
            })
        return out

    TH = int(H * 0.60)
    sprites = build(TH)
    # 三个人的脸等距：中心落在 0.24 / 0.50 / 0.76
    step = W * 0.26
    if max(s["img"].width for s in sprites) > step * 1.25:   # 太挤就缩一档
        TH = int(TH * (step * 1.25) / max(s["img"].width for s in sprites))
        sprites = build(TH)

    base_y = int(H * 0.93)        # 抬起来，给左下角的「最终默契」留位置
    centers = [W * 0.24 + i * step for i in range(len(sprites))]

    # 先按脸心定位，若整体超出画面就整体平移回来
    xs = [c - s["face_cx"] for c, s in zip(centers, sprites)]
    left = min(xs)
    right = max(x + s["img"].width for x, s in zip(xs, sprites))
    if left < W * 0.02:
        shift = W * 0.02 - left
    elif right > W * 0.98:
        shift = W * 0.98 - right
    else:
        shift = 0

    for s, c, x in zip(sprites, centers, xs):
        x += shift
        ch = s["img"]
        cx_px = x + s["face_cx"]
        place(canvas, ch, 0, base_y / H, x_px=x)      # 左边缘定位，脸心才会落在 centers 上
        s["cx"] = cx_px
        s["head_top"] = base_y - TH + s["head_y"]

    # 2) 表情特效
    mood = "high" if name == "cg-end-close" else ("low" if name in ("cg-end-cold", "cg-end-timid") else "mid")
    by_key = {s["key"]: s for s in sprites}
    if mood == "low":
        draw_annoyed(canvas, by_key["lb"]["cx"] + by_key["lb"]["img"].width * 0.06, by_key["lb"]["head_top"] - 26)
        paste_icon(canvas, "sweat.png", by_key["cq"]["cx"] - by_key["cq"]["img"].width * 0.30,
                   by_key["cq"]["head_top"] - 30, int(H * 0.075))
    elif mood == "high":
        paste_icon(canvas, "thumbs.png", by_key["lb"]["cx"] + by_key["lb"]["img"].width * 0.10,
                   by_key["lb"]["head_top"] - 150, int(H * 0.095), badge=True)
        draw_great(canvas, W * 0.05, H * 0.10, int(H * 0.105))
        for dx, dy, sz in ((-0.06, -0.02, 0.05), (0.05, -0.10, 0.04), (0.10, 0.04, 0.035)):
            paste_icon(canvas, "sparkle.png", by_key["cq"]["cx"] + W * dx,
                       by_key["cq"]["head_top"] + H * dy, int(H * sz))
    else:
        paste_icon(canvas, "sparkle.png", by_key["zq"]["cx"] + W * 0.035,
                   by_key["zq"]["head_top"] - 20, int(H * 0.04))

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
