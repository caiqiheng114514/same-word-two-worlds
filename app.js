/* 同词异义 · 港陆词语小游戏 — 逻辑
   纯原生 JS，无依赖；可双击 index.html 直接玩，也能挂 GitHub Pages。
   题库在 words.js（由 data/questions.pipe.txt 生成），顺序＝关卡难度曲线。 */
(function () {
  'use strict';

  var ALL = (window.__QUESTIONS__ || []).slice();
  var KB = (window.__KB__ || []).slice();
  var KB_CATS = window.__KB_CATS__ || {};
  var DEMO_ALL = (window.__DEMO__ || []).slice();
  var DEMO_PICK = window.__DEMO_PICK__ || [1, 4, 9];
  var WRONG_KEY = 'tcyy.wrong.v1';
  var MODE_LABEL = { m1: '同词异义', m2: '当场处理', m3: '改口' };
  var NUM = ['①', '②', '③'];

  var state = {
    queue: [],
    pos: 0,
    correct: 0,
    answered: false,
    revealed: false,
    chosen: -1,
    wrongIds: [],
    demo: [],
    demoPos: 0,
    kbCat: 'all',
    kbQuery: ''
  };

  function $(id) { return document.getElementById(id); }

  /* ---------------- 存储：我答错的词 ---------------- */
  function loadWrong() {
    try {
      var arr = JSON.parse(localStorage.getItem(WRONG_KEY) || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function saveWrong(ids) {
    try { localStorage.setItem(WRONG_KEY, JSON.stringify(ids)); } catch (e) {}
  }
  function noteWrong(id) {
    var ids = loadWrong();
    if (ids.indexOf(id) === -1) { ids.push(id); saveWrong(ids); }
  }
  function clearWrong(id) {
    var ids = loadWrong();
    var i = ids.indexOf(id);
    if (i > -1) { ids.splice(i, 1); saveWrong(ids); }
  }
  function wrongQuestions() {
    var ids = loadWrong();
    return ALL.filter(function (q) { return ids.indexOf(q.id) > -1; })
              .sort(function (a, b) { return a.seq - b.seq; });
  }

  /* ---------------- 工具 ---------------- */
  function show(name) {
    ['cover', 'quiz', 'result', 'demo', 'kb', 'story'].forEach(function (n) {
      var el = $('screen-' + n);
      if (el) el.classList.toggle('is-active', n === name);
    });
    var pw = $('progressWrap'); if (pw) pw.hidden = (name !== 'quiz');
    window.scrollTo(0, 0);
  }

  function setProgress(done, total) {
    $('progressText').textContent = done + ' / ' + total;
    $('progressFill').style.width = (total ? (done / total) * 100 : 0) + '%';
  }

  /* ---------------- 封面 ---------------- */
  function renderCover() {
    var wrongs = wrongQuestions();
    $('btnCoverWrong').hidden = wrongs.length === 0;
    $('btnCoverWrong').textContent = '我答错的词' + (wrongs.length ? '（' + wrongs.length + '）' : '');
  }

  /* ---------------- 出题 ---------------- */
  function startGame(list) {
    state.queue = list.slice();
    state.pos = 0;
    state.correct = 0;
    state.wrongIds = [];
    show('quiz');
    renderQuestion();
  }

  function renderQuestion() {
    var q = state.queue[state.pos];
    if (!q) { finish(); return; }
    state.answered = false;
    state.revealed = false;

    $('stageBadge').textContent = '第 ' + q.stage + ' 关 · ' + q.stageName;
    $('wordTag').textContent = q.word;

    $('sceneWho').textContent = '香港 · 对方说';
    $('scene').textContent = q.scene;
    $('stem').textContent = q.stem;

    var box = $('options');
    box.innerHTML = '';
    q.options.forEach(function (text, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option';
      var mark = document.createElement('span');
      mark.className = 'idx';
      mark.textContent = NUM[i] || String(i + 1);
      var span = document.createElement('span');
      span.className = 'txt';
      span.textContent = text;
      btn.appendChild(mark);
      btn.appendChild(span);
      btn.addEventListener('click', function () { choose(i); });
      box.appendChild(btn);
    });

    $('feedback').hidden = true;
    $('fbWhy').hidden = true;
    $('tipBox').hidden = true;
    $('btnNext').hidden = true;
    $('btnRetry').hidden = true;
    $('btnReveal').hidden = true;

    setProgress(state.pos, state.queue.length);
  }

  /* revealCorrect=false 时只标出选错的，不提前泄露正确答案（留着「再试一次」的意义） */
  function markOptions(q, chosen, revealCorrect) {
    var opts = Array.prototype.slice.call($('options').children);
    opts.forEach(function (btn, i) {
      btn.disabled = true;
      btn.classList.remove('is-correct', 'is-wrong', 'is-dim');
      if (revealCorrect) {
        if (i === q.answer) btn.classList.add('is-correct');
        else if (i === chosen) btn.classList.add('is-wrong');
        else btn.classList.add('is-dim');
      } else {
        if (i === chosen) btn.classList.add('is-wrong');
        else btn.classList.add('is-dim');
      }
    });
  }

  function unlockOptions() {
    var opts = Array.prototype.slice.call($('options').children);
    opts.forEach(function (btn) {
      btn.disabled = false;
      btn.classList.remove('is-correct', 'is-wrong', 'is-dim');
    });
  }

  /* ---------------- 作答：答错给「再试一次 / 看提醒」 ---------------- */
  function choose(index) {
    if (state.answered) return;
    state.answered = true;

    var q = state.queue[state.pos];
    var right = index === q.answer;
    state.chosen = index;
    markOptions(q, index, right);

    var head = $('fbHead');

    if (right) {
      state.correct += 1;
      clearWrong(q.id);
      var wi = state.wrongIds.indexOf(q.id);
      if (wi > -1) state.wrongIds.splice(wi, 1);
      head.classList.remove('bad');
      $('fbIcon').textContent = '✓';
      $('fbTitle').textContent = '对了';
      $('fbWhy').textContent = q.why;
      $('fbWhy').hidden = false;
      $('fbTip').textContent = q.tip;
      $('tipBox').hidden = false;
      $('btnRetry').hidden = true;
      $('btnReveal').hidden = true;
      $('btnNext').hidden = false;
      $('btnNext').textContent = lastOne() ? '看结果' : '下一题';
      $('btnNext').focus({ preventScroll: true });
    } else {
      noteWrong(q.id);
      if (state.wrongIds.indexOf(q.id) === -1) state.wrongIds.push(q.id);
      head.classList.add('bad');
      $('fbIcon').textContent = '!';
      $('fbTitle').textContent = '不太对，换个选项试试';
      $('fbWhy').hidden = true;
      $('tipBox').hidden = true;
      $('btnNext').hidden = true;
      $('btnRetry').hidden = false;
      $('btnReveal').hidden = false;
      $('btnRetry').focus({ preventScroll: true });
    }

    $('feedback').hidden = false;
    setProgress(state.pos + 1, state.queue.length);
  }

  function retry() {
    state.answered = false;
    state.revealed = false;
    unlockOptions();
    $('feedback').hidden = true;
    $('btnRetry').hidden = true;
    $('btnReveal').hidden = true;
    $('btnNext').hidden = true;
    var first = $('options').children[0];
    if (first) first.focus({ preventScroll: true });
  }

  function reveal() {
    var q = state.queue[state.pos];
    state.revealed = true;
    markOptions(q, state.chosen, true);
    $('fbTitle').textContent = '这句提醒可以当面说';
    $('fbWhy').textContent = q.why;
    $('fbWhy').hidden = false;
    $('fbTip').textContent = q.tip;
    $('tipBox').hidden = false;
    $('btnRetry').hidden = true;
    $('btnReveal').hidden = true;
    $('btnNext').hidden = false;
    $('btnNext').textContent = lastOne() ? '看结果' : '下一题';
    $('btnNext').focus({ preventScroll: true });
  }

  function lastOne() {
    return state.pos + 1 >= state.queue.length;
  }

  function next() {
    state.pos += 1;
    if (state.pos >= state.queue.length) finish();
    else renderQuestion();
  }

  /* ---------------- 结算 ---------------- */
  function finish() {
    var total = state.queue.length;
    var rate = total ? state.correct / total : 0;

    $('resScore').textContent = state.correct;
    $('resTotal').textContent = total;

    var line;
    if (rate >= 0.9) line = '很稳。剩下的不是词义问题，是敢不敢当场问一句。';
    else if (rate >= 0.7) line = '基本能对上，还有几个词的「另一边意思」没接住。';
    else if (rate >= 0.5) line = '踩雷不奇怪——重点看下面每个词的那句提醒。';
    else line = '先把下面的提醒卡过一遍，再练一次会快很多。';
    $('resLine').textContent = line;

    var seen = {}, words = [];
    state.queue.forEach(function (q) {
      if (state.wrongIds.indexOf(q.id) > -1 && !seen[q.word]) {
        seen[q.word] = true;
        words.push(q);
      }
    });

    $('wrongNum').textContent = words.length;
    $('wrongBlock').hidden = words.length === 0;

    var list = $('wrongList');
    list.innerHTML = '';
    words.forEach(function (q) {
      var card = document.createElement('div');
      card.className = 'wcard';
      var top = document.createElement('div');
      top.className = 'wtop';
      var w = document.createElement('span');
      w.className = 'w';
      w.textContent = q.word;
      var wm = document.createElement('span');
      wm.className = 'wm';
      wm.textContent = MODE_LABEL[q.mode] || '';
      top.appendChild(w); top.appendChild(wm);
      var tip = document.createElement('div');
      tip.className = 'wtip';
      tip.textContent = q.tip;
      card.appendChild(top); card.appendChild(tip);
      list.appendChild(card);
    });

    $('resNote').textContent = words.length
      ? '这些词已记在本机，下次打开还能只练「我答错的词」。'
      : '这一轮全对。下次换个时间再来一次，看看是不是真的记住了。';

    var left = wrongQuestions().length;
    var btnOnly = $('btnOnlyWrong');
    btnOnly.hidden = left === 0;
    btnOnly.textContent = left ? '我答错的词（' + left + '）' : '我答错的词';

    show('result');
  }

  /* ---------------- 展示模式：课上念 3 题，先猜再揭晓 ---------------- */
  function startDemo() {
    state.demo = DEMO_PICK.map(function (n) {
      return DEMO_ALL.filter(function (q) { return q.n === n; })[0];
    }).filter(Boolean);
    if (!state.demo.length) return;
    state.demoPos = 0;
    renderDemo();
    show('demo');
  }

  function renderDemo() {
    var q = state.demo[state.demoPos];
    if (!q) return;
    $('demoBadge').textContent = '展示模式 · ' + (state.demoPos + 1) + ' / ' + state.demo.length;
    $('demoStem').textContent = q.stem;
    $('demoHint').hidden = false;
    $('demoFeedback').hidden = true;
    $('btnDemoShow').hidden = false;
    $('btnDemoNext').hidden = true;
  }

  function showDemoAnswer() {
    var q = state.demo[state.demoPos];
    $('demoAnswer').textContent = q.answer;
    $('demoReveal').textContent = q.reveal;
    $('demoFeedback').hidden = false;
    $('demoHint').hidden = true;
    $('btnDemoShow').hidden = true;
    $('btnDemoNext').hidden = false;
    $('btnDemoNext').textContent = (state.demoPos + 1 >= state.demo.length) ? '完成，回首页' : '下一题';
    $('btnDemoNext').focus({ preventScroll: true });
  }

  function demoNext() {
    state.demoPos += 1;
    if (state.demoPos >= state.demo.length) { renderCover(); show('cover'); return; }
    renderDemo();
  }

  /* ---------------- 词条库 ---------------- */
  function renderKb() {
    var cats = Object.keys(KB_CATS);
    var counts = { all: KB.length };
    cats.forEach(function (c) { counts[c] = 0; });
    KB.forEach(function (r) { counts[r.cat] = (counts[r.cat] || 0) + 1; });

    var tabs = $('kbTabs');
    tabs.innerHTML = '';
    var defs = [{ key: 'all', label: '全部' }].concat(cats.map(function (c) {
      return { key: c, label: c + ' ' + KB_CATS[c].name };
    }));
    defs.forEach(function (d) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'kb-tab' + (state.kbCat === d.key ? ' is-on' : '');
      b.textContent = d.label + ' ' + counts[d.key];
      b.addEventListener('click', function () { state.kbCat = d.key; renderKb(); });
      tabs.appendChild(b);
    });

    var q = state.kbQuery.trim();
    var rows = KB.filter(function (r) {
      if (state.kbCat !== 'all' && r.cat !== state.kbCat) return false;
      if (!q) return true;
      return (r.word + r.hk + r.ml + r.why).indexOf(q) > -1;
    });

    $('kbCount').textContent = rows.length;
    $('kbSub').textContent = state.kbCat === 'all'
      ? '按「适不适合出题」分类，做游戏时从这里挑。'
      : (KB_CATS[state.kbCat].desc + '｜' + KB_CATS[state.kbCat].hint);

    var list = $('kbList');
    list.innerHTML = '';
    if (!rows.length) {
      var empty = document.createElement('p');
      empty.className = 'kb-empty';
      empty.textContent = '没找到「' + q + '」，换个词试试。';
      list.appendChild(empty);
      return;
    }
    rows.forEach(function (r) { list.appendChild(kbCard(r)); });
  }

  function kbCard(r) {
    var card = document.createElement('article');
    card.className = 'kb-card cat-' + r.cat;

    var head = document.createElement('div');
    head.className = 'kb-card-head';
    var w = document.createElement('span');
    w.className = 'kb-word';
    w.textContent = r.word;
    var tag = document.createElement('span');
    tag.className = 'kb-tag';
    tag.textContent = r.cat + ' · ' + r.catName;
    head.appendChild(w); head.appendChild(tag);

    var sides = document.createElement('div');
    sides.className = 'kb-sides';
    [['香港', r.hk, 'hk'], ['内地', r.ml, 'ml']].forEach(function (s) {
      var row = document.createElement('div');
      row.className = 'kb-side ' + s[2];
      var city = document.createElement('span');
      city.className = 'kb-city';
      city.textContent = s[0];
      var val = document.createElement('span');
      val.className = 'kb-val';
      val.textContent = s[1];
      row.appendChild(city); row.appendChild(val);
      sides.appendChild(row);
    });

    var why = document.createElement('p');
    why.className = 'kb-why';
    why.textContent = r.why;

    card.appendChild(head);
    card.appendChild(sides);
    card.appendChild(why);
    if (r.format) {
      var fmt = document.createElement('span');
      fmt.className = 'kb-fmt';
      fmt.textContent = '适合：' + r.format;
      card.appendChild(fmt);
    }
    return card;
  }

  /* ---------------- 背景音乐 ---------------- */
  var audio = {
    el: null, on: true, fadeTimer: null,
    VOLUME: 0.2,
    init: function () {
      this.el = $('bgm');
      var saved = localStorage.getItem('swtw-bgm');
      this.on = saved === null ? true : saved === '1';
      this.applyBtn();
      var self = this;
      $('btnBgm').addEventListener('click', function () { self.toggle(); });
    },
    play: function () {
      if (!this.on || !this.el) return;
      var el = this.el;
      if (!el.dataset.ready) { el.dataset.ready = '1'; el.load(); }
      el.volume = 0;
      var p = el.play();
      if (p && p.catch) p.catch(function () {});
      this.fadeTo(this.VOLUME);
    },
    fadeTo: function (target) {
      var el = this.el;
      clearInterval(this.fadeTimer);
      var self = this;
      this.fadeTimer = setInterval(function () {
        var v = el.volume + (target > el.volume ? 0.02 : -0.02);
        if ((target > el.volume && v >= target) || (target <= el.volume && v <= target)) {
          el.volume = target;
          clearInterval(self.fadeTimer);
        } else {
          el.volume = Math.max(0, Math.min(1, v));
        }
      }, 55);
    },
    toggle: function () {
      this.on = !this.on;
      localStorage.setItem('swtw-bgm', this.on ? '1' : '0');
      this.applyBtn();
      if (this.on) this.play(); else this.fadeTo(0);
    },
    applyBtn: function () {
      var b = $('btnBgm');
      if (!b) return;
      b.classList.toggle('is-off', !this.on);
      b.setAttribute('aria-label', this.on ? '关闭背景音乐' : '开启背景音乐');
    }
  };
  /* ---------------- 情景对话（galgame / 视觉小说） ---------------- */
  var STORY = window.__STORY__ || null;
  var WHO = { lb: '刘博康', zq: '赵祈岳', cq: '蔡奇衡', narr: '旁白' };
  var WHO_TAG = { lb: '香港', zq: '内地', cq: '内地' };

  var story = {
    idx: -1, bond: 20, streak: 0, right: 0, wrong: 0, hits: [],
    typing: false, timer: null, full: '', shown: 0, locked: false, cgTimer: null,
    history: []
  };
  var lastAdvance = 0;

  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
  function faceSrc(id, ext) { return 'assets/char/' + id + '.' + (ext || 'png'); }

  /* 默契值：0–100，分四档 */
  function bondStage(v) {
    if (v >= 75) return { key: 'best', name: '老友' };
    if (v >= 50) return { key: 'good', name: '熟络' };
    if (v >= 25) return { key: 'warm', name: '有点熟' };
    return { key: 'cold', name: '生疏' };
  }

  function renderBond() {
    var st = bondStage(story.bond);
    $('bondNum').textContent = story.bond;
    $('bondFill').style.width = story.bond + '%';
    $('bondStage').textContent = st.name;
    $('bond').dataset.stage = st.key;
  }

  function bumpBond(delta) {
    var before = story.bond;
    story.bond = clamp(story.bond + delta, 0, 100);
    var real = story.bond - before;
    renderBond();

    var d = $('bondDelta');
    d.textContent = (real > 0 ? '+' : '') + real;
    d.className = 'bond-delta ' + (real > 0 ? 'up' : 'down');
    // 重启动画
    void d.offsetWidth;
    d.classList.add('show');
    setTimeout(function () { d.classList.remove('show'); }, 900);

    // 档位提升时轻推一下
    if (real > 0) {
      $('bond').animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }],
        { duration: 320, easing: 'ease-out' }
      );
    }
  }

  /* ---------------- 背景 / 人物 ---------------- */
  function setBg(name) {
    var bg = $('vnBg');
    if (!name || bg.dataset.bg === name) return;
    bg.dataset.bg = name;
    var url = 'assets/bg/' + name + '.jpg';
    // 首次加载不淡出（此时还没有画面），后续换景才做交叉淡入
    if (!bg.getAttribute('src')) {
      bg.src = url;
      return;
    }
    bg.classList.add('is-out');
    setTimeout(function () {
      bg.src = url;
      bg.classList.remove('is-out');
    }, 160);
  }

  /* 预取下一幕背景：切场景时不至于卡一下 */
  var prefetched = {};
  function prefetchNextBg() {
    if (!STORY) return;
    for (var i = story.idx + 1; i < STORY.beats.length; i++) {
      var b = STORY.beats[i];
      if (b && b.scene && b.bg && !prefetched[b.bg]) {
        prefetched[b.bg] = true;
        var img = new Image();
        img.decoding = 'async';
        img.src = 'assets/bg/' + b.bg + '.jpg';
        return;
      }
    }
  }
  /* 判定徽章：紧跟名牌右边，别压住名牌和人物 */
  function placeVerdict() {
    var badge = $('vnVerdict'), plate = $('vnName'), stage = $('vnStage');
    if (!badge || badge.hidden || !plate || !stage) return;
    var pr = plate.getBoundingClientRect();
    var sr = stage.getBoundingClientRect();
    var left = pr.right - sr.left + 12;
    var maxLeft = sr.width - badge.offsetWidth - 12;
    badge.style.left = Math.round(Math.max(12, Math.min(left, maxLeft))) + 'px';
  }
  /* 把人物底部钉在对话框顶部：文本框长高时人也跟着上移，永远贴住 */
  function syncFaceToBox() {
    var face = $('vnFace'), box = $('vnBox'), stage = $('vnStage');
    if (!face || !box || !stage || face.hidden) return;
    var sr = stage.getBoundingClientRect();
    var br = box.getBoundingClientRect();
    var bottom = Math.max(0, sr.bottom - br.top) - 4;   // 轻微压住一点，看起来是站在框上
    face.style.bottom = Math.round(bottom) + 'px';
  }
  /* who = 'lb' | 'zq' | 'cq' | 'narr' | null；只显示正在说话的那个人 */
  function setChar(who) {
    var img = $('vnChar');
    var wrap = $('vnFace');
    if (!who || who === 'narr') {
      wrap.hidden = true;
      img.hidden = true;
      img.removeAttribute('src');
      img.dataset.who = '';
      return;
    }
    var src = faceSrc(who, 'png');
    var srcWebp = faceSrc(who, 'webp');
    var changed = img.dataset.who !== who;
    if (img.getAttribute('src') !== src) {
      var s = document.getElementById('vnCharWebp');
      if (s) s.srcset = srcWebp;
      img.src = src;
      img.alt = WHO[who] || '';
    }
    img.dataset.who = who;
    img.hidden = false;
    wrap.hidden = false;
    wrap.dataset.who = who;
    requestAnimationFrame(syncFaceToBox);
    if (changed) {                          // 换人时重放登场动画
      wrap.style.animation = 'none';
      void wrap.offsetWidth;
      wrap.style.animation = '';
    }
  }

  /* ---------------- 打字机 ---------------- */
  function typeText(text) {
    clearTimeout(story.timer);
    story.full = text || '';
    story.shown = 0;
    story.typing = true;
    $('vnBox').classList.remove('is-ready');
    $('vnText').textContent = '';
    (function step() {
      if (!story.typing) return;
      story.shown += 2;
      $('vnText').textContent = story.full.slice(0, story.shown);
      if (story.shown >= story.full.length) {
        story.typing = false;
        $('vnBox').classList.add('is-ready');
        syncFaceToBox();
        return;
      }
      story.timer = setTimeout(step, 18);
    })();
  }

  function finishTyping() {
    story.typing = false;
    clearTimeout(story.timer);
    $('vnText').textContent = story.full;
    $('vnBox').classList.add('is-ready');
    syncFaceToBox();
  }

  /* ---------------- 开演 ---------------- */
  function startStory() {
    if (!STORY) return;
    audio.play();   // 必须是用户点击触发，浏览器才允许播放
    story.idx = -1;
    story.bond = (STORY.start || 20);
    story.streak = 0;
    story.right = 0;
    story.wrong = 0;
    story.hits = [];
    story.history = [];
    story.locked = false;
    lastAdvance = 0;
    syncBackBtn();

    $('storyEnd').hidden = true;
    $('vnStage').hidden = false;
    $('vnVerdict').hidden = true;
    $('vnFix').hidden = true;
    $('vnChoices').hidden = true;
    $('vnChoices').innerHTML = '';
    $('vnBox').classList.remove('has-choices', 'is-good', 'is-bad', 'is-narr');
    $('vnStage').classList.remove('has-choices');
    $('btnStoryNext').hidden = false;

    renderBond();
    setBg('street-out');
    setChar(null);

    show('story');
    storyAdvance();
  }

  function snapshot() {
    story.history.push({
      idx: story.idx,
      bond: story.bond,
      streak: story.streak,
      right: story.right,
      wrong: story.wrong,
      hits: story.hits.slice(),
      scene: $('vnScene').textContent,
      bg: $('vnBg').dataset.bg || ''
    });
    if (story.history.length > 60) story.history.shift();
    syncBackBtn();
  }

  function syncBackBtn() {
    var btn = $('btnStoryBack');
    if (btn) btn.disabled = story.history.length < 2;
  }

  /* 清场：把上一拍的判定痕迹去掉 */
  function clearBeatUi() {
    clearTimeout(story.cgTimer);
    $('vnVerdict').hidden = true;
    $('vnFix').hidden = true;
    $('vnChoices').hidden = true;
    $('vnChoices').innerHTML = '';
    $('vnBox').classList.remove('has-choices', 'is-good', 'is-bad', 'is-narr');
    $('vnStage').classList.remove('has-choices');
    $('btnStoryNext').hidden = false;
  }

  /* 渲染某一拍（不推进 idx，不写历史） */
  function showBeat(b) {
    clearBeatUi();
    if (b.choice) { renderStoryChoice(b.choice); return; }

    var who = b.who || 'narr';
    setChar(who, b.expr);
    $('vnName').textContent = WHO[who] || '';
    $('vnName').className = 'vn-name who-' + who;
    $('vnBox').classList.toggle('is-narr', who === 'narr');
    typeText(b.text);
  }

  function storyAdvance() {
    if (!STORY) return;
    if (story.typing) { finishTyping(); return; }   // 先把这句打完
    if (story.locked) return;                       // 选项没选，不许跳

    var now = Date.now();
    if (now - lastAdvance < 110) return;
    lastAdvance = now;

    var b;
    for (;;) {
      story.idx += 1;
      if (story.idx >= STORY.beats.length) { finishStory(); return; }
      b = STORY.beats[story.idx];
      if (b.scene) { $('vnScene').textContent = b.scene; setBg(b.bg); setTimeout(prefetchNextBg, 600); continue; }
      break;
    }

    snapshot();
    showBeat(b);
  }

  /* 回溯：回到上一个情节（可反复往回走） */
  function stepBack() {
    if (story.typing) { finishTyping(); return; }
    if (story.history.length < 2) return;

    story.history.pop();                       // 丢掉「当前这一拍」
    var s = story.history[story.history.length - 1];   // 上一拍的状态

    story.idx = s.idx;
    story.bond = s.bond;
    story.streak = s.streak;
    story.right = s.right;
    story.wrong = s.wrong;
    story.hits = s.hits.slice();
    story.locked = false;
    lastAdvance = 0;

    $('vnScene').textContent = s.scene;
    if (s.bg) setBg(s.bg);
    renderBond();
    syncBackBtn();

    showBeat(STORY.beats[s.idx]);
  }

  /* ---------------- 选项：长在文本框里 ---------------- */
  function renderStoryChoice(c) {
    story.locked = true;
    var asker = WHO[c.askBy] || '你';
    $('vnName').textContent = asker + ' · ' + (c.askBy === 'cq' ? '一脸问号' : '拿不准');
    $('vnName').className = 'vn-name who-' + (c.askBy || 'zq');
    $('vnBox').classList.remove('is-narr');
    $('vnBox').classList.add('has-choices');
    $('vnStage').classList.add('has-choices');
    setChar(c.askBy || 'zq');            // 谁拿不准就出谁
    typeText(c.ask);

    var box = $('vnChoices');
    box.innerHTML = '';
    box.hidden = false;

    c.options.forEach(function (opt, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'vn-opt';
      var num = document.createElement('span');
      num.className = 'vn-opt-num';
      num.textContent = NUM[i] || String(i + 1);
      var txt = document.createElement('span');
      txt.className = 'vn-opt-txt';
      txt.textContent = opt.text;
      btn.appendChild(num);
      btn.appendChild(txt);
      btn.addEventListener('click', function () { resolveChoice(c, opt); });
      box.appendChild(btn);
    });
    requestAnimationFrame(syncFaceToBox);
  }

  function resolveChoice(c, opt) {
    var ok = !!opt.ok;
    var at0 = story.idx;
    story.locked = false;

    // 默契值：答对 +8，连对再加成（最多 +4）；答错 −6 且连对清零
    if (ok) {
      story.streak += 1;
      var bonus = Math.min(story.streak - 1, 2) * 2;
      bumpBond(8 + bonus);
      story.right += 1;
    } else {
      story.streak = 0;
      bumpBond(-6);
      story.wrong += 1;
    }
    story.hits.push({ word: c.word, ok: ok, fix: c.fix });

    // 选项定色
    var opts = Array.prototype.slice.call($('vnChoices').children);
    c.options.forEach(function (o, i) {
      var btn = opts[i];
      if (!btn) return;
      btn.disabled = true;
      if (o.ok) btn.classList.add('is-correct');
      else if (o === opt) btn.classList.add('is-wrong');
      else btn.classList.add('is-dim');
    });

    // 说话人现身（答对高兴 / 答错疑惑）
    setChar('lb');
    $('vnName').textContent = '刘博康 · ' + (ok ? '接住了' : '笑了一下');
    $('vnName').className = 'vn-name who-lb';
    $('vnBox').classList.toggle('is-good', ok);
    $('vnBox').classList.toggle('is-bad', !ok);
    typeText(ok ? c.ok : c.bad);
    $('btnStoryNext').hidden = true;

    // 判定徽章：贴在人物上方，同时把纠正写进框里
    var d = ok ? (8 + Math.min(story.streak - 1, 2) * 2) : -6;
    var badge = $('vnVerdict');
    badge.className = 'vn-verdict' + (ok ? '' : ' bad');
    $('vBadge').textContent = ok ? '✓' : '!';
    $('vText').textContent = (ok ? '接住了 ' : '没听懂 ') + (d > 0 ? '+' : '') + d;
    badge.hidden = false;
    requestAnimationFrame(placeVerdict);

    $('vnFix').textContent = c.fix;
    $('vnFix').hidden = false;
    requestAnimationFrame(syncFaceToBox);

    setTimeout(function () {
      if (story.idx !== at0) return;
      $('vnChoices').hidden = true;
      $('vnBox').classList.remove('has-choices');
      $('vnStage').classList.remove('has-choices');
      $('btnStoryNext').hidden = false;
    }, 520);
  }

  /* ---------------- 结局 ---------------- */
  function finishStory() {
    clearTimeout(story.cgTimer);
    $('vnStage').hidden = true;
    $('storyEnd').hidden = false;

    var st = bondStage(story.bond);
    $('endBond').textContent = story.bond;
    $('endStage').textContent = st.name;

    // 结算 CG：四档默契各一张
    var tier = story.bond >= 75 ? 'close'
             : story.bond >= 50 ? 'warm'
             : story.bond >= 25 ? 'timid' : 'cold';
    var CG = {
      cold:  { file: 'cold',  place: '港铁站 · 闸机口', alt: '结算 CG：两人在车厢里，各自看着别处' },
      timid: { file: 'timid', place: '茶餐厅 · 下午三点', alt: '结算 CG：两人隔着桌子坐下，还没聊开' },
      warm:  { file: 'warm',  place: '街口 · 傍晚', alt: '结算 CG：两人并肩走在街上' },
      close: { file: 'close', place: '夜里的维港 · 一天的最后一站', alt: '结算 CG：两人并肩站在夜景前' }
    }[tier];
    $('endCg').src = 'assets/cg/cg-end-' + CG.file + '.jpg';
    $('endCg').alt = CG.alt;
    $('endPlace').textContent = CG.place;
    $('endCg').dataset.tier = tier;

    var title, line;
    if (story.bond >= 75) {
      title = '「你听得明我讲咩」';
      line = '八个词你都接住了。刘博康最后说，下次来香港不用他带路也行。';
    } else if (story.bond >= 50) {
      title = '「下次你就识啦」';
      line = '大部分都懂了，还有几个词让他愣了一下——那正是要留意的。';
    } else if (story.bond >= 25) {
      title = '「唔紧要，慢慢嚟」';
      line = '一半靠猜。这些词两边都在用、都觉得自己说得对，所以才会错。';
    } else {
      title = '「你啲普通话我听唔明」';
      line = '先把下面每个词那句纠正念一遍，再走一趟，默契会明显不一样。';
    }
    $('endTitle').textContent = title;
    $('endLine').textContent = line;

    var box = $('endWords');
    box.innerHTML = '';
    story.hits.forEach(function (h) {
      var row = document.createElement('div');
      row.className = 'end-word' + (h.ok ? ' ok' : '');
      var w = document.createElement('span');
      w.className = 'ew-word';
      w.textContent = h.word;
      var mark = document.createElement('span');
      mark.className = 'ew-mark';
      mark.textContent = h.ok ? '接住了' : '踩了一下';
      var fix = document.createElement('span');
      fix.className = 'ew-fix';
      fix.textContent = h.fix;
      row.appendChild(w);
      row.appendChild(mark);
      row.appendChild(fix);
      box.appendChild(row);
    });
  }

  /* ---------------- 绑定 ---------------- */
  function init() {
    if (!ALL.length) {
      document.body.insertAdjacentHTML('afterbegin',
        '<p style="padding:16px;color:#B4553F">题库没加载成功：请确认 words.js 与 index.html 在同一目录。</p>');
      return;
    }

    // 封面
    $('btnCoverStart').addEventListener('click', startStory);
    $('btnCoverQuiz').addEventListener('click', function () { startGame(ALL); });
    $('btnCoverDemo').addEventListener('click', startDemo);
    $('btnCoverKb').addEventListener('click', function () { renderKb(); show('kb'); });
    $('btnCoverWrong').addEventListener('click', function () {
      var w = wrongQuestions();
      if (w.length) startGame(w);
    });

    // 故事
    $('btnStoryNext').addEventListener('click', storyAdvance);
    audio.init();

    $('btnStoryBack').addEventListener('click', stepBack);
    window.addEventListener('resize', syncFaceToBox);
    window.addEventListener('orientationchange', function () { setTimeout(syncFaceToBox, 120); });
    $('btnStoryExit').addEventListener('click', function () { renderCover(); show('cover'); });
    $('btnStoryHome').addEventListener('click', function () { renderCover(); show('cover'); });
    $('btnStoryAgain').addEventListener('click', startStory);

    // 练习
    $('btnNext').addEventListener('click', next);
    $('btnRetry').addEventListener('click', retry);
    $('btnReveal').addEventListener('click', reveal);
    $('btnAgain').addEventListener('click', function () { startGame(ALL); });
    $('btnOnlyWrong').addEventListener('click', function () {
      var w = wrongQuestions();
      if (w.length) startGame(w);
    });
    $('btnHome').addEventListener('click', function () { renderCover(); show('cover'); });
    $('btnQuizExit').addEventListener('click', function () { renderCover(); show('cover'); });

    // 展示
    $('btnDemoShow').addEventListener('click', showDemoAnswer);
    $('btnDemoNext').addEventListener('click', demoNext);
    $('btnDemoExit').addEventListener('click', function () { renderCover(); show('cover'); });

    // 词条库
    $('btnKbBack').addEventListener('click', function () { renderCover(); show('cover'); });
    $('kbSearch').addEventListener('input', function (e) {
      state.kbQuery = e.target.value || '';
      renderKb();
    });

    // 键盘：故事里回车/空格推进，1–3 选选项
    document.addEventListener('keydown', function (e) {
      if ($('screen-story').classList.contains('is-active')) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); storyAdvance(); return; }
        if (e.key === 'Backspace' || e.key === 'ArrowLeft') { e.preventDefault(); stepBack(); return; }
        if (e.key >= '1' && e.key <= '3' && story.locked) {
          var opts = $('vnChoices').children;
          var i = Number(e.key) - 1;
          if (opts[i] && !opts[i].disabled) { e.preventDefault(); opts[i].click(); }
        }
        return;
      }
      if (!$('screen-quiz').classList.contains('is-active')) return;
      if (e.key === 'Enter' || e.key === ' ') {
        if (!$('btnNext').hidden) { e.preventDefault(); next(); }
        return;
      }
      var n = parseInt(e.key, 10);
      if (n >= 1 && n <= 3 && !state.answered) {
        var btns = $('options').children;
        if (btns[n - 1]) choose(n - 1);
      }
    });

    renderCover();
    show('cover');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
