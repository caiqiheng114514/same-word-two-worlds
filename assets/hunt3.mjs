/* 补搜：街景 / 市集 / 车站 / 餐厅 等缺失场景 + 角色立绘
   用法：node assets/hunt3.mjs
*/
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const OUT = join(HERE, '_cand');
mkdirSync(OUT, { recursive: true });

const QUERIES = [
  'street background', 'city background', 'night city', 'town street',
  'marketplace background', 'market background', 'shop background', 'cafe background',
  'restaurant background', 'train station background', 'subway background',
  'hong kong', 'chinese restaurant', 'temple street'
];
const SKIP = /\/content\/(faq|about|licenses|contact|search|node|taxonomy)/i;
const strip = (h) => h.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();

async function get(url) {
  const r = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html' },
    redirect: 'follow',
    signal: AbortSignal.timeout(20000)
  });
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

const rows = [];
const seen = new Set();

for (const q of QUERIES) {
  let html;
  try { html = await get('https://opengameart.org/art-search?keys=' + encodeURIComponent(q)); }
  catch (e) { console.log('搜索失败', q, e.message); continue; }

  const hits = [];
  const re = /<a href="(\/content\/[^"?#]+)"[^>]*>([\s\S]{0,200}?)<\/a>/g;
  let m;
  while ((m = re.exec(html))) {
    const href = m[1], title = strip(m[2]);
    if (SKIP.test(href) || title.length < 3) continue;
    if (hits.some((h) => h.href === href)) continue;
    hits.push({ href, title });
  }
  console.log(`[${q}] ${hits.length}`);

  for (const h of hits.slice(0, 4)) {
    if (seen.has(h.href)) continue;
    seen.add(h.href);
    try {
      const page = await get('https://opengameart.org' + h.href);
      const images = imgsOf(page).slice(0, 4);
      if (!images.length) continue;
      const licenses = [...new Set((page.match(/CC0|CC-BY(?:-SA)?(?: \d\.\d)?|OGA-BY(?: \d\.\d)?/g) || []))];
      const author = (page.match(/<a href="\/users\/[^"]+">([^<]+)<\/a>/) || [])[1] || '';
      rows.push({ q, title: h.title, href: h.href, url: 'https://opengameart.org' + h.href,
        license: licenses.slice(0, 4).join(' / ') || '?', author, images });
      console.log(`   ✓ ${h.title.slice(0, 40)} [${licenses.slice(0,2).join('/')}]`);
    } catch (e) { console.log('   ✗', h.href, e.message); }
  }
}

writeFileSync(join(OUT, '补搜-manifest.json'), JSON.stringify(rows, null, 2), 'utf8');
console.log(`\n作品 ${rows.length} 个，图片 ${rows.reduce((n, r) => n + r.images.length, 0)} 张`);
