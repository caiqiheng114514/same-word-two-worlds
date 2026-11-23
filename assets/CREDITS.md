# 素材来源与署名

情景对话的背景与结算画面取自 [OpenGameArt](https://opengameart.org/) 的免费素材；封面取自 [Pexels](https://www.pexels.com/)；**人物形象为三位同学本人提供的照片**。

CC-BY 类素材**必须署名**——对外演示、发链接、交作业时请保留下表。

## 封面

| 文件 | 内容 | 来源 | 许可 |
|---|---|---|---|
| `assets/cover.jpg` | 天星小轮 · 维多利亚港 | Pexels 照片 #36595995 | Pexels License（可免费商用，无需署名） |

## 背景（CC-BY，务必保留）

| 文件 | 作品 | 许可证 | 原页 |
|---|---|---|---|
| `assets/bg/street-out.jpg` | Visual Novel House Backgrounds | CC-BY 3.0 | https://opengameart.org/content/visual-novel-house-backgrounds |
| `assets/bg/hall.jpg` | Hallway (day+night) Background for visual novel | CC-BY 4.0 | https://opengameart.org/content/hallway-daynight-background-visual-novel |
| `assets/bg/cafe-in.jpg` | visual novel style backgrounds | CC-BY 3.0 | https://opengameart.org/content/visual-novel-style-backgrounds |
| `assets/bg/kitchen.jpg` | Visual Novel House Backgrounds | CC-BY 3.0 | https://opengameart.org/content/visual-novel-house-backgrounds |
| `assets/bg/road.jpg` | City Background Repetitive 2 | CC-BY 3.0 | https://opengameart.org/content/city-background-repetitive-2 |
| `assets/bg/night-city.jpg` | Parallax City - Night (4 Colors) | CC0 | https://opengameart.org/content/parallax-city-night-4-colors |
| `assets/bg/home.jpg` | Visual Novel House Backgrounds | CC-BY 3.0 | https://opengameart.org/content/visual-novel-house-backgrounds |
| `assets/bg/station.jpg` | BR / São Paulo Subway | CC-BY 3.0 | https://opengameart.org/content/br-sao-paulo-subway |

## 人物形象

| 文件 | 人物 | 说明 |
|---|---|---|
| `assets/face/lb.jpg` | 刘博康（香港） | 本人提供 |
| `assets/face/zq.jpg` | 赵祈岳（内地） | 本人提供 |
| `assets/face/cq.jpg` | 蔡奇衡（内地） | 本人提供 |

> 照片做了统一处理：降饱和 → 叠网点 → 加纸张色，让它和手绘背景是同一套印刷质感；
> 墨框、投影、轻微倾斜交给 CSS（`.vn-face`），所以对话里看起来是一张「漫画照片卡」而不是抠图贴纸。
> 重新生成：`python tools/make-faces.py`（原图放在 `assets/_face/`，裁切框在 `tools/crop-faces.py`）。

## 结算 CG

| 文件 | 默契 | 场景 |
|---|---|---|
| `assets/cg/cg-end-cold.jpg` | 0–24 生疏 | 港铁车厢（冷灰） |
| `assets/cg/cg-end-timid.jpg` | 25–49 有点熟 | 茶餐厅（中灰） |
| `assets/cg/cg-end-warm.jpg` | 50–74 熟络 | 街口（暖米） |
| `assets/cg/cg-end-close.jpg` | 75–100 老友 | 夜里的维港（暖金） |

> 四张都是「场景背景 + 三张人物照片卡」合成：照片卡带米白相框边、墨线和投影，和对话里的头像卡同一套语言。
> 重跑：`python tools/make-end-cg.py`。

## 处理方式

- 背景统一做「去色 → 分层 → 网点 → 双色调（墨 `#1A222C` / 米 `#F4EAD6`）」，
  目的是把不同作者、不同画风（写实渲染 / 插画 / 线稿 / 像素）压成同一套漫画分色，观感统一。
- 人物是真实照片，不做抠图（抠出来会有明显贴纸感），改成「照片卡」：降饱和 + 网点 + 纸张色 + 墨框。
- 想换素材：保持同名文件即可（背景 `assets/bg/*.jpg` 宽 1000，人物 `assets/face/*.jpg` 420×420），代码不用改。
- 移动端体积：所有图片已压到手机友好的尺寸，重压用 `python tools/optimize-assets.py`。
