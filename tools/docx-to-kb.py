# -*- coding: utf-8 -*-
"""把《香港内地用语差异词条库（互动游戏用）.docx》转成 pipe 数据

输出：
  data/kb.pipe.txt    67 条：cat|word|hk|ml|why|format
  data/demo.pipe.txt  10 道现成题：n|stem|answer|reveal

只在词条库更新时跑一次（需要 python-docx）：
  python tools/docx-to-kb.py "路径/词条库.docx"
之后跑 node tools/kb-to-js.mjs 生成 kb.js。
"""
import sys
import os
import docx

SRC = sys.argv[1] if len(sys.argv) > 1 else (
    r"D:\weixin\xwechat_files\wxid_8jp6rodsra5312_2161\msg\file\2026-11\香港内地用语差异词条库（互动游戏用）.docx"
)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")

# 六张表 → 分类（前 5 张是词条，第 6 张是现成题）
CATS = [
    ("A", "同词异指", "A 类｜同一个词，指的是两件不同的事"),
    ("B", "一边有", "B 类｜一边有、另一边没有的说法"),
    ("C", "禁忌委婉", "C 类｜禁忌与委婉：说错会真的得罪人"),
    ("D", "称谓", "D 类｜称谓：叫错人比说错词更难收场"),
    ("E", "校园日常", "E 类｜校园与日常：每天都会撞上的小差异"),
]


def cell(c):
    return " ".join(c.text.split())


d = docx.Document(SRC)
tables = d.tables
assert len(tables) == 6, f"预期 6 张表，实际 {len(tables)}"

kb_lines = []
for idx, (cat, short, _title) in enumerate(CATS):
    t = tables[idx]
    rows = t.rows[1:]                      # 跳过表头
    for r in rows:
        cells = [cell(c) for c in r.cells]
        # 五列统一为：词 | 香港 | 内地 | 为什么 | 适合题型
        assert len(cells) == 5, f"表 {idx} 列数 {len(cells)}"
        word, hk, ml, why, fmt = cells
        if not word:
            continue
        for v in (word, hk, ml, why, fmt):
            assert "|" not in v, f"字段含竖线：{v}"
        kb_lines.append(f"{cat}|{word}|{hk}|{ml}|{why}|{fmt}")

demo_lines = []
dt = tables[5]
for r in dt.rows[1:]:
    cells = [cell(c) for c in r.cells]
    assert len(cells) == 4, f"现成题列数 {len(cells)}"
    n, stem, answer, reveal = cells
    demo_lines.append(f"{n}|{stem}|{answer}|{reveal}")

os.makedirs(DATA, exist_ok=True)
with open(os.path.join(DATA, "kb.pipe.txt"), "w", encoding="utf-8", newline="\n") as f:
    f.write("\n".join(kb_lines) + "\n")
with open(os.path.join(DATA, "demo.pipe.txt"), "w", encoding="utf-8", newline="\n") as f:
    f.write("\n".join(demo_lines) + "\n")

counts = {}
for line in kb_lines:
    counts[line[0]] = counts.get(line[0], 0) + 1

print(f"词条 {len(kb_lines)} 条：", " ".join(f"{k}={v}" for k, v in sorted(counts.items())))
print(f"现成题 {len(demo_lines)} 道")
print("已写入 data/kb.pipe.txt, data/demo.pipe.txt")
