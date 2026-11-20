/* 把 manifest 里的候选图下载到本地，生成本地联系表
   用法：node assets/grab.mjs 背景|角色
*/
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const group = process.argv[2] || '背景';
const MAN = join(HERE, '_cand', `${group}-manifest.json`);
const OUT = join(HERE, '_cand', group);
mkdirSync(OUT, { recursive: true });

const rows = JSON.parse(readFileSync(MAN, 'utf8'));
const saved = [];

for (let i = 0; i < rows.length; i++) {
  const r = rows[i];
  for (let j = 0; j < r.images.length; j++) {
    const url = r.images[j];
    const ext = (extname(url) || '.jpg').toLowerCase();
    const name = `${String(i + 1).padStart(2, '0')}-${j + 1}${ext}`;
    const file = join(OUT, name);
    if (existsSync(file) && statSync(file).size > 3000) {
      saved.push({ name, url, title: r.title, license: r.license, page: r.url, author: r.author });
      continue;
    }
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Referer: 'https://opengameart.org/' },
        redirect: 'follow',
        signal: AbortSignal.timeout(20000)
      });
      if (!res.ok) { console.log(`  ✗ ${name} HTTP ${res.status}`); continue; }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 3000) { console.log(`  ✗ ${name} 太小 ${buf.length}`); continue; }
      writeFileSync(file, buf);
      saved.push({ name, url, title: r.title, license: r.license, page: r.url, author: r.author });
      console.log(`  ✓ ${name}  ${(buf.length / 1024).toFixed(0)} KB  ${r.title.slice(0, 30)}`);
    } catch (e) {
      console.log(`  ✗ ${name} ${e.cause ? e.cause.code : e.message}`);
    }
  }
}

writeFileSync(join(HERE, '_cand', `${group}-local.json`), JSON.stringify(saved, null, 2), 'utf8');

const cards = saved.map((s) => `
  <figure>
    <img src="${group}/${s.name}">
    <figcaption><b>${s.name}</b><br>${s.title.slice(0, 30)}<br><span>${s.license}</span></figcaption>
  </figure>`).join('');

writeFileSync(join(HERE, '_cand', `${group}-local.html`), `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#1d1d1d;color:#e5e5e5;font:11px/1.35 sans-serif;padding:6px}
.g{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
figure{margin:0;background:#2c2c2c;border-radius:5px;overflow:hidden}
img{width:100%;height:150px;object-fit:contain;display:block;background:#111}
figcaption{padding:3px 4px}span{color:#9cf}
</style></head><body><div class="g">${cards}</div></body></html>`, 'utf8');

console.log(`\n已存 ${saved.length} 张 → assets/_cand/${group}/`);
console.log(`本地联系表：assets/_cand/${group}-local.html`);
