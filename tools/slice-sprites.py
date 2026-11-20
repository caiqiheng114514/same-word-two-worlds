# -*- coding: utf-8 -*-
"""切分角色表情表 → 单张立绘候选 + 拼一张对照图

用法：python tools/slice-sprites.py
输入：assets/_cand/角色/07-2.png（青绿角色）、07-3.png（橙衣角色）
输出：assets/_cand/cells/{sheet}-r{row}c{col}.png
      assets/_cand/cells/_montage.png（带编号，用来挑表情）
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "_cand", "角色")
OUT = os.path.join(ROOT, "assets", "_cand", "cells")
os.makedirs(OUT, exist_ok=True)

SHEETS = {
    "aw": "07-2.png",   # 青绿长发的角色（阿伟）
    "mh": "07-3.png",   # 橙衣连帽衫角色（小明）
}
COLS, ROWS = 4, 3

def load(path):
    im = Image.open(path)
    return im.convert("RGBA")

def trim(im):
    bbox = im.getbbox()
    return im.crop(bbox) if bbox else None

cells = []
for who, fname in SHEETS.items():
    path = os.path.join(SRC, fname)
    im = load(path)
    w, h = im.size
    cw, ch = w // COLS, h // ROWS
    for r in range(ROWS):
        for c in range(COLS):
            box = (c * cw, r * ch, (c + 1) * cw, (r + 1) * ch)
            cell = im.crop(box)
            # 去掉格子边缘 2px，避免串到邻格
            cell = cell.crop((2, 2, cell.width - 2, cell.height - 2))
            t = trim(cell)
            if t is None or t.width < 40 or t.height < 80:
                continue
            name = f"{who}-r{r + 1}c{c + 1}.png"
            t.save(os.path.join(OUT, name))
            cells.append((name, t))

# 对照图：每行 6 个，等宽缩放
TH = 240
pads = 8
cols = 6
rows = (len(cells) + cols - 1) // cols
cellw = TH
canvas = Image.new("RGBA", (cols * (cellw + pads) + pads, rows * (TH + 20 + pads) + pads), (250, 248, 242, 255))
from PIL import ImageDraw
d = ImageDraw.Draw(canvas)
for i, (name, im) in enumerate(cells):
    r, c = divmod(i, cols)
    x = pads + c * (cellw + pads)
    y = pads + r * (TH + 20 + pads)
    s = min(cellw / im.width, TH / im.height)
    t = im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))), Image.LANCZOS)
    canvas.alpha_composite(t, (x + (cellw - t.width) // 2, y))
    d.text((x + 4, y + TH + 4), name.replace(".png", ""), fill=(30, 30, 30))

canvas.save(os.path.join(OUT, "_montage.png"))
print(f"切出 {len(cells)} 个格子 → assets/_cand/cells/")
for n, im in cells:
    print(f"  {n}  {im.width}x{im.height}")
