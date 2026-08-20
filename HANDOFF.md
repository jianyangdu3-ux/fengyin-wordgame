# 凤印九重 · 宫斗背词游戏 — 项目交接文档

> 本文件是给接手该项目的开发者（或 AI Agent）的**完整自包含说明**。
> 读完后无需任何历史对话上下文，即可理解项目全貌、修改代码、运行测试。

---

## 0. 一句话定位

**"游戏互动背单词"工具**：以宫廷剧情（选秀入宫→宫斗→查案）为壳，以考研英语词汇记忆为核。
**核心铁律：学习闭环必须坐实，不能做成纯国风视觉小说。** 一切互动（抉择、斗法、情缘、任务）都必须绑定词汇考核，否则等于无效互动。

---

## 1. 交付形态与技术约束（不可违背）

- 交付三件套必须同目录：`index.html` + `vocab.js` + `assets/`（相对路径引用），双击 `index.html` 即跑。
- 纯 HTML/CSS/JS，**无框架、无构建、无 npm 依赖**（测试脚本例外，见 §8）。
- 移动端优先（max-width:430px），localStorage 持久化。
- 所有外部能力（canvas/localStorage/AudioContext/SpeechSynthesis/fetch）必须 try/catch 降级，`file://` 协议下不崩。
- 剧情词必须全部取自 vocab.js（经 `VOCAB_MAP` 取释义），否则点开无释义且高亮失效。
- 验证手段：`node --check` 语法 + jsdom 仿真测试（见 §8），确保 0 运行时错误。

---

## 2. 文件结构

| 文件 | 规模 | 职责 |
|---|---|---|
| `index.html` | ~2740 行 | 全部游戏逻辑 + 样式 + 结构（单文件应用） |
| `vocab.js` | ~5501 行 | 考研大纲 5491 词词库（window.VOCAB 数组） |
| `assets/` | 3 张 PNG | `char-maid.png`（姑姑/秀女）/ `char-consort.png`（华妃）/ `char-queen.png`（皇后）角色立绘 |
| `manual.html` | ~357 行 | 游戏说明书（13 章节，藏录页有入口） |
| `verify_hero.js` | ~217 行 | jsdom 测试脚本（57 项断言） |
| `HANDOFF.md` | 本文件 | 交接说明 |

---

## 3. 版本历史（git 时间线）

| 版本 | commit | 内容 |
|---|---|---|
| V1 | 760d190 | 宫斗背词框架：3 章剧情 / 凤印体系 / 词关斗法抉择查案 |
| V2 | a373aa5 | 发音修复 + 每日任务 + 角色头像 + CSS 动画 |
| V3 | 87c687f | 角色动态台词 + 卷轴 UI + 拼写填空题型 |
| V3.1-3.3 | ccd2cf7/69c717c/d3c417c | 首页 cover 比例修复 / 发音按钮 + Web Speech / 考校体验（60% 通过线 + 失败可重试不重置剧情） |
| V4 | ec7b34c/5e304e4 | 古风视觉大升级：AI 角色立绘 + 宣纸纹理 + 描金边框 + 宫殿剪影 + 宋体标题 |
| V5 | 78e1c77 | 安全区适配 + 顶部位份常驻 + 弹层按钮安全区修复 |
| V5.2-5.4 | fe2a41e/4db5593/ed824e8 | sheet 弹层修复（display:none + 同步控制）/ 手机端 env() 安全区 / no-cache meta |
| V5.5 | fbf6069 | 情缘·私奔支线（3 男主 × 4 节点 × HE/BE，全部绑定考词）+ linkWords 多词高亮修复 |
| V5.6-5.8 | 4ab7155/191ca18/8b1cf28/f72e904/81b185d/2f9b654 | 首页凤印迭代 → 圆环位份 + 九印进度条 → 古风画框 + 角色立绘随位份切换 |
| V6.0 | b8d95b4 | **博弈化改造**：斗法回合制 + 限时 + 连击 + 心力系统 |
| fix | e6613d2 | 电脑端 Tab 栏贴底 + main 区域自适应撑满 |
| V6.1 | 9e3b085 | 复习系统：错词本 + 收藏 + 一键复习 |
| V6.2 | e65c1f8 | 存档导出/导入（GDSAVE1 密文） |
| V6.3 | 04efecf | 云端同步（GitHub 私有仓库，8 位存档码） |
| V6.4 | b68dca2 | manual.html 游戏说明书 |
| V6.5 | 0c76687 | 云配置三步引导 + 存档码可输入（换设备接管） |
| V6.6 | f1f6266 | 云同步操作说明补齐（弹层教程折叠区 + manual 完整教程） |
| V6.7 | 1ce19fb | 位份按钮"✓"化 + 画框宫殿背景 |
| V6.8 | 35d4987 | 宫殿剪影精修（飞檐翘角 + 殿门 + 城墙基座）+ 角色纯色古风底 |

---

## 4. 游戏机制全景

### 4.1 位份系统（九重）
`RANKS` 数组：秀女→答应→常在→贵人→嫔→妃→贵妃→皇贵妃→皇后，每晋一级获一枚凤印。
`S.rank`（0-8）驱动：剧情解锁、角色立绘切换（<2 姑姑 / <7 华妃 / 否则皇后）、情缘解锁（rank>=3）。

### 4.2 考校（选择题）— page-quiz
- 每章 `STORY[ch].quiz` 题量（第 3 章为 0，无考校）。
- 入场 `costEnergy(5)`；限时 15 秒（进度条），超时判错。
- 答对答错有角色台词反馈；全对 +30 圣宠。
- 通过线 60%，失败可重试不重置剧情。

### 4.3 斗法（回合制对战）— page-battle
- 敌方先出招（`ENEMY_MOVES` 随机选），玩家 12 秒限时拆招。
- 连击触发技名升级：巧言令色→妙语连珠→凤鸣九天，伤害递增 20→28→38→50。
- 伤害飘字 + 震屏 + 敌方 HP 条；答错受伤、我方 HP 归零败北（-15 心力）。

### 4.4 飞花令（拼写）— answerSpell
- 20 秒限时拼写，正确 +20 圣宠。

### 4.5 心力系统（体力）— S.energy
- 上限 100，每日回满（`initEnergy` 按日期判定）；考校 -5、斗法 -10、答错 -3、败北 -15；温书恢复 +30；零力锁定（`costEnergy` 拦截）。

### 4.6 复习系统（V6.1）
- 答题/斗法/暗号答错自动收录 `S.wrongs[词]=错次`（`markWrong`）。
- 词条面板星标收藏 `S.favs[词]=1`（`toggleFav`）。
- 词库页三 tab：全部/⭐收藏/❌错词（`libTab`）。
- 一键复习 `startReview(type)`：8 词考校，答对 `markRight` 销账，错词本清空动画。

### 4.7 情缘·私奔支线（V5.5）— page-love
- rank>=3 解锁，3 男主 × 4 节点 × HE/BE 双结局，每个节点绑定考词（`loveFinish` 60% 通过线）。

### 4.8 每日宫务（V2）— taskPanel
- 每日 3 任务 +30 圣宠，`tasks:{date,done:[0,0,0],claimed:[0,0,0]}`。

### 4.9 查案（第 3 章）— page-case
- 英文密信阅读理解选择题，绑定词汇。

### 4.10 词汇面板（openSheet）
- 剧情中红色虚线下划线词可点击，弹出释义/发音/收藏面板。

---

## 5. 数据模型（存档 S 结构）

```js
S = {
  v:1, rank:0, points:0, chapter:0, step:0, storyIdx:0,
  right:0, wrong:0, streak:0, bestStreak:0, seen:{}, verdict:[],
  energy:100, energyDate:'',                 // 心力
  tasks:{date:'',done:[0,0,0],claimed:[0,0,0]},  // 每日任务
  love:{char:null,stage:0,points:0,endings:{}},  // 情缘
  wrongs:{}, favs:{}                          // 错词本 / 收藏
};
SAVE_KEY = 'gd12_state_v1'
```
- `save()`：写 localStorage + `scheduleAutoSync()`（云端防抖上传）。
- `load()`：读档，`v===1` 校验，旧档自动补齐 `wrongs/favs` 字段，并 `window.S=S` 同步引用（**必须保留，否则测试/导出脱钩**）。

---

## 6. 页面结构与导航

```
page-start（首页：画框+位份+凤印进度+任务面板）
page-story（剧情，charBox 角色栏 + 卷轴正文）
page-quiz（考校选择/飞花令拼写，限时条）
page-battle（斗法，敌方横幅+连击徽章+HP条）
page-choice（道之抉择：剧情抉择绑定考词）
page-case（查案：密信阅读）
page-reward（晋位/奖励）
page-library（词库：三tab + 复习按钮）
page-record（藏录：宫册/导出/导入/云端配置/说明书入口）
page-love（情缘）
```
Tab 栏：宫阙 / 词库 / 藏录（`goTab`）；`showPage(id)` 切页并 `clearTimer()`。

---

## 7. 云端同步方案（V6.3-V6.6，GitHub 私有仓库）

**原理**：GitHub Contents API 当免费后端。存档存 `saves/{存档码}.json`。

- 配置存 localStorage `CLOUD_KEY`（owner/repo/token/code/savedAt/lastSync/lastErr）。
- 8 位免密存档码 `genCode()`（去 I/O/0/1，36^8 空间），作为存档文件名标识设备身份。
- `save()` → `scheduleAutoSync()` debounce 2.5s → `cloudUpload()`（加 `_syncing` 锁）。
- `cloudPull()`：启动时拉取，比较 `savedAt`：云端新→接管刷新；本地新→推上去（内部调 `_doUpload()` 无锁函数，**切勿在锁内调 cloudUpload**）。
- `pagehide` 事件 keepalive 兜底上传。
- 配置弹层：三步引导（建私有仓库→建 fine-grained token 只勾 Contents:Read and write→填三项保存）+ 存档码可输入（换设备接管）+ 折叠教程/FAQ。
- **已知坑**：① `load()` 里 `S=o` 后必须 `window.S=S`；② `_syncing` 锁会挡内部上传，拆 `_doUpload()`；③ 表单保存函数名 `saveCloudCfgForm()`，勿与 `saveCloudCfg()` 重名。

---

## 8. 测试方案（必须跑）

```bash
cd gongdou
NODE_PATH=/Users/dujianyang/.workbuddy/binaries/node/workspace/node_modules \
/Users/dujianyang/.workbuddy/binaries/node/versions/22.22.2/bin/node verify_hero.js
```
- jsdom 仿真：beforeParse 注入 mock localStorage + mock GitHub fetch。
- **vocab.js 必须内联到 `</body>` 前**（替换原 `<script src>` 位置），否则 VOCAB_MAP 为空。
- 57 项断言：首页结构 / 心力 / 考校 / 斗法 / 复习 / 存档导出导入 / 云同步全链路 / 页面切换。
- 改任何功能后必须全绿再提交。

---

## 9. 部署

- GitHub Pages 仓库：`jianyangdu3-ux/fengyin-wordgame`（gongdou/ 为仓库根，嵌套于 WorkBuddy 工作区，**独立 git 仓库，需单独 add/commit/push**）。
- 线上地址：`https://jianyangdu3-ux.github.io/fengyin-wordgame/`
- 缓存绕过：URL 加 `?v=数字`（当前 v=71，每次发布递增）。
- 本地预览：`python3 -m http.server 8124`（file:// 下 fetch 云同步可用但 TTS 受限）。

---

## 10. 已知坑点速查

1. `load()` 后 `window.S` 引用脱钩 → 必须 `try{window.S=S}catch(e){}`。
2. `_syncing` 锁挡住内部上传 → 拆无锁 `_doUpload()`。
3. `saveCloudCfg` 重名覆盖 → 表单函数改名 `saveCloudCfgForm()`。
4. 按钮文案带空格（如"继 续 深 宫"）→ `includes` 断言会失败，改用双条件。
5. 透明 PNG 显示棋盘格 → 给 img 加纯色/图案背景（`hero-avatar` 已有 #E8DCC8 + 宫殿暗纹）。
6. 电脑端 Tab 栏不贴底 → `#app` 用 `height:100vh` + `main flex:1` + `overflow-y:auto`。
7. sheet 弹层遮挡 → 默认 `display:none`，open/close 同步控制遮罩。
8. 剧情词必须来自 VOCAB_MAP，否则高亮+释义失效。

---

## 11. 待办事项（下阶段方向）

**P1（主线）**：
- [ ] 角色亲密度系统（当前情缘只有线性的 love.stage/points，可扩展每日互动）
- [ ] 每日宫务轮转（任务池扩展，当前固定 3 个）
- [ ] 剧情分支（当前 choice 每章仅 1 个，可做成多选树）
- [ ] 凤印收集升级（当前 rank 驱动，可加凤印图鉴收集成就）

**P2（增强）**：
- [ ] 宫斗随机事件（随机小考校/小斗法插入剧情）
- [ ] 词根剧情化（把词根/词缀编进剧情对白）
- [ ] 生成式角色对话（目前台词为预置数组，可扩展更多变体）

---

## 12. 对接手者的开发守则

1. **先跑测试再动手**：改前 `verify_hero.js` 全绿，改后必须仍全绿。
2. **学习闭环优先**：任何新玩法必须问"这个词怎么考进去"，答不上来就不要做。
3. **移动端优先**：在 430px 宽验证布局，再考虑桌面。
4. **降级优先**：新 API（AI/语音/绘图）全部 try/catch，file:// 不崩。
5. **版本号递增**：功能完成后 commit message 按 `Vx.y: 说明` 格式，并递增 URL 的 `?v=` 缓存参数。
6. **双仓库意识**：gongdou/ 是 fengyin-wordgame 独立仓库；WorkBuddy 根目录是另一个项目（仙途十二阶），别混提。
7. 无 README——本 HANDOFF.md 即唯一交接文档，改动后请同步更新。
