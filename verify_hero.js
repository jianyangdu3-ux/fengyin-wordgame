const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// 把 vocab.js 内联进 HTML（模拟真实环境）
const vocabPath = path.join(__dirname, 'vocab.js');
const vocabJs = fs.readFileSync(vocabPath, 'utf8');
const patchedHtml = html.replace('</body>', '<script>' + vocabJs + '</script></body>');

const dom = new JSDOM(patchedHtml, {
  url: 'http://localhost',
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  resources: 'usable',
  beforeParse(window) {
    window.localStorage = {
      _store: {},
      getItem(k) { return this._store[k] || null; },
      setItem(k, v) { this._store[k] = String(v); },
      removeItem(k) { delete this._store[k]; }
    };
  }
});

const doc = dom.window.document;
const window = dom.window;

let pass = 0, fail = 0;
function check(label, cond, detail) {
  if (cond) { pass++; console.log('✅', label); }
  else { fail++; console.log('❌', label, detail || ''); }
}

// 等 init 执行完
setTimeout(() => {
  console.log('=== Hero Badge V5.7 验证 ===\n');

  // 1. 结构存在
  check('heroBadge 存在', !!doc.getElementById('heroBadge'));
  check('rankRing 存在', !!doc.getElementById('rankRing'));
  check('rankEmoji 存在', !!doc.getElementById('rankEmoji'));
  check('rankLabel 存在', !!doc.getElementById('rankLabel'));
  check('rtFill 存在', !!doc.getElementById('rtFill'));
  check('rtNum 存在', !!doc.getElementById('rtNum'));

  // 2. 初始 rank=0
  check('rank=0 时 emoji 为 👑', doc.getElementById('rankEmoji').textContent === '👑');
  check('rank=0 时 label 为 秀女', doc.getElementById('rankLabel').textContent === '秀女');
  check('rank=0 时进度条 0%', doc.getElementById('rtFill').style.width === '0%');
  check('rank=0 时进度 0/9', doc.getElementById('rtNum').textContent === '0/9');

  // 3. rank=3
  window.S.rank = 3;
  window.renderHeroBadge();
  check('rank=3 emoji 为 🏮', doc.getElementById('rankEmoji').textContent === '🏮');
  check('rank=3 label 为 贵人', doc.getElementById('rankLabel').textContent === '贵人');
  check('rank=3 进度条 37.5%', doc.getElementById('rtFill').style.width === '37.5%');
  check('rank=3 进度 3/9', doc.getElementById('rtNum').textContent === '3/9');

  // 4. rank=9
  window.S.rank = 8;
  window.renderHeroBadge();
  check('rank=8 emoji 为 🔥', doc.getElementById('rankEmoji').textContent === '🔥');
  check('rank=8 label 为 皇后', doc.getElementById('rankLabel').textContent === '皇后');
  check('rank=8 进度条 100%', doc.getElementById('rtFill').style.width === '100%');
  check('rank=8 进度 8/9', doc.getElementById('rtNum').textContent === '8/9');

  // 5. 点击入宫 → 进入剧情页
  const badge = doc.getElementById('heroBadge');
  badge.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  const activePage = doc.querySelector('.page.active');
  check('点击 heroBadge 进入剧情页', activePage && activePage.id === 'page-story', activePage && activePage.id);

  console.log('\n=== 结果:', pass, '通过,', fail, '失败 ===');
  process.exit(fail > 0 ? 1 : 0);
}, 200);
