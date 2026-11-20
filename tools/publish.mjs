/* 一键发布到 GitHub（不装 git，直连 REST API）
   用法：
     set GITHUB_TOKEN=ghp_xxx
     node tools/publish.mjs [仓库名]

   流程：
     1) 找账号 → 建仓库（已存在就复用）
     2) 空仓库不能直接建 blob（409），先用 Contents API 放一个 .nojekyll 打底
     3) Git Data API 一次提交全部文件（叠在打底提交之上，只有一个 commit）
     4) 开启 GitHub Pages
*/
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, relative, sep } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const REPO = (process.argv[2] || 'same-word-two-worlds').trim();
const DESC = '同一个词，香港和内地可以是两个意思 —— 港陆「同词异义」情景对话小游戏（纯静态）';
const SKIP = new Set(['.git', 'node_modules', '_auto.html', '_diag.html', '_narrow.html', '_narrow.css', '_t.html']);

if (!TOKEN) { console.error('缺少 GITHUB_TOKEN'); process.exit(1); }

const API = 'https://api.github.com';
const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'Content-Type': 'application/json',
  'User-Agent': 'same-word-two-worlds-publisher'
};

async function api(method, path, body) {
  const res = await fetch(API + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!res.ok) {
    const err = new Error(`${method} ${path} -> ${res.status} ${data && data.message ? data.message : ''}`);
    err.status = res.status; err.data = data;
    throw err;
  }
  return data;
}

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

(async () => {
  const me = await api('GET', '/user');
  console.log(`账号：${me.login}`);

  let repo;
  try {
    repo = await api('GET', `/repos/${me.login}/${REPO}`);
    console.log(`仓库已存在：${repo.html_url}`);
  } catch (e) {
    if (e.status !== 404) throw e;
    repo = await api('POST', '/user/repos', {
      name: REPO, description: DESC, private: false, auto_init: false
    });
    console.log(`已创建仓库：${repo.html_url}`);
  }

  // 1) 确保 main 上至少有一个提交
  let baseSha = null;
  try {
    const ref = await api('GET', `/repos/${me.login}/${REPO}/git/ref/heads/main`);
    baseSha = ref.object.sha;
    console.log('main 已有提交，接在其后');
  } catch (e) {
    if (![404, 409].includes(e.status)) throw e;
    console.log('空仓库 → 先放一个 .nojekyll 打底');
    await api('PUT', `/repos/${me.login}/${REPO}/contents/.nojekyll`, {
      message: 'chore: init', content: 'Cg=='
    });
    const ref = await api('GET', `/repos/${me.login}/${REPO}/git/ref/heads/main`);
    baseSha = ref.object.sha;
  }

  const baseCommit = await api('GET', `/repos/${me.login}/${REPO}/git/commits/${baseSha}`);
  const baseTree = baseCommit.tree.sha;

  // 2) 上传 blob
  const files = walk(ROOT).filter((f) => !/\.nojekyll$/.test(f));
  console.log(`准备提交 ${files.length} 个文件…`);

  const tree = [];
  for (const full of files) {
    const rel = relative(ROOT, full).split(sep).join('/');
    const buf = fs.readFileSync(full);
    const blob = await api('POST', `/repos/${me.login}/${REPO}/git/blobs`, {
      content: buf.toString('base64'), encoding: 'base64'
    });
    tree.push({ path: rel, mode: '100644', type: 'blob', sha: blob.sha });
    if (tree.length % 10 === 0) console.log(`  …${tree.length}/${files.length}`);
  }

  // 3) tree → commit → 移动分支
  const treeRes = await api('POST', `/repos/${me.login}/${REPO}/git/trees`, { base_tree: baseTree, tree });
  const commit = await api('POST', `/repos/${me.login}/${REPO}/git/commits`, {
    message: '首版：情景对话 8 幕 · 练习 24 题 · 词条库 67 条 · 四档结算 CG',
    tree: treeRes.sha, parents: [baseSha]
  });
  await api('PATCH', `/repos/${me.login}/${REPO}/git/refs/heads/main`, { sha: commit.sha, force: true });
  console.log(`已推送 main（${commit.sha.slice(0, 7)}）`);

  // 4) Pages
  const siteUrl = `https://${me.login.toLowerCase()}.github.io/${REPO}/`;
  let pagesUrl = null;
  try {
    const p = await api('POST', `/repos/${me.login}/${REPO}/pages`, { source: { branch: 'main', path: '/' } });
    pagesUrl = p.html_url;
    console.log(`Pages 已开启：${pagesUrl}`);
  } catch (e) {
    if ([409, 422].includes(e.status)) {
      try {
        const p = await api('GET', `/repos/${me.login}/${REPO}/pages`);
        pagesUrl = p.html_url;
        console.log(`Pages 之前已开启：${pagesUrl}`);
      } catch { console.log('Pages 需手动开启：Settings → Pages → main / root'); }
    } else {
      console.log(`Pages 未能自动开启（${e.message}）`);
    }
  }

  console.log('\n=== 完成 ===');
  console.log(`仓库：${repo.html_url}`);
  console.log(`站点：${pagesUrl || siteUrl}`);
  console.log('（Pages 首次构建约 30–90 秒）');
})().catch((e) => {
  console.error('\n发布失败：' + e.message);
  if (e.data) console.error(JSON.stringify(e.data, null, 2));
  process.exit(1);
});
