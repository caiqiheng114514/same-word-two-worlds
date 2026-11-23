# -*- coding: utf-8 -*-
"""把候选素材整理成站点最终资源（统一成「漫画网点双色调」）

用法：python tools/build-assets.py
产出：
  assets/bg/*.jpg                                8 张场景背景（去色 + 分层 + 双色调）
  assets/cover.jpg                               封面（天星小轮 · 维港）
  assets/CREDITS.md                              署名片（CC-BY 必须保留）

注意：人物形象已改为真实照片（见 tools/make-faces.py），本脚本不再生成立绘。
"""
import os
from PIL import Image, ImageOps, ImageEnhance, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAND = os.path.join(ROOT, "assets", "_cand")
BG = os.path.join(ROOT, "assets", "bg")
os.makedirs(BG, exist_ok=True)

PAPER = (251, 248, 240, 255)

# ---------------- 背景 ----------------
# key: (相对候选路径, 裁剪框或 None, 作品, 作者, 许可证, 原页)
BGS = [
    ("street-out", "背景/02-2.jpg", None, 1.06,
     "Visual Novel House Backgrounds", "see page", "CC-BY 3.0",
     "https://opengameart.org/content/visual-novel-house-backgrounds"),
    ("hall", "背景/06-1.png", None, 1.10,
     "Hallway (day+night) Background for visual novel", "see page", "CC-BY 4.0",
     "https://opengameart.org/content/hallway-daynight-background-visual-novel"),
    ("cafe-in", "背景/01-1.png", None, 1.55,
     "visual novel style backgrounds", "see page", "CC-BY 3.0",
     "https://opengameart.org/content/visual-novel-style-backgrounds"),
    ("kitchen", "背景/02-3.jpg", None, 1.05,
     "Visual Novel House Backgrounds", "see page", "CC-BY 3.0",
     "https://opengameart.org/content/visual-novel-house-backgrounds"),
    ("road", "补搜/06-2.png", (240, 0, 1560, 900), 1.30,
     "City Background Repetitive 2", "see page", "CC-BY 3.0",
     "https://opengameart.org/content/city-background-repetitive-2"),
    ("night-city", "补搜/10-1.png", None, 1.25,
     "Parallax City - Night (4 Colors)", "see page", "CC0",
     "https://opengameart.org/content/parallax-city-night-4-colors"),
    ("home", "背景/02-1.jpg", None, 1.05,
     "Visual Novel House Backgrounds", "see page", "CC-BY 3.0",
     "https://opengameart.org/content/visual-novel-house-backgrounds"),
    ("station", "补搜/26-2.jpg", None, 1.05,
     "BR / São Paulo Subway", "see page", "CC-BY 3.0",
     "https://opengameart.org/content/br-sao-paulo-subway"),
]

DARK = (26, 34, 44)      # 墨
LIGHT = (244, 234, 214)  # 米
W = 1600


def duotone_comic(im, levels=5, dot=6):
    """去色 → 分层 → 双色调 → 叠网点，做出漫画分色的味道"""
    g = ImageOps.grayscale(im)
    g = ImageOps.autocontrast(g, cutoff=1)
    g = ImageEnhance.Contrast(g).enhance(1.15)
    g = ImageOps.posterize(g, max(1, min(8, levels - 1)))

    # 双色调
    out = ImageOps.colorize(g, black=DARK, white=LIGHT, mid=(150, 140, 128)).convert("RGB")

    # 网点：按灰度给每个格子画一个点（暗处点大）
    small = g.resize((max(1, out.width // dot), max(1, out.height // dot)), Image.LANCZOS)
    dots = Image.new("L", out.size, 0)
    d = ImageDraw.Draw(dots)
    step = dot
    for y in range(0, out.height, step):
        for x in range(0, out.width, step):
            v = 255 - small.getpixel((min(small.width - 1, x // dot), min(small.height - 1, y // dot)))
            r = int(step * 0.62 * (v / 255))
            if r >= 1:
                d.ellipse((x + step // 2 - r, y + step // 2 - r,
                           x + step // 2 + r, y + step // 2 + r), fill=42)
    ink = Image.new("RGB", out.size, DARK)
    out = Image.composite(ink, out, dots)

    # 暗角
    vig = Image.new("L", out.size, 0)
    dv = ImageDraw.Draw(vig)
    dv.ellipse((-out.width * 0.15, -out.height * 0.25, out.width * 1.15, out.height * 1.25), fill=255)
    vig = ImageOps.invert(vig).point(lambda p: int(p * 0.55))
    out = Image.composite(Image.new("RGB", out.size, (18, 24, 32)), out, vig)
    return out


rows = []
for key, rel, crop, bright, title, author, lic, page in BGS:
    path = os.path.join(CAND, rel)
    if not os.path.exists(path):
        print(f"  ! 缺 {rel}（{key}）")
        continue
    im = Image.open(path).convert("RGB")
    im = ImageEnhance.Brightness(im).enhance(bright)
    if crop:
        im = im.crop(crop)
    # 先等比缩到目标宽度
    h = int(im.height * W / im.width)
    im = im.resize((W, h), Image.LANCZOS)
    # 统一裁成 3:2（1600x1067），保证每张舞台铺满不变形
    target_h = int(W * 2 / 3)
    if h > target_h:
        top = max(0, (h - target_h) // 2)
        im = im.crop((0, top, W, top + target_h))
    else:
        canvas = Image.new("RGB", (W, target_h), LIGHT)
        canvas.paste(im, (0, (target_h - h) // 2))
        im = canvas
    im = duotone_comic(im)
    out = os.path.join(BG, f"{key}.jpg")
    im.save(out, "JPEG", quality=86, optimize=True)
    rows.append((key, title, lic, page))
    print(f"  bg {key}.jpg  {im.width}x{im.height}  <- {rel}")

# ---------------- 封面：香港地标（天星小轮 · 维港） ----------------
COVER_SRC = os.path.join(ROOT, "assets", "_cover", "36595995.jpg")
if os.path.exists(COVER_SRC):
    im = Image.open(COVER_SRC).convert("RGB")
    im = ImageEnhance.Brightness(im).enhance(1.06)
    # 竖构图：1520x2280，手机全屏刚好
    target_w = 1520
    h = int(im.height * target_w / im.width)
    im = im.resize((target_w, h), Image.LANCZOS)
    im = duotone_comic(im)
    im.save(os.path.join(ROOT, "assets", "cover.jpg"), "JPEG", quality=88, optimize=True)
    print(f"  cover.jpg  {im.width}x{im.height}  <- 天星小轮 · 维多利亚港")
else:
    print("  ! 缺封面源图 assets/_cover/36595995.jpg")

# ---------------- 署名 ----------------
lines = [
    "# 素材来源与署名", "",
    "情景对话的背景、立绘与封面取自 [OpenGameArt](https://opengameart.org/) 与 [Pexels](https://www.pexels.com/) 的免费素材。",
    "CC-BY 类素材**必须署名**——对外演示、发链接、交作业时请保留下表。", "",
    "## 封面", "",
    "| 文件 | 内容 | 来源 | 许可 |", "|---|---|---|---|",
    "| `assets/cover.jpg` | 天星小轮 · 维多利亚港 | Pexels 照片 #36595995 | Pexels License（可免费商用，无需署名） |",
    "", "## 背景", "",
    "| 文件 | 作品 | 许可证 | 原页 |", "|---|---|---|---|",
]
for key, title, lic, page in rows:
    lines.append(f"| `assets/bg/{key}.jpg` | {title} | {lic} | {page} |")
lines += [
    "", "## 人物形象", "",
    "人物为三位同学本人提供的照片，见 `assets/face/`（`tools/make-faces.py` 生成），不涉及第三方素材。",
    "", "## 处理方式", "",
    "- 背景统一做「去色 → 分层 → 网点 → 双色调（墨 `#1A222C` / 米 `#F4EAD6`）」，",
    "  目的是把不同作者、不同画风（写实渲染 / 插画 / 线稿 / 像素）压成同一套漫画分色，观感统一。",
    "- 人物是真实照片，不做抠图（抠出来会有明显贴纸感），改成「照片卡」：降饱和 + 网点 + 纸张色 + 墨框。",
    "- 想换素材：保持同名文件即可（背景 `assets/bg/*.jpg` 宽 1000，人物 `assets/face/*.jpg` 420×420），代码不用改。",
    "- 重新生成：`python tools/build-assets.py`（需要 Pillow 和 `assets/_cand` 里的原图）。",
]
with open(os.path.join(ROOT, "assets", "CREDITS.md"), "w", encoding="utf-8", newline="\n") as f:
    f.write("\n".join(lines) + "\n")
print("\n已写 assets/CREDITS.md")
