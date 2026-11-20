/* 并发下载候选图（带超时），生成本地联系表
   用法：node assets/grab2.mjs 补搜
*/
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const group = process.argv[2] || '补搜';
const rows = JSON.parse(readFileSync(join(HERE, '_cand', `${group}-manifest.json`), 'utf8'));
const OUT = join(HERE, '_cand', group);
mkdirSync(OUT, { recursive: true });

const jobs = [];
rows.forEach((r, i) => {
  r.images.slice(0, 3).forEach((url, j) => {
    jobs.push({ url, i, j, r, name: `${String(i + 1).padStart(2, '0')}-${j + 1}${(extname(url) || '.jpg').toLowerCase()}` });
  });
});

const saved = [];
let idx = 0;
async function worker() {
  while (idx < jobs.length) {
    const job = jobs[idx++];
    const file = join(OUT, job.name);
    if (existsSync(file) && statSync(file).size > 3000) {
      saved.push({ ...job, local: job.name });
      continue;
    }
    try {
      const res = await fetch(job.url, {
        headers: { 'User-Agent': UA, Referer: 'https://opengameart.org/' },
        redirect: 'follow',
        signal: AbortSignal.timeout(12000)
      });
      if (!res.ok) { continue; }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 3000) continue;
      writeFileSync(file, buf);
      saved.push({ ...job, local: job.name });
      console.log(`  ✓ ${job.name} ${(buf.length / 1024).toFixed(0)}KB ${job.r.title.slice(0, 34)}`);
    } catch (e) { /* 超时就跳过 */ }
  }
}
await Promise.all([worker(), worker(), worker(), worker(), worker()]);

saved.sort((a, b) => a.name.localeCompare(b.name));
writeFileSync(join(HERE, '_cand', `${group}-local.json`), JSON.stringify(
  saved.map((s) => ({ local: s.local, url: s.url, title: s.r.title, license: s.r.license, page: s.r.url, author: s.r.author })), null, 2), 'utf8');

const cards = saved.map((s) => `
  <figure>
    <img src="${group}/${s.local}">
    <figcaption><b>${s.local}</b><br>${s.r.title.slice(0, 32)}<br><span>${s.r.license}</span></figcaption>
  </figure>`).join('');

writeFileSync(join(HERE, '_cand', `${group}-local.html`), `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#1d1d1d;color:#e5e5e5;font:11px/1.35 sans-serif;padding:6px}
.g{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
figure{margin:0;background:#2c2c2c;border-radius:5px;overflow:hidden}
img{width:100%;height:130px;object-fit:cover;display:block;background:#111}
figcaption{padding:3px 4px}span{color:#9cf}
</style></head><body><div class="g">${cards}</div></body></html>`, 'utf8');

console.log(`\n存下 ${saved.length}/${jobs.length} 张 → assets/_cand/${group}/`);
