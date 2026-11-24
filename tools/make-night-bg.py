# -*- coding: utf-8 -*-
"""画一张「夜里的维港」背景（程序生成，线条清晰，不用放大位图）

用法：python tools/make-night-bg.py
产出：assets/bg/night-city.jpg（1000×666，供网页与结算 CG 共用）

先在 1600×1066 上画，再降采样存 1000×666：
结算 CG 会放大到 1600，等于回到原始分辨率，不会糊。
"""
import os
import random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "bg", "night-city.jpg")

W, H = 1600, 1066
random.seed(7)

img = Image.new("RGB", (W, H))
d = ImageDraw.Draw(img)

# 天空：深蓝 → 紫，靠近地平线泛暖
for y in range(H):
    t = y / H
    r = int(14 + 46 * t)
    g = int(20 + 26 * t)
    b = int(42 + 34 * (1 - t * 0.4))
    d.line([(0, y), (W, y)], fill=(r, g, b))

# 地平线暖光
glow = Image.new("RGB", (W, H), (0, 0, 0))
dg = ImageDraw.Draw(glow)
dg.ellipse((-W * 0.2, H * 0.55, W * 1.2, H * 1.5), fill=(120, 86, 70))
glow = glow.filter(ImageFilter.GaussianBlur(90))
img = Image.blend(img, Image.blend(img, glow, 0.5), 0.55)
d = ImageDraw.Draw(img)

# 星星
for _ in range(120):
    x = random.randint(0, W)
    y = random.randint(0, int(H * 0.55))
    s = random.choice([1, 1, 1, 2])
    a = random.randint(120, 220)
    d.ellipse((x, y, x + s, y + s), fill=(a, a, min(255, a + 20)))

# 月亮
mx, my, mr = int(W * 0.76), int(H * 0.17), int(H * 0.035)
d.ellipse((mx - mr * 2.2, my - mr * 2.2, mx + mr * 2.2, my + mr * 2.2), fill=(70, 74, 96))
d.ellipse((mx - mr, my - mr, mx + mr, my + mr), fill=(246, 240, 224))


def skyline(base_y, hmin, hmax, body, lit, wmin, wmax, alpha_windows=1.0):
    x = -40
    while x < W + 40:
        w = random.randint(wmin, wmax)
        h = random.randint(hmin, hmax)
        top = base_y - h
        d.rectangle((x, top, x + w, base_y), fill=body)
        # 屋顶细节
        if random.random() < 0.3:
            d.rectangle((x + w * 0.35, top - 18, x + w * 0.65, top), fill=body)
        if random.random() < 0.2:
            d.line((x + w * 0.5, top - 46, x + w * 0.5, top - 18), fill=body, width=4)
        # 窗
        cols = max(1, w // 26)
        rows = max(1, h // 34)
        for i in range(cols):
            for j in range(rows):
                if random.random() < 0.42:
                    wx = x + 8 + i * 26
                    wy = top + 12 + j * 34
                    if wx + 9 < x + w - 4 and wy + 12 < base_y - 4:
                        c = lit if random.random() < alpha_windows else tuple(int(v * 0.6) for v in lit)
                        d.rectangle((wx, wy, wx + 9, wy + 12), fill=c)
        x += w + random.randint(2, 10)


# 远景楼群（暗）
skyline(int(H * 0.72), int(H * 0.26), int(H * 0.44), (26, 32, 48), (150, 132, 92), 40, 90, 0.7)
# 中景
skyline(int(H * 0.82), int(H * 0.30), int(H * 0.52), (20, 25, 38), (214, 176, 96), 55, 110, 1.0)
# 近景（更暗更实）
skyline(int(H * 0.93), int(H * 0.20), int(H * 0.40), (12, 16, 25), (255, 206, 110), 70, 130, 0.9)

# 地面 / 水岸
d.rectangle((0, int(H * 0.93), W, H), fill=(9, 12, 19))
for i in range(26):
    x = random.randint(0, W)
    w = random.randint(30, 120)
    y0 = int(H * 0.94) + random.randint(0, 24)
    y1 = min(H - 2, y0 + random.randint(6, 18))
    d.rectangle((x, y0, x + w, y1), fill=(30, 30, 40))

# 轻微暗角
vig = Image.new("L", (W, H), 0)
dv = ImageDraw.Draw(vig)
dv.ellipse((-W * 0.15, -H * 0.2, W * 1.15, H * 1.2), fill=255)
from PIL import ImageOps
vig = ImageOps.invert(vig).point(lambda p: int(p * 0.5))
img = Image.composite(Image.new("RGB", (W, H), (6, 8, 13)), img, vig)

img = img.resize((1000, 666), Image.LANCZOS)
img.save(OUT, "JPEG", quality=84, optimize=True)
print("night-city.jpg", os.path.getsize(OUT) // 1024, "KB")
