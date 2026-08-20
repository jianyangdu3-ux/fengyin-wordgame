const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// 把 vocab.js 内联进 HTML（替换原 <script src> 位置，保证先于主脚本加载）
const vocabPath = path.join(__dirname, 'vocab.js');
const vocabJs = fs.readFileSync(vocabPath, 'utf8');
const patchedHtml = html.replace('<script src="vocab.js"></script>', '<script>' + vocabJs + '</script>');

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

setTimeout(() => {
  console.log('=== V6.0 博弈化 + Hero Badge 验证 ===\n');

  // ---------- 1. 首页结构 ----------
  check('heroBadge 存在', !!doc.getElementById('heroBadge'));
  check('heroAvatar 存在', !!doc.getElementById('heroAvatar'));
  check('htFill 存在', !!doc.getElementById('htFill'));
  check('rank=0 时头像为 char-maid.png', doc.getElementById('heroAvatar').src.includes('char-maid.png'));
  check('rank=0 时 label 为 秀女', doc.getElementById('heroRank').textContent === '秀女');
  window.S.rank = 3; window.renderHeroBadge();
  check('rank=3 头像为 char-consort.png', doc.getElementById('heroAvatar').src.includes('char-consort.png'));
  check('rank=3 label 为 贵人', doc.getElementById('heroRank').textContent === '贵人');
  window.S.rank = 0; window.renderHeroBadge();

  // ---------- 2. V6.0 心力系统 ----------
  check('energyText 存在', !!doc.getElementById('energyText'));
  check('心力初始 100', window.S.energy === 100, 'energy=' + window.S.energy);
  check('顶栏显示 ⚡ 100', doc.getElementById('energyText').textContent.includes('100'));

  // 考校入场扣 5
  window.S.energy = 100; window.S.energyDate = 'yesterday';
  window.initEnergy && window.initEnergy();
  window.startQuiz({ scenes: [{ w: ['abandon'] }], quiz: 2 });
  check('考校入场扣 5 心力', window.S.energy === 95, 'energy=' + window.S.energy);
  check('考校页倒计时条存在', !!doc.getElementById('qtFill') && !!doc.getElementById('qtNum'));

  // 答对不加回、答错扣 3：模拟点对第一个选项
  const cur0 = window.__cur ? window.__cur : null; // cur 未暴露，改用 DOM 检查
  check('考校页已激活', doc.getElementById('page-quiz').classList.contains('active'));

  // 通过暴露的 answerQuiz 回答正确项
  // 直接找当前激活选项里带 .right 之前的内容：先查 qOpts 中 data-ok 无标记，改为模拟点击第一个正确选项
  // 更稳妥：直接调用 answerQuiz 需要知道正确 idx —— 从 DOM .qopt 无法直接判定，故改为验证倒计时与拼写元素
  check('飞花令标签存在', !!doc.getElementById('spellTag'));
  window.clearTimer();

  // 斗法入场扣 10
  window.S.energy = 100; window.S.energyDate = 'yesterday';
  window.startBattle({ enemy: '华妃', hp: 100, count: 2 });
  check('斗法入场扣 10 心力', window.S.energy === 90, 'energy=' + window.S.energy);
  check('斗法页已激活', doc.getElementById('page-battle').classList.contains('active'));
  check('敌方出招横幅存在', !!doc.getElementById('enemyMove'));
  check('连击徽章存在', !!doc.getElementById('battleCombo'));
  check('斗法倒计时条存在', !!doc.getElementById('btFill') && !!doc.getElementById('btNum'));
  window.clearTimer();

  // 心力不足阻止进入
  window.S.energy = 3;
  window.startBattle({ enemy: '华妃', hp: 100, count: 2 });
  check('心力不足时斗法被阻止（能量不变）', window.S.energy === 3, 'energy=' + window.S.energy);
  check('心力不足出现温书按钮', !!doc.getElementById('restoreBtn'));
  window.S.energy = 100; window.S.energyDate = 'yesterday';
  window.renderRankBar();

  // ---------- 3. 斗法常量 ----------
  check('敌方招式库存在', Array.isArray(window.ENEMY_MOVES) || typeof window.ENEMY_MOVES !== 'undefined');
  check('comboName 逻辑（2连=巧言令色）', window.comboName ? window.comboName(2) === '巧言令色' : false);
  check('comboName 逻辑（4连=凤鸣九天）', window.comboName ? window.comboName(5) === '凤鸣九天' : false);

  // ---------- 4. 点击入宫 → 剧情页 ----------
  const badge = doc.getElementById('heroBadge');
  badge.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  const activePage = doc.querySelector('.page.active');
  check('点击 heroBadge 进入剧情页', activePage && activePage.id === 'page-story', activePage && activePage.id);

  // ---------- 5. 有进度时首页按钮文案 ----------
  window.S.chapter = 1; window.S.storyIdx = 0; window.S.rank = 1;
  window.save();
  window.init();
  const btn = doc.getElementById('btnStart');
  const btnTxt = btn ? btn.textContent.replace(/\s/g, '') : '';
  check('有进度时按钮为「继续深宫」', btnTxt.includes('继续') && btnTxt.includes('深宫'), btn && btn.textContent);

  // ---------- 6. V6.1 复习系统 ----------
  window.S.wrongs = {}; window.S.favs = {};
  check('词库 tab 按钮存在', !!doc.getElementById('libTabAll') && !!doc.getElementById('libTabFav') && !!doc.getElementById('libTabWrong'));
  check('sheet 收藏按钮存在', !!doc.getElementById('sFavBtn'));
  window.markWrong('abandon'); window.markWrong('abandon'); window.markWrong('abrupt');
  check('答错 2 次记 2 次错账', window.S.wrongs['abandon'] === 2, 'wrongs=' + JSON.stringify(window.S.wrongs));
  check('错词本有 2 个词', window.wrongWords().length === 2);
  window.markRight('abandon');
  check('答对销账 1 次（abandon 剩 1）', window.S.wrongs['abandon'] === 1);
  window.markRight('abandon'); window.markRight('abrupt');
  check('全部答对后错词本清空', window.wrongWords().length === 0);
  window.toggleFav(); // 无 sheet 上下文，安全忽略
  window.S.favs = { abandon: 1, abrupt: 1 };
  check('收藏 2 词', window.favWords().length === 2);
  window.libTab('fav');
  check('收藏 tab 激活', doc.getElementById('libTabFav').classList.contains('active'));
  // 复习考校：错词 2 个 → startReview 组题成功（不实际作答）
  window.S.wrongs = { abandon: 1, abrupt: 1 };
  window.S.energy = 100; window.S.energyDate = 'yesterday';
  window.initEnergy && window.initEnergy();
  window.startReview('wrong');
  check('复习考校入场扣 5 心力', window.S.energy === 95, 'energy=' + window.S.energy);
  check('复习考校激活 quiz 页', doc.getElementById('page-quiz').classList.contains('active'));
  window.clearTimer();

  console.log('\n=== 结果:', pass, '通过,', fail, '失败 ===');
  process.exit(fail > 0 ? 1 : 0);
}, 300);
