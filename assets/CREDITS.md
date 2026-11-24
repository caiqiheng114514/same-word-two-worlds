# 素材来源与署名

情景对话的背景取自 [OpenGameArt](https://opengameart.org/) 的免费素材；封面取自 [Pexels](https://www.pexels.com/)；**人物形象为三位同学本人提供的照片**。

CC-BY 类素材**必须署名**——对外演示、发链接、交作业时请保留下表。

## 封面

| 文件 | 内容 | 来源 | 许可 |
|---|---|---|---|
| `assets/cover.jpg` | 天星小轮 · 维多利亚港 | Pexels 照片 #36595995 | Pexels License（可免费商用，无需署名） |

## 背景（CC-BY，务必保留）

| 文件 | 作品 | 许可证 | 原页 |
|---|---|---|---|
| `assets/bg/street-out.jpg` | Visual Novel House Backgrounds | CC-BY 3.0 | https://opengameart.org/content/visual-novel-house-backgrounds |
| `assets/bg/hall.jpg` | Hallway (day+night) Background for Visual Novels | CC-BY 4.0 | https://opengameart.org/content/hallway-daynight-background-for-visual-novels |
| `assets/bg/cafe-in.jpg` | visual novel style backgrounds | CC-BY 3.0 | https://opengameart.org/content/visual-novel-style-backgrounds |
| `assets/bg/kitchen.jpg` | Visual Novel House Backgrounds | CC-BY 3.0 | https://opengameart.org/content/visual-novel-house-backgrounds |
| `assets/bg/road.jpg` | Visual Novel House Backgrounds（另一次裁切） | CC-BY 3.0 | https://opengameart.org/content/visual-novel-house-backgrounds |
| `assets/bg/night-city.jpg` | City Background Repetitive 2（天际线条带 + 渐变夜空合成） | CC-BY 3.0 | https://opengameart.org/content/city-background-repetitive-2 |
| `assets/bg/home.jpg` | Visual Novel House Backgrounds | CC-BY 3.0 | https://opengameart.org/content/visual-novel-house-backgrounds |
| `assets/bg/station.jpg` | BR / São Paulo Subway | CC-BY 3.0 | https://opengameart.org/content/br-sao-paulo-subway |

> 现在是**彩色版**：只做等比裁切 + 轻微提亮/加饱和，不再做双色调网点。重跑：`python tools/make-color-bg.py`。

## 人物形象

| 文件 | 人物 | 说明 |
|---|---|---|
| `assets/face/lb.jpg` | 刘博康（香港） | 本人提供 |
| `assets/face/zq.jpg` | 赵祈岳（内地） | 本人提供 |
| `assets/face/cq.jpg` | 蔡奇衡（内地） | 本人提供 |

> 现在以「照片卡」形式出现：墨框 + 投影 + 轻微倾斜，无文字标签。
> 做过自动抠图尝试（`tools/cutout.py`），但手机自拍背景太杂，没有分割模型时边缘会带出背景，故未采用。
> 重新生成：`python tools/make-faces.py`（原图在 `assets/_face/`）。

## 结算 CG

| 文件 | 默契 | 场景 |
|---|---|---|
| `assets/cg/cg-end-cold.jpg` | 0–24 生疏 | 港铁车厢 |
| `assets/cg/cg-end-timid.jpg` | 25–49 有点熟 | 茶餐厅 |
| `assets/cg/cg-end-warm.jpg` | 50–74 熟络 | 街口 |
| `assets/cg/cg-end-close.jpg` | 75–100 老友 | 夜里的城市天际线 |

> 四张都是「场景背景 + 三张人物照片卡」合成。重跑：`python tools/make-end-cg.py`。

## 处理方式

- 背景：等比裁成 3:2 → 宽 1000 → 轻微提亮与加饱和，保留原画的清晰度和颜色。
- 人物：照片裁成方形 → 轻微压缩对比 → 由 CSS 做墨框/投影/倾斜。
- 想换素材：保持同名文件即可（背景 `assets/bg/*.jpg` 宽 1000，人物 `assets/face/*.jpg` 420×420），代码不用改。
- 移动端体积：图片已压到手机友好的尺寸，重压用 `python tools/optimize-assets.py`。

## 背景音乐

| 文件 | 作品 | 许可证 | 原页 |
|---|---|---|---|
| ssets/music/bgm.webm（主） / gm.mp3（兜底） | Jazz'n'Brass Loop | CC0（公有领域，无需署名） | https://opengameart.org/content/jazz-n-brass-loop |

> 原曲 27 秒，截取前 20 秒并做首尾淡入淡出，用浏览器 Web Audio + MediaRecorder 压成 Opus（60 KB）；
> gm.mp3 是给不支持 WebM 的老浏览器（部分 Safari）兜底，平时不会下载。
> 音量默认 0.2，右下角喇叭可开关，选择记在 localStorage。
## 结算 CG 里的图标

| 文件 | 用途 | 来源 | 许可 |
|---|---|---|---|
| ssets/_icon/thumbs.png、sweat.png、sparkle.png | 高分的大拇指、低分的汗滴、装饰星 | [Twemoji](https://github.com/jdecked/twemoji) | CC-BY 4.0 |

> 只有重新生成 CG 时才需要（python tools/make-end-cg.py），运行时不加载。
> 「无语」的三条竖线是脚本直接画的，不用素材。