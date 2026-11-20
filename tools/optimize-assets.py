# -*- coding: utf-8 -*-
"""把素材压到手机能快速加载的尺寸（原地替换，幂等）

用法：python tools/optimize-assets.py

规则：
  封面  宽 900  JPEG q78 渐进
  背景  宽 1000 JPEG q76 渐进（显示宽度约 500，2x 足够）
  CG    宽 1000 JPEG q78 渐进
  立绘  高 600  PNG-8（128 色 + 透明），线稿扁平上色用调色板几乎无损
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, "assets")


def resize_w(im, w):
    if im.width <= w:
        return im
    h = int(im.height * w / im.width)
    return im.resize((w, h), Image.LANCZOS)


def save_jpg(im, path, q):
    im.convert("RGB").save(path, "JPEG", quality=q, optimize=True, progressive=True)


def main():
    before = after = 0

    # 封面
    p = os.path.join(A, "cover.jpg")
    if os.path.exists(p):
        b = os.path.getsize(p); before += b
        im = Image.open(p)
        if im.width > 900:
            im = resize_w(im, 900)
        save_jpg(im, p, 78)
        a = os.path.getsize(p); after += a
        print(f"  cover.jpg        {b//1024:>5} KB → {a//1024:>4} KB  {im.width}x{im.height}")

    # 背景
    bg_dir = os.path.join(A, "bg")
    for f in sorted(os.listdir(bg_dir)):
        if not f.lower().endswith((".jpg", ".jpeg")):
            continue
        p = os.path.join(bg_dir, f)
        b = os.path.getsize(p); before += b
        im = Image.open(p)
        if im.width > 1000:
            im = resize_w(im, 1000)
        save_jpg(im, p, 76)
        a = os.path.getsize(p); after += a
        print(f"  bg/{f:<14} {b//1024:>5} KB → {a//1024:>4} KB")

    # 结算 CG
    cg_dir = os.path.join(A, "cg")
    if os.path.isdir(cg_dir):
        for f in sorted(os.listdir(cg_dir)):
            if not f.lower().endswith((".jpg", ".jpeg")):
                continue
            p = os.path.join(cg_dir, f)
            b = os.path.getsize(p); before += b
            im = Image.open(p)
            if im.width > 1000:
                im = resize_w(im, 1000)
            save_jpg(im, p, 78)
            a = os.path.getsize(p); after += a
            print(f"  cg/{f:<14} {b//1024:>5} KB → {a//1024:>4} KB")

    # 立绘（保持透明）
    sp_dir = os.path.join(A, "sp")
    for f in sorted(os.listdir(sp_dir)):
        if not f.lower().endswith(".png"):
            continue
        p = os.path.join(sp_dir, f)
        b = os.path.getsize(p); before += b
        im = Image.open(p).convert("RGBA")
        if im.height > 600:
            h = 600
            w = int(im.width * h / im.height)
            im = im.resize((w, h), Image.LANCZOS)
        # PNG-8：扁平线稿用 128 色基本无损，体积能降一个数量级
        q = im.quantize(colors=128, method=Image.FASTOCTREE)
        q.save(p, "PNG", optimize=True)
        a = os.path.getsize(p); after += a
        print(f"  sp/{f:<14} {b//1024:>5} KB → {a//1024:>4} KB  {im.width}x{im.height}")

    print(f"\n合计 {before/1024/1024:.2f} MB → {after/1024/1024:.2f} MB（省 {(1-after/before)*100:.0f}%）")


if __name__ == "__main__":
    main()
