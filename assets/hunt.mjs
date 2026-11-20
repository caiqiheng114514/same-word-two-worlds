/* 在 OpenGameArt 上搜素材（背景 / 立绘），产出候选清单 + 缩略图联系表
   用法：node assets/hunt.mjs [背景|角色]
*/
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const OUT = join(HERE, '_cand');
mkdirSync(OUT, { recursive: true });

const QUERIES = {
  背景: [
    'visual novel background',
    'anime background street',
    'vn background city',
    'background restaurant interior',
    'background market',
    'background subway station'
  ],
  角色: [
    'anime character sprite',
    'visual novel sprite',
    'anime boy sprite',
    'character portrait anime',
    'vn character transparent'
  ]
};

function strip(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
}

async function get(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html,*/*' }, redirect: 'follow' });
  if (!r.ok) throw new Error(url + ' -> ' + r.status);
  return r.text();
}

async function searchOne(q) {
  const url = 'https://opengameart.org/art-search?keys=' + encodeURIComponent(q);
  const html = await get(url);
  const found = [];
  const re = /<a href="(\/content\/[^"]+)"[^>]*>([\s\S]{0,160}?)<\/a>/g;
  let m;
  while ((m = re.exec(html))) {
    const href = m[1];
    const text = strip(m[2]);
    if (!text || text.length < 3) continue;
    if (found.some((f) => f.href === href)) continue;
    found.push({ href, title: text });
  }
  return found.slice(0, 8);
}

async function detail(href) {
  const url = 'https://opengameart.org' + href;
  const html = await get(url);
  // 许可证
  const lic = (html.match(/CC0|CC-BY[^<"]{0,6}|OGA-BY[^<"]{0,6}|GPL[^<"]{0,4}/g) || []);
  const license = [...new Set(lic)].slice(0, 4).join(' / ') || '?';
  // 页面里的图片（跳过图标）
  const imgs = [];
  const re = /(?:src|href)="(\/sites\/default\/files\/[^"]+\.(?:png|jpg|jpeg|PNG|JPG|JPEG))"/g;
  let m;
  while ((m = re.exec(html))) {
    const u = m[1];
    if (imgs.includes(u)) continue;
    if (/\/styles\/(icon|thumbnail)/i.test(u)) continue;
    imgs.push(u);
  }
  // 作者
  const author = (html.match(/<a href="\/users\/[^"]+">([^<]+)<\/a>/) || [])[1] || '';
  return { url, license, images: imgs.slice(0, 6), author };
}

const group = process.argv[2] || '背景';
const queries = QUERIES[group] || QUERIES['背景'];
const seen = new Set();
const rows = [];

for (const q of queries) {
  let hits = [];
  try { hits = await searchOne(q); } catch (e) { console.log('搜索失败', q, e.message); continue; }
  console.log(`[${q}] ${hits.length} 条`);
  for (const h of hits) {
    if (seen.has(h.href)) continue;
    seen.add(h.href);
    try {
      const d = await detail(h.href);
      if (!d.images.length) continue;
      rows.push({ q, title: h.title, href: h.href, ...d });
      console.log('   ✓', h.title.slice(0, 42), '|', d.license);
    } catch (e) { console.log('   ✗', h.href, e.message); }
  }
}

writeFileSync(join(OUT, `${group}-manifest.json`), JSON.stringify(rows, null, 2), 'utf8');

// 联系表：取每条的缩略图（OGA 的 styles/thumbnail 不一定有，直接用原图缩放在 <img> 里）
const cards = rows.map((r, i) => `
  <figure>
    <img src="https://opengameart.org${r.images[0]}" loading="lazy">
    <figcaption><b>#${i + 1}</b> ${r.title.slice(0, 40)}<br><span>${r.license}</span></figcaption>
  </figure>`).join('');

writeFileSync(join(OUT, `${group}-sheet.html`), `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#222;color:#ddd;font:11px/1.4 sans-serif;padding:6px}
.g{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
figure{margin:0;background:#333;border-radius:5px;overflow:hidden}
img{width:100%;height:150px;object-fit:cover;display:block;background:#111}
figcaption{padding:3px 4px}span{color:#9cf}
</style></head><body><div class="g">${cards}</div></body></html>`, 'utf8');

console.log(`\n共 ${rows.length} 条候选，清单：assets/_cand/${group}-manifest.json`);
console.log(`联系表：assets/_cand/${group}-sheet.html`);
