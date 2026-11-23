# -*- coding: utf-8 -*-
"""把照片做成「漫画头像卡」素材

用法：python tools/make-faces.py
输出：assets/face/{lb,zq,cq}.jpg  420×420

处理思路：照片直接裁会像贴纸，所以叠一层网点 + 纸张色 + 轻微降饱和，
让它的质感跟手绘背景一致；墨框和投影交给 CSS 去做（便于调）。
"""
import os
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "_face", "_cand")
OUT = os.path.join(ROOT, "assets", "face")
os.makedirs(OUT, exist_ok=True)

# key: (候选文件, 是否锐化)
PICKS = {
    "lb": ("lb2.jpg", False),   # 刘博康（香港，能言善道）
    "zq": ("zq.jpg", True),     # 赵祈岳（内地，沉稳少言）
    "cq": ("cq2.jpg", False),   # 蔡奇衡（内地，开朗活泼）
}

SIZE = 420
INK = (26, 34, 44)
PAPER = (246, 238, 222)


def halftone(im, dot=4, strength=0.12):
    g = ImageOps.grayscale(im)
    small = g.resize((max(1, im.width // dot), max(1, im.height // dot)), Image.LANCZOS)
    dots = Image.new("L", im.size, 0)
    d = ImageDraw.Draw(dots)
    for y in range(0, im.height, dot):
        for x in range(0, im.width, dot):
            v = 255 - small.getpixel((min(small.width - 1, x // dot), min(small.height - 1, y // dot)))
            r = int(dot * 0.55 * (v / 255))
            if r >= 1:
                d.ellipse((x + dot // 2 - r, y + dot // 2 - r,
                           x + dot // 2 + r, y + dot // 2 + r), fill=255)
    mask = dots.point(lambda p: int(p * strength))
    return Image.composite(Image.new("RGB", im.size, INK), im, mask)


for key, (fname, sharpen) in PICKS.items():
    im = Image.open(os.path.join(SRC, fname)).convert("RGB")
    im = im.resize((SIZE, SIZE), Image.LANCZOS)
    if sharpen:
        im = im.filter(ImageFilter.UnsharpMask(radius=2, percent=110, threshold=3))
    im = ImageEnhance.Color(im).enhance(0.90)
    im = ImageEnhance.Brightness(im).enhance(1.03)
    im = ImageEnhance.Contrast(im).enhance(1.08)
    im = halftone(im, dot=4, strength=0.12)
    im = Image.blend(im, Image.new("RGB", im.size, PAPER), 0.05)
    im.save(os.path.join(OUT, key + ".jpg"), "JPEG", quality=86, optimize=True)
    print(f"  face/{key}.jpg  {SIZE}x{SIZE}  {os.path.getsize(os.path.join(OUT, key + '.jpg'))//1024} KB")

# 预览：三张并排 + 墨框效果
sheet = Image.new("RGB", (3 * (SIZE + 24) + 24, SIZE + 60), (30, 32, 36))
d = ImageDraw.Draw(sheet)
for i, key in enumerate(PICKS):
    x = 24 + i * (SIZE + 24)
    y = 24
    img = Image.open(os.path.join(OUT, key + ".jpg"))
    d.rectangle((x - 6, y - 6, x + SIZE + 6, y + SIZE + 6), fill=INK)
    sheet.paste(img, (x, y))
    d.text((x, y + SIZE + 12), f"{key}", fill=(235, 235, 235))
sheet.save(os.path.join(ROOT, "assets", "_face", "_faces.png"))
print("预览：assets/_face/_faces.png")
