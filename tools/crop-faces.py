# -*- coding: utf-8 -*-
"""从照片里裁出人物头像候选，拼一张对照图

用法：python tools/crop-faces.py
输出：assets/_face/_cand/*.jpg + _sheet.png
"""
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "_face")
OUT = os.path.join(SRC, "_cand")
os.makedirs(OUT, exist_ok=True)

# key: (文件, 裁剪框比例 x0,y0,x1,y1)
CROPS = {
    "lb1": ("lb1.jpg", (0.30, 0.34, 0.78, 0.80)),
    "lb2": ("lb2.jpg", (0.26, 0.40, 0.74, 0.86)),
    "zq":  ("zq.jpg",  (0.215, 0.485, 0.405, 0.775)),
    "cq1": ("cq1.jpg", (0.12, 0.03, 0.97, 0.72)),
    "cq2": ("cq2.jpg", (0.17, 0.41, 0.56, 0.73)),
}

SIZE = 520

for key, (fname, box) in CROPS.items():
    im = Image.open(os.path.join(SRC, fname)).convert("RGB")
    W, H = im.size
    l = int(W * box[0]); t = int(H * box[1])
    r = int(W * box[2]); b = int(H * box[3])
    crop = im.crop((l, t, r, b))
    # 统一成正方形：以短边为准居中裁
    s = min(crop.size)
    cx, cy = crop.width // 2, crop.height // 2
    crop = crop.crop((cx - s // 2, cy - s // 2, cx + s // 2, cy + s // 2))
    crop = crop.resize((SIZE, SIZE), Image.LANCZOS)
    crop.save(os.path.join(OUT, key + ".jpg"), "JPEG", quality=92)
    print(f"  {key}: {crop.size} <- {fname} {box}")

# 对照图
keys = list(CROPS)
pad, cols = 10, 3
rows = (len(keys) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (SIZE + pad) + pad, rows * (SIZE + 26) + pad), (28, 30, 34))
d = ImageDraw.Draw(sheet)
for i, k in enumerate(keys):
    r, c = divmod(i, cols)
    x = pad + c * (SIZE + pad)
    y = pad + r * (SIZE + 26 + pad)
    sheet.paste(Image.open(os.path.join(OUT, k + ".jpg")), (x, y))
    d.text((x + 4, y + SIZE + 4), k, fill=(240, 240, 240))
sheet.save(os.path.join(SRC, "_sheet.png"))
print("对照图：assets/_face/_sheet.png")
