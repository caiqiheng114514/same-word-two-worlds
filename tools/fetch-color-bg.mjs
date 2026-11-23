/* 从 OpenGameArt 详情页抓原始（彩色）大图
   用法：node tools/fetch-color-bg.mjs
   产出：assets/_cand/color/<key>-<n>.<ext>
*/
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'assets', '_cand', 'color');
fs.mkdirSync(OUT, { recursive: true });

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0 Safari/537.36';

const PAGES = {
  house: 'https://opengameart.org/content/visual-novel-house-backgrounds',
  vnstyle: 'https://opengameart.org/content/visual-novel-style-backgrounds',
  hallway: 'https://opengameart.org/content/hallway-daynight-background-visual-novel',
  city: 'https://opengameart.org/content/city-background-repetitive-2',
  night: 'https://opengameart.org/content/parallax-city-night-4-colors',
  subway: 'https://opengameart.org/content/br-sao-paulo-subway'
};

async function get(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.text();
}

for (const [key, page] of Object.entries(PAGES)) {
  try {
    const html = await get(page);
    // 内容区的图：/sites/default/files/...
    const urls = [...html.matchAll(/https?:\/\/opengameart\.org\/sites\/default\/files\/[^"'\s)]+\.(?:png|jpg|jpeg)/gi)]
      .map((m) => m[0])
      .filter((u) => !/styles\/|thumb|icon/i.test(u));
    const uniq = [...new Set(urls)];
    console.log(`${key}: 找到 ${uniq.length} 张`);
    let n = 0;
    for (const u of uniq) {
      const ext = path.extname(new URL(u).pathname).toLowerCase();
      const name = `${key}-${n}${ext}`;
      const dest = path.join(OUT, name);
      if (fs.existsSync(dest)) { n++; continue; }
      try {
        const r = await fetch(u, { headers: { 'User-Agent': UA } });
        if (!r.ok) { console.log(`   ! ${name} ${r.status}`); continue; }
        const buf = Buffer.from(await r.arrayBuffer());
        if (buf.length < 20000) { console.log(`   - ${name} 太小 ${buf.length}`); continue; }
        fs.writeFileSync(dest, buf);
        console.log(`   + ${name}  ${(buf.length / 1024).toFixed(0)} KB`);
        n++;
      } catch (e) { console.log(`   ! ${name} ${e.message}`); }
    }
  } catch (e) {
    console.log(`${key}: 失败 ${e.message}`);
  }
}
