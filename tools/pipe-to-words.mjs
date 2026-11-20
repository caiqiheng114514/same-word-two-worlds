/* pipe 题库 → words.js
   数据源：data/questions.pipe.txt（竖线分隔，可直接粘进飞书表格 / Excel）
   字段顺序：id|word|mode|scene|stem|options|answer|why|tip|level|audio|art|source

   用法：node tools/pipe-to-words.mjs
   产出：words.js（自动生成，不要手改；改 pipe 文件再跑这个脚本）
*/
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(ROOT, 'data/questions.pipe.txt');
const OUT = resolve(ROOT, 'words.js');

const FIELDS = ['id', 'word', 'mode', 'scene', 'stem', 'options', 'answer', 'why', 'tip', 'level', 'audio', 'art', 'source'];

/* 关卡顺序（来自「难度排序与关卡曲线」那张表）：id → [播放序号, 关卡, 关卡名] */
const ORDER = {
  'dishi-m1-01':   [1,  1, '热身'],
  'xuegui-m1-01':  [2,  1, '热身'],
  'yincha-m1-01':  [3,  1, '热身'],
  'lishi-m1-01':   [4,  2, '高频'],
  'shiduo-m1-01':  [5,  2, '高频'],
  'fanggong-m1-01':[6,  2, '高频'],
  'banfang-m1-01': [7,  2, '高频'],
  'dixia-m1-01':   [8,  2, '高频'],
  'jiwu-m1-01':    [9,  2, '高频'],
  'zhuli-m1-01':   [10, 3, '敏感'],
  'guoshen-m1-01': [11, 3, '敏感'],
  'bojin-m1-01':   [12, 3, '敏感'],
  'yincha-m2-01':  [13, 4, '当场处理'],
  'banfang-m2-01': [14, 4, '当场处理'],
  'jiwu-m2-01':    [15, 4, '当场处理'],
  'zhuli-m2-01':   [16, 4, '当场处理'],
  'guoshen-m2-01': [17, 4, '当场处理'],
  'bojin-m2-01':   [18, 4, '当场处理'],
  'fanggong-m3-01':[19, 5, '改口'],
  'banfang-m3-01': [20, 5, '改口'],
  'dixia-m3-01':   [21, 5, '改口'],
  'zhuli-m3-01':   [22, 5, '改口'],
  'guoshen-m3-01': [23, 5, '改口'],
  'bojin-m3-01':   [24, 5, '改口']
};

const CIRCLED = /^[①②③]\s*/;
const raw = readFileSync(SRC, 'utf8').replace(/^\uFEFF/, '');

const items = [];
const errors = [];

raw.split(/\r?\n/).forEach((line, i) => {
  const text = line.trim();
  if (!text || text.startsWith('#')) return;

  const parts = text.split('|');
  if (parts.length !== FIELDS.length) {
    errors.push(`第 ${i + 1} 行：字段数 ${parts.length}，应为 ${FIELDS.length}`);
    return;
  }

  const row = {};
  FIELDS.forEach((f, k) => { row[f] = parts[k].trim(); });

  // options：按 ①②③ 切开，去掉行首记号（站点自己画序号）
  const options = row.options
    .split(/(?=[①②③])/)
    .map((s) => s.replace(CIRCLED, '').trim())
    .filter(Boolean);

  const seq = ORDER[row.id];
  if (!seq) errors.push(`第 ${i + 1} 行：${row.id} 不在关卡顺序表里`);

  items.push({
    id: row.id,
    word: row.word,
    mode: row.mode,
    seq: seq ? seq[0] : 999,
    stage: seq ? seq[1] : 0,
    stageName: seq ? seq[2] : '',
    level: Number(row.level),
    scene: row.scene,
    stem: row.stem,
    options,
    answer: Number(row.answer),
    why: row.why,
    tip: row.tip,
    audio: row.audio === '留空' ? '' : row.audio,
    art: row.art,
    source: row.source
  });
});

if (errors.length) {
  console.error('✗ pipe 文件有问题：');
  errors.forEach((e) => console.error('  - ' + e));
  process.exit(1);
}

items.sort((a, b) => a.seq - b.seq);

const body = items.map((q) => {
  const opt = q.options.map((o) => JSON.stringify(o)).join(', ');
  return [
    '  {',
    `    id: ${JSON.stringify(q.id)}, word: ${JSON.stringify(q.word)}, mode: ${JSON.stringify(q.mode)},`,
    `    seq: ${q.seq}, stage: ${q.stage}, stageName: ${JSON.stringify(q.stageName)}, level: ${q.level},`,
    `    scene: ${JSON.stringify(q.scene)},`,
    `    stem: ${JSON.stringify(q.stem)},`,
    `    options: [${opt}],`,
    `    answer: ${q.answer},`,
    `    why: ${JSON.stringify(q.why)},`,
    `    tip: ${JSON.stringify(q.tip)},`,
    `    audio: ${JSON.stringify(q.audio)}, art: ${JSON.stringify(q.art)}, source: ${JSON.stringify(q.source)}`,
    '  }'
  ].join('\n');
}).join(',\n');

const header = `/* 同词异义 · 港陆词语小游戏 — 题库（自动生成，请勿手改）
 *
 * 数据源：data/questions.pipe.txt（竖线分隔，可直接粘进飞书表格 / Excel）
 * 重新生成：node tools/pipe-to-words.mjs
 * 自检：    node tools/check-words.mjs
 *
 * 字段：id word mode scene stem options answer why tip level audio art source
 *       seq / stage / stageName = 关卡顺序（来自难度曲线表）
 */
window.__QUESTIONS__ = [
`;

writeFileSync(OUT, header + body + '\n];\n', 'utf8');

const dist = { 0: 0, 1: 0, 2: 0 };
items.forEach((q) => { dist[q.answer] += 1; });
const byMode = {};
items.forEach((q) => { byMode[q.mode] = (byMode[q.mode] || 0) + 1; });

console.log(`✓ 已生成 words.js：${items.length} 题`);
console.log(`  模式：${Object.entries(byMode).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
console.log(`  关卡：${[...new Set(items.map((q) => q.stage))].map((s) => `第${s}关(${items.filter((q) => q.stage === s).length})`).join(' ')}`);
console.log(`  正确项分布：①${dist[0]} ②${dist[1]} ③${dist[2]}`);
