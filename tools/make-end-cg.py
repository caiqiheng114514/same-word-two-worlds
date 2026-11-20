# -*- coding: utf-8 -*-
"""结算 CG（四档默契各一张）

这版的目标是「看得清」：
  · 背景大幅提亮（原来偏灰偏暗）
  · 人物恢复原色并抽饱和、提亮，再加一圈米白外发光 + 墨线
  · 背景去色压灰 → 人物彩色 → 天然形成对比，人物跳出来
  · 整张只留很轻的网点和暗角，不再把人物也染成墨米色
"""
import os
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BG = os.path.join(ROOT, "assets", "bg")
SP = os.path.join(ROOT, "assets", "sp")
OUT = os.path.join(ROOT, "assets", "cg")
os.makedirs(OUT, exist_ok=True)

W, H = 1600, 1000
INK = (26, 34, 44)
CREAM = (250, 244, 230)

# key, 背景, 阿伟, 小明, 小明镜像, ax, mx, 阿高, 明高, 背景提亮, 背景染的温度
VARIANTS = [
    ("cg-end-cold",  "station.jpg",    "aw-normal.png", "mh-normal.png",  False, 0.26, 0.72, 0.60, 0.58, 1.20, (208, 220, 232)),
    ("cg-end-timid", "cafe-in.jpg",    "aw-normal.png", "mh-puzzled.png", True,  0.33, 0.65, 0.60, 0.58, 1.75, (246, 236, 214)),
    ("cg-end-warm",  "street-out.jpg", "aw-happy.png",  "mh-normal.png",  True,  0.34, 0.62, 0.60, 0.58, 1.14, (252, 236, 204)),
    ("cg-end-close", "night-city.jpg", "aw-happy.png",  "mh-happy.png",   True,  0.36, 0.60, 0.62, 0.60, 1.18, (255, 230, 178)),
]


def fit_cover(im, w, h, focus=0.45):
    s = max(w / im.width, h / im.height)
    im = im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))), Image.LANCZOS)
    left = (im.width - w) // 2
    top = int((im.height - h) * focus)
    return im.crop((left, top, left + w, top + h))


def brighten_bg(im, lift, tint):
    """背景：提亮 + 略微去色 + 染一点环境色，让它退到人物后面"""
    im = ImageEnhance.Brightness(im).enhance(lift)
    im = Image.blend(im, Image.new("RGB", im.size, tint), 0.22)
    # 中间调提亮（gamma），阴影不至于糊成一片
    lut = [min(255, int(255 * ((i / 255) ** 0.74))) for i in range(256)]
    im = im.point(lut * 3)
    im = ImageEnhance.Color(im).enhance(0.72)      # 背景退色
    im = ImageEnhance.Contrast(im).enhance(0.95)
    return im


def load_char(path, height_ratio, mirror=False):
    ch = Image.open(os.path.join(SP, path)).convert("RGBA")
    th = int(H * height_ratio)
    tw = int(ch.width * th / ch.height)
    ch = ch.resize((tw, th), Image.LANCZOS)
    if mirror:
        ch = ImageOps.mirror(ch)
    rgb = ch.convert("RGB")
    rgb = ImageEnhance.Color(rgb).enhance(1.25)    # 人物抽饱和
    rgb = ImageEnhance.Brightness(rgb).enhance(1.10)
    rgb = ImageEnhance.Contrast(rgb).enhance(1.06)
    out = rgb.convert("RGBA")
    out.putalpha(ch.getchannel("A"))
    return out


def grow_alpha(a, px):
    return a.filter(ImageFilter.MaxFilter(px * 2 + 1))


def with_outline_and_glow(ch, px=3, glow=6):
    """墨线勾边 + 米白外发光：让彩色人物在灰背景上明确跳出来"""
    a = ch.getchannel("A")
    # 外发光（大一圈的米白，模糊，半透明）
    halo = Image.new("RGBA", ch.size, CREAM + (0,))
    halo_a = grow_alpha(a, glow).filter(ImageFilter.GaussianBlur(glow * 0.45))
    halo_a = halo_a.point(lambda p: int(p * 0.62))
    halo.putalpha(halo_a)
    # 墨线（中一圈）
    line = Image.new("RGBA", ch.size, INK + (0,))
    line.putalpha(grow_alpha(a, px))
    canvas = Image.new("RGBA", ch.size, (0, 0, 0, 0))
    canvas.alpha_composite(halo)
    canvas.alpha_composite(line)
    canvas.alpha_composite(ch)
    return canvas


def ground_shadow(canvas, cx, base_y, tw, strength=0.42):
    sw, sh = int(tw * 0.95), int(tw * 0.16)
    im = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse((0, 0, sw - 1, sh - 1), fill=(20, 26, 34, int(255 * strength)))
    im = im.filter(ImageFilter.GaussianBlur(max(3, int(sw * 0.06))))
    canvas.alpha_composite(im, (int(cx - sw / 2), int(base_y - sh * 0.6)))


def halftone_pass(img, dot=6, strength=0.10):
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


for name, bg, aw, mh, mirror_mh, ax, mx, ah, mhh, lift, tint in VARIANTS:
    base = fit_cover(Image.open(os.path.join(BG, bg)).convert("RGB"), W, H)
    base = brighten_bg(base, lift, tint)
    canvas = base.convert("RGBA")

    base_y = int(H * 0.95)
    aw_img = with_outline_and_glow(load_char(aw, ah, False))
    mh_img = with_outline_and_glow(load_char(mh, mhh, mirror_mh))

    ground_shadow(canvas, W * ax, base_y, aw_img.width)
    ground_shadow(canvas, W * mx, base_y, mh_img.width)

    canvas.alpha_composite(aw_img, (int(W * ax - aw_img.width / 2), int(base_y - aw_img.height)))
    canvas.alpha_composite(mh_img, (int(W * mx - mh_img.width / 2), int(base_y - mh_img.height)))

    img = canvas.convert("RGB")
    img = halftone_pass(img, dot=6, strength=0.10)

    # 只留很淡的暗角，重点在四角，不压人物
    vig = Image.new("L", img.size, 0)
    d = ImageDraw.Draw(vig)
    d.ellipse((-W * 0.10, -H * 0.16, W * 1.10, H * 1.16), fill=255)
    vig = ImageOps.invert(vig).point(lambda p: int(p * 0.24))
    img = Image.composite(Image.new("RGB", img.size, (30, 36, 44)), img, vig)

    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, W - 1, H - 1), outline=INK, width=14)

    img.save(os.path.join(OUT, name + ".jpg"), "JPEG", quality=90, optimize=True)
    lum = sum(ImageOps.grayscale(img).getdata()) / (W * H)
    print(f"  OK {name}.jpg   平均亮度 {lum:.0f}")
