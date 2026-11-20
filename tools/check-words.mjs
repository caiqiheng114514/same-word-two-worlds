/* 题库自检：字段、下标、字数上限、判断词、关卡顺序、正确项分布
   用法：node tools/check-words.mjs */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const target = process.argv[2] ? resolve(process.argv[2]) : resolve(here, '..', 'words.js');

const src = readFileSync(target, 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(src, sandbox);

const list = sandbox.window.__QUESTIONS__;
const problems = [];
const MODES = new Set(['m1', 'm2', 'm3']);
const BANNED = ['很奇怪', '好奇怪', '不礼貌', '不标准', '不正常', '逻辑不通', '反着来', '你们这样'];
const AUDIO = new Set(['', '建议粤语']);
const REQUIRED = ['id', 'word', 'mode', 'scene', 'stem', 'options', 'answer', 'why', 'tip', 'level', 'source'];

if (!Array.isArray(list) || list.length === 0) {
  console.error('✗ words.js 里没有 window.__QUESTIONS__ 数组');
  process.exit(1);
}

const seenId = new Set();
const seenSeq = new Set();
const byMode = { m1: 0, m2: 0, m3: 0 };
const byStage = {};
const dist = { 0: 0, 1: 0, 2: 0 };

list.forEach((q, i) => {
  const at = `#${i + 1} ${q && q.id ? q.id : '(无 id)'}`;

  REQUIRED.forEach((k) => {
    if (q[k] === undefined || q[k] === null || q[k] === '') problems.push(`${at}: 缺字段 ${k}`);
  });

  if (seenId.has(q.id)) problems.push(`${at}: id 重复`);
  seenId.add(q.id);

  if (seenSeq.has(q.seq)) problems.push(`${at}: seq ${q.seq} 重复`);
  seenSeq.add(q.seq);
  if (q.seq !== i + 1) problems.push(`${at}: seq 应为 ${i + 1}（数组未按关卡顺序排列）`);

  if (!MODES.has(q.mode)) problems.push(`${at}: mode 必须是 m1/m2/m3，实际 ${q.mode}`);
  else byMode[q.mode] += 1;

  if (!(q.level >= 1 && q.level <= 3)) problems.push(`${at}: level 必须是 1–3，实际 ${q.level}`);
  if (!(q.stage >= 1 && q.stage <= 5)) problems.push(`${at}: stage 必须是 1–5，实际 ${q.stage}`);
  else byStage[q.stage] = (byStage[q.stage] || 0) + 1;

  if (!Array.isArray(q.options) || q.options.length !== 3) {
    problems.push(`${at}: options 必须 3 项，实际 ${Array.isArray(q.options) ? q.options.length : typeof q.options}`);
  }
  if (typeof q.answer !== 'number' || q.answer < 0 || q.answer > 2) {
    problems.push(`${at}: answer 必须是 0–2 的整数，实际 ${q.answer}`);
  } else {
    dist[q.answer] += 1;
  }
  if (Array.isArray(q.options) && new Set(q.options).size !== q.options.length) {
    problems.push(`${at}: options 有重复项`);
  }
  if (Array.isArray(q.options) && q.options.some((o) => /^[①②③]/.test(o))) {
    problems.push(`${at}: options 里还留着 ①②③ 记号（站点自己画序号，应去掉）`);
  }

  const why = String(q.why || '');
  const tip = String(q.tip || '');
  if (why.length > 25) problems.push(`${at}: why ${why.length} 字，超过 25（${why}）`);
  if (tip.length > 20) problems.push(`${at}: tip ${tip.length} 字，超过 20（${tip}）`);

  BANNED.forEach((w) => {
    if (why.includes(w) || tip.includes(w)) problems.push(`${at}: 为什么不达标：出现判断词「${w}」`);
  });

  if (!AUDIO.has(q.audio || '')) problems.push(`${at}: audio 只能是「建议粤语」或留空，实际「${q.audio}」`);

  if (i < 3 && q.level !== 1) problems.push(`${at}: 前 3 题必须难度 1（防劝退），实际 ${q.level}`);
  if (i < 3 && q.stage !== 1) problems.push(`${at}: 前 3 题必须属第 1 关，实际第 ${q.stage} 关`);
});

// 正确项必须打散，避免一路点①
[0, 1, 2].forEach((k) => {
  if (dist[k] === 0) problems.push(`正确项分布：没有任何一题的正确项在 ①/②/③ 的第 ${k + 1} 位，位置没打散`);
});

const words = new Set(list.map((q) => q.word));
const maxWhy = Math.max(...list.map((q) => String(q.why || '').length));
const maxTip = Math.max(...list.map((q) => String(q.tip || '').length));

console.log(`题库：${target}`);
console.log(`  题目 ${list.length} 道｜词 ${words.size} 组｜m1 ${byMode.m1} · m2 ${byMode.m2} · m3 ${byMode.m3}`);
console.log(`  关卡 ${Object.keys(byStage).sort().map((s) => `第${s}关(${byStage[s]})`).join(' ')}`);
console.log(`  正确项分布 ①${dist[0]} ②${dist[1]} ③${dist[2]}`);
console.log(`  最长 why ${maxWhy} 字｜最长 tip ${maxTip} 字`);

if (problems.length) {
  console.error(`\n✗ 发现 ${problems.length} 个问题：`);
  problems.forEach((p) => console.error('  - ' + p));
  process.exit(1);
}
console.log('\n✓ 全部通过');
