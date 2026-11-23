# -*- coding: utf-8 -*-
"""把彩色原图做成场景背景（清晰、鲜艳，不再做双色调）

用法：python tools/make-color-bg.py
产出：assets/bg/{street-out,hall,cafe-in,kitchen,road,night-city,home,station}.jpg
"""
import os
from PIL import Image, ImageEnhance

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAND = os.path.join(ROOT, "assets", "_cand", "color")
OUT = os.path.join(ROOT, "assets", "bg")
os.makedirs(OUT, exist_ok=True)

W = 1000

# 场景 -> (源文件, 裁剪框(None 或 0-1 比例), 亮度, 饱和度, 对比)
MAP = [
    ("street-out", "house-1.jpg",  None,                 1.02, 1.06, 1.03),
    ("hall",       "hall2-0.png",  None,                 1.00, 1.08, 1.02),
    ("cafe-in",    "vnstyle-0.png", (0.0, 0.0, 1.0, 0.72), 1.25, 1.15, 1.02),
    ("kitchen",    "house-2.jpg",  None,                 1.02, 1.05, 1.03),
    ("road",       "house-1.jpg",  (0.0, 0.10, 0.62, 0.90), 1.04, 1.10, 1.03),
    ("night-city", "night2-0.png", None,                 1.06, 1.10, 1.04),
    ("home",       "house-0.jpg",  None,                 1.02, 1.05, 1.02),
    ("station",    "subway-0.jpg", None,                 1.02, 1.05, 1.03),
]

for key, src, crop, bright, sat, contrast in MAP:
    p = os.path.join(CAND, src)
    if not os.path.exists(p):
        print(f"  ! 缺 {src}（{key}）")
        continue
    im = Image.open(p).convert("RGB")
    if crop:
        w, h = im.size
        im = im.crop((int(w * crop[0]), int(h * crop[1]), int(w * crop[2]), int(h * crop[3])))
    # 统一裁成 3:2，铺满舞台不变形
    tw, th = W, int(W * 2 / 3)
    s = max(tw / im.width, th / im.height)
    im = im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))), Image.LANCZOS)
    left = (im.width - tw) // 2
    top = int((im.height - th) * 0.42)
    im = im.crop((left, top, left + tw, top + th))

    im = ImageEnhance.Brightness(im).enhance(bright)
    im = ImageEnhance.Color(im).enhance(sat)
    im = ImageEnhance.Contrast(im).enhance(contrast)

    out = os.path.join(OUT, key + ".jpg")
    im.save(out, "JPEG", quality=80, optimize=True)
    print(f"  {key}.jpg  {im.width}x{im.height}  {os.path.getsize(out)//1024} KB  <- {src}")
