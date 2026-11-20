/* OpenGameArt 抓取：从搜索页找作品，从作品页抽图片 + 许可证，下载缩略图做联系表
   用法：node assets/hunt2.mjs 背景|角色
*/
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const OUT = join(HERE, '_cand');
mkdirSync(OUT, { recursive: true });

const QUERIES = {
  背景: ['visual novel style backgrounds', 'visual novel house backgrounds', 'anime background',
        'background cafe restaurant', 'background market street', 'background station subway'],
  角色: ['anime character sprite', 'visual novel character art', 'anime boy protagonist sprite',
        'character sprite transparent anime', 'visual novel sprite set']
};
const SKIP = /\/content\/(faq|about|licenses|contact|search|node|taxonomy)/i;

const strip = (h) => h.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();

async function get(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' }, redirect: 'follow' });
  if (!r.ok) throw new Error(url + ' -> ' + r.status);
  return r.text();
}

function imgsOf(html) {
  const out = [];
  const re = /(?:src|href)="((?:https?:\/\/opengameart\.org)?\/sites\/default\/files\/[^"]+?\.(?:png|jpg|jpeg|PNG|JPG|JPEG))"/g;
  let m;
  while ((m = re.exec(html))) {
    let u = m[1];
    if (u.startsWith('/')) u = 'https://opengameart.org' + u;
    if (!out.includes(u)) out.push(u);
  }
  return out;
}

async function searchOne(q) {
  const html = await get('https://opengameart.org/art-search?keys=' + encodeURIComponent(q));
  const hits = [];
  const re = /<a href="(\/content\/[^"?#]+)"[^>]*>([\s\S]{0,200}?)<\/a>/g;
  let m;
  while ((m = re.exec(html))) {
    const href = m[1];
    const title = strip(m[2]);
    if (SKIP.test(href) || title.length < 3) continue;
    if (hits.some((h) => h.href === href)) continue;
    hits.push({ href, title });
  }
  return hits.slice(0, 6);
}

async function detail(href) {
  const html = await get('https://opengameart.org' + href);
  const licenses = [...new Set((html.match(/CC0|CC-BY(?:-SA)?(?: \d\.\d)?|OGA-BY(?: \d\.\d)?|GPL(?: \d\.\d)?/g) || []))];
  const author = (html.match(/<a href="\/users\/[^"]+">([^<]+)<\/a>/) || [])[1] || '';
  return {
    url: 'https://opengameart.org' + href,
    license: licenses.slice(0, 5).join(' / ') || '?',
    author,
    images: imgsOf(html).slice(0, 8)
  };
}

const group = process.argv[2] || '背景';
const rows = [];
const seen = new Set();

for (const q of (QUERIES[group] || QUERIES['背景'])) {
  let hits = [];
  try { hits = await searchOne(q); } catch (e) { console.log('搜索失败：', q, e.message); continue; }
  console.log(`[${q}] 找到 ${hits.length}`);
  for (const h of hits) {
    if (seen.has(h.href)) continue;
    seen.add(h.href);
    try {
      const d = await detail(h.href);
      if (!d.images.length) continue;
      rows.push({ q, title: h.title, href: h.href, ...d });
      console.log(`   ✓ ${h.title.slice(0, 44)}  [${d.license}]  ${d.images.length} 图`);
    } catch (e) { console.log('   ✗ ' + h.href + ' ' + e.message); }
  }
}

writeFileSync(join(OUT, `${group}-manifest.json`), JSON.stringify(rows, null, 2), 'utf8');

const cards = rows.map((r, i) => r.images.slice(0, 3).map((u, j) => `
  <figure>
    <img src="${u}" loading="lazy">
    <figcaption><b>#${i + 1}.${j + 1}</b> ${r.title.slice(0, 34)}<br><span>${r.license}</span></figcaption>
  </figure>`).join('')).join('');

writeFileSync(join(OUT, `${group}-sheet.html`), `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#222;color:#ddd;font:11px/1.35 sans-serif;padding:6px}
.g{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
figure{margin:0;background:#333;border-radius:5px;overflow:hidden}
img{width:100%;height:140px;object-fit:cover;display:block;background:#111}
figcaption{padding:3px 4px}span{color:#9cf}
</style></head><body><div class="g">${cards}</div></body></html>`, 'utf8');

console.log(`\n候选作品 ${rows.length} 个，图片 ${rows.reduce((n, r) => n + r.images.length, 0)} 张`);
console.log(`联系表：assets/_cand/${group}-sheet.html`);
