# 素材来源与署名

情景对话的背景、立绘与封面取自 [OpenGameArt](https://opengameart.org/) 与 [Pexels](https://www.pexels.com/) 的免费素材。
CC-BY 类素材**必须署名**——对外演示、发链接、交作业时请保留下表。

## 封面

| 文件 | 内容 | 来源 | 许可 |
|---|---|---|---|
| `assets/cover.jpg` | 天星小轮 · 维多利亚港 | Pexels 照片 #36595995 | Pexels License（可免费商用，无需署名） |

## 结算 CG

| 文件 | 默契 | 场景 | 做法 |
|---|---|---|---|
| `assets/cg/cg-end-cold.jpg` | 0–24 生疏 | 港铁站车厢，两人各看一边 | 冷灰调 |
| `assets/cg/cg-end-timid.jpg` | 25–49 有点熟 | 茶餐厅，隔着桌子 | 中灰调 |
| `assets/cg/cg-end-warm.jpg` | 50–74 熟络 | 街口并肩 | 暖米调 |
| `assets/cg/cg-end-close.jpg` | 75–100 老友 | 夜里的维港 | 暖金调 |

> 四张都由本仓库已有素材合成（背景 `assets/bg/` + 立绘 `assets/sp/`），不涉及新的第三方素材。
> 关键是**统一处理**：人物先过与背景同一套「墨+米」双色调、加墨线轮廓、接地投影，整张再叠一层网点、纸张色和暗角，
> 让人和景共用一套颜色和一层网，看起来是一幅画而不是贴图。重跑：`python tools/make-end-cg.py`。

## 背景

| 文件 | 作品 | 许可证 | 原页 |
|---|---|---|---|

## 立绘

| 文件 | 作品 | 许可证 | 原页 |
|---|---|---|---|
| `assets/sp/aw-*.png`、`assets/sp/mh-*.png` | VIsual novel Character Sprite（表情表切图） | CC0 | https://opengameart.org/content/visual-novel-character-sprite |

## 处理方式

- 背景统一做「去色 → 分层 → 网点 → 双色调（墨 `#1A222C` / 米 `#F4EAD6`）」，
  目的是把不同作者、不同画风（写实渲染 / 插画 / 线稿 / 像素）压成同一套漫画分色，观感统一。
- 立绘由 CC0 表情表按格切分、等比放大到 900px 高，保留原色作为「专色」，在双色调背景上跳出来。
- 想换素材：保持同名文件即可（背景 `assets/bg/*.jpg` 1600×1067，立绘 `assets/sp/*.png` 高 900），代码不用改。
- 重新生成：`python tools/build-assets.py`（需要 Pillow）。
