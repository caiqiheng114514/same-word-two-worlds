/* 词条库 pipe → kb.js
   数据源：data/kb.pipe.txt（67 条）、data/demo.pipe.txt（10 道现成题）
   产出：kb.js（window.__KB__ / window.__DEMO__，自动生成，勿手改）

   用法：node tools/kb-to-js.mjs
*/
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const CATS = {
  A: { name: '同词异指', desc: '同一个词，指的是两件不同的事', hint: '出题首选：两边都在用，答错的人不会觉得自己在猜' },
  B: { name: '一边有', desc: '一边有、另一边没有的说法', hint: '补充题或加分题：重点在揭晓后解释「为什么会有这个词」' },
  C: { name: '禁忌委婉', desc: '禁忌与委婉：说错会真的得罪人', hint: '冲击力最强但要慎用：只说词义，不让观众现场编' },
  D: { name: '称谓', desc: '称谓：叫错人比说错词更难收场', hint: '适合角色扮演：叫法一错，对方表情立刻变' },
  E: { name: '校园日常', desc: '校园与日常：每天都会撞上的小差异', hint: '难度低，适合热身或抢答，不适合压轴' }
};

function readPipe(file, fields) {
  const text = readFileSync(resolve(ROOT, file), 'utf8').replace(/^\uFEFF/, '');
  const rows = [];
  text.split(/\r?\n/).forEach((line, i) => {
    const s = line.trim();
    if (!s) return;
    const parts = s.split('|');
    if (parts.length !== fields.length) {
      throw new Error(`${file} 第 ${i + 1} 行字段数 ${parts.length}，应为 ${fields.length}`);
    }
    const row = {};
    fields.forEach((f, k) => { row[f] = parts[k].trim(); });
    rows.push(row);
  });
  return rows;
}

const kb = readPipe('data/kb.pipe.txt', ['cat', 'word', 'hk', 'ml', 'why', 'format']).map((r) => ({
  cat: r.cat,
  catName: (CATS[r.cat] || {}).name || r.cat,
  word: r.word,
  hk: r.hk,
  ml: r.ml,
  why: r.why,
  format: r.format
}));

const demoAll = readPipe('data/demo.pipe.txt', ['n', 'stem', 'answer', 'reveal']).map((r) => ({
  n: Number(r.n),
  stem: r.stem,
  answer: r.answer,
  reveal: r.reveal
}));

/* 展示模式默认取 3 题：热身 1 + 主力 1 + 收尾 1（词条库建议「三题足够」） */
const DEMO_PICK = [1, 4, 9];

const bad = kb.filter((r) => !CATS[r.cat]);
if (bad.length) throw new Error(`未知分类：${bad.map((b) => b.cat).join(',')}`);
if (kb.length !== 67) console.warn(`⚠ 词条数为 ${kb.length}，文档里写的是 67 条`);

const counts = {};
kb.forEach((r) => { counts[r.cat] = (counts[r.cat] || 0) + 1; });

const header = `/* 同词异义 · 词条库（自动生成，请勿手改）
 *
 * 数据源：data/kb.pipe.txt、data/demo.pipe.txt
 * 重新生成：node tools/kb-to-js.mjs
 * 原始文档：《香港内地用语差异词条库（互动游戏用）》67 条
 */
`;

const kv = `window.__KB_CATS__ = ${JSON.stringify(CATS, null, 2)};
window.__KB__ = [
${kb.map((r) => '  ' + JSON.stringify(r)).join(',\n')}
];
window.__DEMO__ = [
${demoAll.map((r) => '  ' + JSON.stringify(r)).join(',\n')}
];
window.__DEMO_PICK__ = ${JSON.stringify(DEMO_PICK)};
`;

writeFileSync(resolve(ROOT, 'kb.js'), header + kv, 'utf8');

console.log(`✓ 已生成 kb.js：词条 ${kb.length} 条（${Object.keys(counts).sort().map((k) => k + '=' + counts[k]).join(' ')}）`);
console.log(`  现成题 ${demoAll.length} 道，展示模式默认取第 ${DEMO_PICK.join('、')} 题`);
