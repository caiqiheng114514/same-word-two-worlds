/* 从 Wikimedia Commons 找香港场景照片（授权清楚，可直接署名使用）
   只做检索与候选清单，不写文件。用法：node assets/search-bg.mjs
*/
const QUERIES = [
  ['mongkok', 'Mong Kok street night Hong Kong'],
  ['teahouse', 'Hong Kong tea house restaurant dim sum'],
  ['market', 'Hong Kong wet market vegetable'],
  ['nathan', 'Nathan Road Hong Kong'],
  ['mtr', 'Hong Kong MTR station platform'],
  ['tenement', 'Hong Kong tenement building staircase'],
  ['taxi', 'Hong Kong taxi red'],
  ['estate', 'Hong Kong public housing estate courtyard']
];

const UA = 'same-word-two-worlds/1.0 (class project; contact: local)';

async function search(term) {
  const url = 'https://commons.wikimedia.org/w/api.php?format=json&action=query'
    + '&generator=search&gsrnamespace=6&gsrlimit=6'
    + '&gsrsearch=' + encodeURIComponent(term + ' filetype:bitmap')
    + '&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1400';
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${term}: HTTP ${res.status}`);
  const data = await res.json();
  const pages = data.query && data.query.pages ? Object.values(data.query.pages) : [];
  return pages.map((p) => {
    const ii = (p.imageinfo || [])[0] || {};
    const meta = ii.extmetadata || {};
    const pick = (k) => (meta[k] ? String(meta[k].value).replace(/<[^>]*>/g, '').slice(0, 90) : '');
    return {
      title: p.title,
      w: ii.width, h: ii.height,
      thumb: ii.thumburl || ii.url,
      page: ii.descriptionurl,
      license: pick('LicenseShortName'),
      artist: pick('Artist'),
      credit: pick('Credit')
    };
  }).filter((x) => x.thumb && x.w >= 900);
}

(async () => {
  for (const [key, term] of QUERIES) {
    console.log('\n### ' + key + '  <<' + term + '>>');
    try {
      const rows = await search(term);
      rows.forEach((r, i) => {
        console.log(`  [${i}] ${r.w}x${r.h}  ${r.license}  ${r.artist}`);
        console.log(`      ${r.title}`);
        console.log(`      ${r.thumb}`);
      });
      if (!rows.length) console.log('  (无结果)');
    } catch (e) {
      console.log('  ERR ' + e.message);
    }
  }
})();
