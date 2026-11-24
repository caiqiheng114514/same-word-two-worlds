# -*- coding: utf-8 -*-
"""用「白底已抠图」的照片生成透明立绘

原理：这些图已经是白底，所以按「离白色多远」算 alpha，
但只把**与画面四边连通的白色**当背景（否则白领子、白纸会被打穿）。
再做一次去白边（un-premultiply），避免边缘发白。

用法：python tools/cutout-white.py
输出：assets/char/{lb,zq,cq}.png
"""
import os
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "_face", "white")
OUT = os.path.join(ROOT, "assets", "char")
os.makedirs(OUT, exist_ok=True)

PICKS = {
    # key: (文件, 相对内容的取景框 x0,y0,x1,y1)
    "lb": ("lb-w.jpg", (0.00, 0.00, 1.00, 1.00)),
    "zq": ("zq-w.jpg", (0.00, 0.00, 1.00, 1.00)),
    "cq": ("cq-w.jpg", (0.04, 0.00, 0.96, 0.86)),
    # 高分结局用的另一张
    "lb-alt": ("lb-alt-w.jpg", (0.00, 0.00, 1.00, 1.00)),
    "cq-alt": ("cq-alt-w.jpg", (0.00, 0.00, 1.00, 1.00)),
}

TARGET_H = 820


def flood_from_border(candidate):
    h, w = candidate.shape
    bg = np.zeros((h, w), bool)
    bg[0, :] = candidate[0, :]
    bg[-1, :] = candidate[-1, :]
    bg[:, 0] = candidate[:, 0]
    bg[:, -1] = candidate[:, -1]
    for _ in range(3000):
        g = bg.copy()
        g[1:, :] |= bg[:-1, :]
        g[:-1, :] |= bg[1:, :]
        g[:, 1:] |= bg[:, :-1]
        g[:, :-1] |= bg[:, 1:]
        g &= candidate
        if (g == bg).all():
            break
        bg = g
    return bg


for key, (fname, frame) in PICKS.items():
    p = os.path.join(SRC, fname)
    if not os.path.exists(p):
        print(f"  ! 缺 {fname}")
        continue

    im = Image.open(p).convert("RGB")
    W = 720
    im = im.resize((W, int(im.height * W / im.width)), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32)
    h, w = a.shape[:2]

    # 离白色多远
    d = 255.0 - a.min(axis=2)
    cand = d < 26                      # 接近纯白的像素
    bg = flood_from_border(cand)
    # 与边界连通的白色 -> 透明；其余保留（白领子/白纸）
    alpha = np.where(bg, 0.0, 1.0)

    # 边缘柔和：只在 alpha 边界附近做 1.5px 过渡
    a_img = Image.fromarray((alpha * 255).astype(np.uint8))
    edge = a_img.filter(ImageFilter.GaussianBlur(1.6))
    a_img = Image.fromarray(np.minimum(np.asarray(a_img, np.float32), np.asarray(edge, np.float32)).astype(np.uint8))
    alpha = np.asarray(a_img).astype(np.float32) / 255.0

    # 去白边：把半透明像素里混进去的白色压掉
    a2 = np.clip(alpha, 0.05, 1.0)[..., None]
    rgb = (a - 255.0 * (1.0 - a2)) / a2
    rgb = np.clip(rgb, 0, 255).astype(np.uint8)

    out = Image.fromarray(rgb).convert("RGBA")
    out.putalpha(Image.fromarray((alpha * 255).astype(np.uint8)))

    # 裁到内容
    ys, xs = np.where(alpha > 0.55)   # 用高阈值定裁切框，避免边缘残雾撑大画面
    if len(ys) < 100:
        print(f"  ! {key} 内容太少")
        continue
    box = (max(0, xs.min() - 2), max(0, ys.min() - 2), min(w, xs.max() + 3), min(h, ys.max() + 3))
    out = out.crop(box)

    w0, h0 = out.size
    fx0, fy0, fx1, fy1 = frame
    out = out.crop((int(w0 * fx0), int(h0 * fy0), int(w0 * fx1), int(h0 * fy1)))

    s = TARGET_H / out.height
    out = out.resize((max(1, int(out.width * s)), TARGET_H), Image.LANCZOS)
    out.save(os.path.join(OUT, key + ".png"), "PNG", optimize=True)
    print(f"  {key}.png  {out.width}x{out.height}  {os.path.getsize(os.path.join(OUT, key + '.png'))//1024} KB")

# 预览
keys = [k for k in PICKS if os.path.exists(os.path.join(OUT, k + ".png"))]
imgs = [Image.open(os.path.join(OUT, k + ".png")) for k in keys]
Hh = 560
tiles = [im.resize((int(im.width * Hh / im.height), Hh), Image.LANCZOS) for im in imgs]
Wd = sum(t.width for t in tiles) + 20 * (len(tiles) + 1)
sheet = Image.new("RGB", (Wd, Hh + 40), (240, 240, 240))
d = ImageDraw = __import__("PIL.ImageDraw", fromlist=["ImageDraw"]).Draw(sheet)
for y in range(0, Hh, 20):
    for x in range(0, Wd, 20):
        if (x // 20 + y // 20) % 2 == 0:
            d.rectangle((x, y, x + 19, y + 19), fill=(205, 205, 210))
x = 20
for t, k in zip(tiles, keys):
    sheet.paste(t, (x, 0), t)
    d.text((x + 4, Hh + 10), k, fill=(20, 20, 20))
    x += t.width + 20
sheet.save(os.path.join(SRC, "_preview.png"))
print("预览：assets/_face/white/_preview.png")
