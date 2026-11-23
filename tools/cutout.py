# -*- coding: utf-8 -*-
"""人像抠图 v3：轮廓约束 + 颜色分类

多边形只当「上限」用——真正决定谁是人物的是颜色：
  · 肤色：经典 RGB 规则
  · 头发：轮廓上部的暗像素
  · 衣服：轮廓下部的主色
三者取并集，且都不许超出多边形，最后补洞 + 羽化。
背景只要不在多边形里就不会被选中；而在多边形里、又不属于肤色/头发/衣服的，
就直接判成透明——这正好把多边形里混进来的背景挖掉。

用法：python tools/cutout.py
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "_face")
OUT = os.path.join(SRC, "_cut")
os.makedirs(OUT, exist_ok=True)

CHARACTERS = {
    "lb": {"file": "lb2.jpg", "poly": [
        (0.470, 0.418), (0.545, 0.415), (0.585, 0.445), (0.607, 0.500),
        (0.612, 0.560), (0.600, 0.615), (0.575, 0.665), (0.590, 0.700),
        (0.680, 0.745), (0.760, 0.800), (0.860, 0.870), (0.930, 0.960),
        (0.960, 1.000), (0.060, 1.000), (0.100, 0.930), (0.150, 0.860),
        (0.210, 0.795), (0.300, 0.740), (0.390, 0.700), (0.398, 0.665),
        (0.378, 0.615), (0.372, 0.560), (0.378, 0.500), (0.400, 0.445)]},
    "zq": {"file": "zq.jpg", "poly": [
        (0.258, 0.538), (0.310, 0.532), (0.338, 0.552), (0.348, 0.590),
        (0.346, 0.628), (0.330, 0.655), (0.332, 0.680), (0.380, 0.712),
        (0.420, 0.760), (0.445, 0.830), (0.462, 1.000), (0.128, 1.000),
        (0.148, 0.830), (0.172, 0.760), (0.205, 0.712), (0.248, 0.680),
        (0.248, 0.655), (0.232, 0.628), (0.228, 0.590), (0.238, 0.552)]},
    "cq": {"file": "cq1.jpg", "poly": [
        (0.500, 0.055), (0.660, 0.075), (0.760, 0.115), (0.800, 0.180),
        (0.822, 0.280), (0.818, 0.380), (0.790, 0.450), (0.740, 0.500),
        (0.700, 0.530), (0.760, 0.580), (0.850, 0.640), (0.930, 0.700),
        (0.985, 0.780), (1.000, 1.000), (0.000, 1.000), (0.010, 0.780),
        (0.060, 0.700), (0.140, 0.640), (0.240, 0.580), (0.320, 0.530),
        (0.300, 0.500), (0.268, 0.450), (0.258, 0.380), (0.262, 0.280),
        (0.290, 0.180), (0.360, 0.115), (0.430, 0.075)]},
}

TARGET_H = 760


def dilate(m, it=1):
    for _ in range(it):
        g = m.copy()
        g[1:, :] |= m[:-1, :]; g[:-1, :] |= m[1:, :]
        g[:, 1:] |= m[:, :-1]; g[:, :-1] |= m[:, 1:]
        m = g
    return m


def erode(m, it=1):
    return ~dilate(~m, it)


def close_holes(m, it=6):
    return erode(dilate(m, it), it)


def skin_mask(arr):
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    mx = arr.max(axis=2); mn = arr.min(axis=2)
    return (r > 95) & (g > 40) & (b > 20) & ((mx - mn) > 15) & (abs(r - g) > 15) & (r > g) & (r > b)


for key, cfg in CHARACTERS.items():
    im = Image.open(os.path.join(SRC, cfg["file"])).convert("RGB")
    W = 640
    im = im.resize((W, int(im.height * W / im.width)), Image.LANCZOS)
    w, h = im.size
    arr = np.asarray(im).astype(np.float32)

    poly = Image.new("L", (w, h), 0)
    ImageDraw.Draw(poly).polygon([(x * w, y * h) for x, y in cfg["poly"]], fill=255)
    pm = np.asarray(poly) > 128

    ys, xs = np.where(pm)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()

    # 上部 40% 当作头区，下部当作衣服区
    head_zone = pm.copy(); head_zone[int(y0 + (y1 - y0) * 0.45):, :] = False
    body_zone = pm.copy(); body_zone[:int(y0 + (y1 - y0) * 0.42), :] = False

    # 头发：头区的暗像素
    v = arr.max(axis=2)
    hair = head_zone & (v < 110)
    # 肤色
    skin = skin_mask(arr) & dilate(pm, 2)
    # 衣服：衣服区里最常见的颜色
    body_px = arr[body_zone]
    if body_px.size:
        q = (body_px // 24).astype(np.int32)
        codes = q[:, 0] * 1000 + q[:, 1] * 40 + q[:, 2]
        vals, counts = np.unique(codes, return_counts=True)
        dom = vals[counts.argmax()]
        target = body_px[codes == dom].mean(axis=0)
        d = np.sqrt(((arr - target) ** 2).sum(axis=2))
        cloth = body_zone & (d < 70)
    else:
        cloth = np.zeros_like(pm)

    person = (hair | skin | cloth) & dilate(pm, 1)
    person = close_holes(person, 5)
    # 把多边形边缘 3px 内的像素还回去，避免边缘被啃掉
    person |= (pm & ~erode(pm, 3))
    person &= pm
    person = close_holes(person, 3)
    person = erode(person, 1)

    alpha = Image.fromarray((person * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.4))

    ys, xs = np.where(person)
    if len(ys) < 100:
        print(f"  ! {key} 选区过小，跳过")
        continue
    box = (max(0, xs.min() - 3), max(0, ys.min() - 3), min(w, xs.max() + 4), min(h, ys.max() + 4))
    im2 = im.crop(box); a2 = alpha.crop(box)

    scale = TARGET_H / im2.height
    nw = max(1, int(im2.width * scale))
    im2 = im2.resize((nw, TARGET_H), Image.LANCZOS)
    a2 = a2.resize((nw, TARGET_H), Image.LANCZOS)

    out = im2.convert("RGBA"); out.putalpha(a2)
    out.save(os.path.join(OUT, key + ".png"))
    print(f"  {key}.png {out.width}x{out.height}  人物占比 {person.mean()*100:.1f}%")

keys = [k for k in CHARACTERS if os.path.exists(os.path.join(OUT, k + ".png"))]
imgs = [Image.open(os.path.join(OUT, k + ".png")) for k in keys]
Hh = 520
tiles = [im.resize((int(im.width * Hh / im.height), Hh), Image.LANCZOS) for im in imgs]
Wd = sum(t.width for t in tiles) + 20 * (len(tiles) + 1)
sheet = Image.new("RGB", (Wd, Hh + 40), (34, 38, 44))
d = ImageDraw.Draw(sheet)
for y in range(0, Hh, 18):
    for x in range(0, Wd, 18):
        if (x // 18 + y // 18) % 2 == 0:
            d.rectangle((x, y, x + 17, y + 17), fill=(54, 60, 68))
x = 20
for t, k in zip(tiles, keys):
    sheet.paste(t, (x, 0), t); d.text((x + 4, Hh + 10), k, fill=(240, 240, 240)); x += t.width + 20
sheet.save(os.path.join(SRC, "_cut_preview.png"))
print("预览：assets/_face/_cut_preview.png")
