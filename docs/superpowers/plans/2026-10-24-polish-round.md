# 打磨轮(Polish Round)实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 五项已确认的打磨:① 连续专注天数(streak)追踪+展示+成就 ② 蛋保底进度提示 ③ 工作区收尾+lint+CI ④ 回到前台自动刷新状态 ⑤ 委托标题/称号内容扩充+图鉴成就与物种数解耦。

**Architecture:** streak 由 sessions 表纯派生(新服务 `computeStreak`,不动表结构);保底与 focus 刷新是纯前端(数据 `/api/state` 已有);内容与成就解耦只改静态定义;lint/CI 补齐既有缺口。所有任务按序独立提交,不动游戏核心循环。

**Tech Stack:** Express 4 + better-sqlite3(server)、React 18 + Vite(client)、Vitest + supertest/RTL、GitHub Actions。

**执行顺序说明:** 工作区收尾放最前(避免脏文件混进功能提交),lint+CI 放最后(让 CI 一次性覆盖全部新代码)。用户批准的清单顺序 ①streak ②保底 ③CI/收尾 ④focus 刷新 ⑤内容,内容不变,仅执行次序优化。

**已确认的关键事实(执行者无需重新调查):**
- `player.pityCounter` 已由 `GET /api/state` 返回(server/src/routes/state.js:75),前端从未显示。保底规则:`pity_counter >= 4` 时下一次必掉蛋(server/src/services/rewards.js:25),即「再 5-N 次必得」。
- `computeMetrics(db)` 现有 7 个指标,其中 `buildings`/`hatched` 无成就引用(保留不动);新增 `streakBest`。
- client 的 `eslint.config.js` 存在但 eslint 及全部插件**均未安装**(node_modules 无),server 无任何 lint。
- 根 package.json(未提交)含 `better-sqlite3 ^13.0.3`,与 server 的 `^11.7.0`(实际嵌套装 11.10.0)重复且根无代码使用 → 删除根依赖。
- `.stat-cards` 是 `repeat(auto-fit, minmax(140px,1fr))`,第 6 张卡自动换行,无布局风险。
- Icon.jsx 已有语义名 `fire`(Flame)、`spark`(Sparkles),无需新增图标。
- 测试时钟:helpers `makeTestApp({ start })` 默认 `2026-06-11T10:00:00`,`clock.current` 可直接改写。
- 提交信息末尾必须带:`Co-Authored-By: Claude Code <noreply@anthropic.com>`

---

### Task 1: 工作区收尾(处理 3 个未提交文件)

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`(由 npm install 生成)
- Commit: `.gitignore`(已改,直接纳入)

- [ ] **Step 1: 删除根 package.json 里的 better-sqlite3 依赖**

编辑 `package.json`,删除整个 `dependencies` 块(better-sqlite3 属 server workspace,根目录无代码使用它;当前根 13.0.3 + server 嵌套 11.10.0 双份原生模块纯属浪费)。保留 prettified 的 workspaces 数组与其它内容,结果为:

```json
{
  "name": "fighting-to-study",
  "private": true,
  "workspaces": [
    "client",
    "server"
  ],
  "scripts": {
    "dev": "concurrently -n srv,web -c blue,green \"npm run dev -w server\" \"npm run dev -w client\"",
    "build": "npm run build -w client",
    "start": "npm run start -w server",
    "test": "npm test -w server && npm test -w client"
  },
  "devDependencies": {
    "concurrently": "^9.1.0"
  }
}
```

- [ ] **Step 2: 重装同步 lockfile 并修剪重复原生模块**

Run: `npm install`
Expected: 无 error;`npm ls better-sqlite3` 只剩 `server@ -> .\server └── better-sqlite3@11.10.0` 一条(根那条消失)。

- [ ] **Step 3: 跑全量测试确认无回归**

Run: `npm test`
Expected: server 77 passed、client 4 passed(与收尾前一致)。

- [ ] **Step 4: 提交(连同本计划文档)**

```bash
git add .gitignore package.json package-lock.json docs/superpowers/plans/2026-10-24-polish-round.md
git commit -m "chore: 工作区收尾——better-sqlite3 归位 server、忽略 .claude;附打磨轮实施计划

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 2: streak 服务端(计算 + 成就 + stats 暴露)

**Files:**
- Create: `server/src/services/streak.js`
- Modify: `server/src/services/achievements.js`
- Modify: `server/src/routes/stats.js`
- Modify: `server/src/routes/state.js:77`
- Modify: `server/src/routes/achievements.js:14`
- Test: `server/test/streak.test.js`
- Test: `server/test/achievements.test.js`(追加)

**设计口径:** 「天」= 有 ≥1 个 completed session 的本地日期(复用 `localDateStr`)。current:从今天往回数;**今天还没专注不算断**,自动从昨天起算(契合「不惩罚」哲学)。best:历史最长链,只增不减,用于成就。成就用 best 而非 current,避免断签后成就进度倒退。

- [ ] **Step 1: 写失败测试 `server/test/streak.test.js`**

```js
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { makeTestApp } from './helpers.js';

// 指定完成日期塞一条已完成专注(绕过计时流程)
function completeOn(db, iso, minutes = 5) {
  const q = db.prepare(
    "INSERT INTO quests (title, type, duration_min, status, created_at) VALUES ('x','custom',?,'done','2026-06-01T10:00:00')"
  ).run(minutes);
  db.prepare(
    "INSERT INTO sessions (quest_id, started_at, ends_at, status, minutes, completed_at) VALUES (?, ?, ?, 'completed', ?, ?)"
  ).run(q.lastInsertRowid, iso, iso, minutes, iso);
}

describe('streak (连续专注天数)', () => {
  it('returns zeros when no sessions', async () => {
    const { app } = makeTestApp();
    expect((await request(app).get('/api/stats')).body.streak).toEqual({ current: 0, best: 0 });
  });

  it('counts consecutive days ending today', async () => {
    const { app, db } = makeTestApp(); // 今天 = 2026-06-11
    completeOn(db, '2026-06-09T10:00:00');
    completeOn(db, '2026-06-10T10:00:00');
    completeOn(db, '2026-06-11T10:00:00');
    expect((await request(app).get('/api/stats')).body.streak).toEqual({ current: 3, best: 3 });
  });

  it('today not yet focused does not break the streak (counts from yesterday)', async () => {
    const { app, db, clock } = makeTestApp();
    completeOn(db, '2026-06-10T10:00:00');
    completeOn(db, '2026-06-11T10:00:00');
    clock.current = new Date('2026-06-12T09:00:00'); // 新的一天,还没专注
    expect((await request(app).get('/api/stats')).body.streak).toEqual({ current: 2, best: 2 });
  });

  it('gap breaks current but best survives; same-day sessions count once', async () => {
    const { app, db } = makeTestApp(); // 今天 = 2026-06-11
    completeOn(db, '2026-06-05T10:00:00');
    completeOn(db, '2026-06-06T10:00:00');
    completeOn(db, '2026-06-07T10:00:00'); // 最长链 3
    completeOn(db, '2026-06-10T10:00:00');
    completeOn(db, '2026-06-10T22:00:00'); // 同日第二次,只算一天(current 仍只数到 06-10 这一天)
    expect((await request(app).get('/api/stats')).body.streak).toEqual({ current: 1, best: 3 });
  });

  it('feeds streakBest achievement metric (streak_3)', async () => {
    const { app, db } = makeTestApp();
    completeOn(db, '2026-06-09T10:00:00');
    completeOn(db, '2026-06-10T10:00:00');
    completeOn(db, '2026-06-11T10:00:00');
    const ach = (await request(app).get('/api/state')).body.achievements;
    expect(ach.find(a => a.key === 'streak_3')).toMatchObject({ unlocked: true, progress: 3, threshold: 3 });
    expect(ach.find(a => a.key === 'streak_7')).toMatchObject({ unlocked: false, progress: 3, threshold: 7 });
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -w server -- streak`
Expected: FAIL —— `body.streak` 为 undefined、`streak_3` 找不到(toMatchObject on undefined 抛错)。

- [ ] **Step 3: 新建 `server/src/services/streak.js`**

```js
// 连续专注天数:由已完成 session 的本地日期纯派生,不落库。
// current 从今天往回数;今天还没专注不算断(自动从昨天起算),不惩罚「今天还没开始」。
// best 为历史最长链,只增不减,供成就使用。
// 注:按 86400000ms 步进在跨 DST 的时区有理论误差,本应用目标环境(中国时区/CI 的 UTC)无 DST。
import { localDateStr } from '../utils/dates.js';

export function computeStreak(db, now) {
  const days = new Set(
    db.prepare("SELECT completed_at FROM sessions WHERE status='completed'").all()
      .map(r => localDateStr(new Date(r.completed_at)))
  );
  if (days.size === 0) return { current: 0, best: 0 };

  const today = localDateStr(now());
  let cursor = now();
  if (!days.has(today)) cursor = new Date(now().getTime() - 86400000);
  let current = 0;
  while (days.has(localDateStr(cursor))) {
    current += 1;
    cursor = new Date(cursor.getTime() - 86400000);
  }

  const sorted = [...days].sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const d of sorted) {
    run = prev !== null && new Date(prev).getTime() + 86400000 === new Date(d).getTime() ? run + 1 : 1;
    if (run > best) best = run;
    prev = d;
  }
  return { current, best: Math.max(best, current) };
}
```

- [ ] **Step 4: 接入 stats 路由**

`server/src/routes/stats.js`:顶部 import 区加 `import { computeStreak } from '../services/streak.js';`,在 `res.json({` 的 `totalMinutes,` 前加一行:

```js
streak: computeStreak(db, now()),
```

- [ ] **Step 5: achievements 加 streakBest 指标与两项成就**

`server/src/services/achievements.js`:
1. 顶部加 `import { computeStreak } from './streak.js';`
2. `computeMetrics(db)` 改签名为 `computeMetrics(db, now)`,返回对象末尾加:

```js
streakBest: computeStreak(db, now).best,
```

3. `computeAchievements(db)` 改签名为 `computeAchievements(db, now)`,内部 `computeMetrics(db)` 改为 `computeMetrics(db, now)`。
4. `ACHIEVEMENTS` 数组末尾(boss_1 之后)追加两项:

```js
{ key: 'streak_3', name: '三日之约', desc: '最长连续 3 天完成专注', icon: 'fire', metric: 'streakBest', threshold: 3, reward: { kind: 'gold', amount: 80 } },
{ key: 'streak_7', name: '七日星火', desc: '最长连续 7 天完成专注', icon: 'fire', metric: 'streakBest', threshold: 7, reward: { kind: 'egg', rarity: 'epic' } },
```

- [ ] **Step 6: 修两个调用方**

- `server/src/routes/state.js:77`:`computeAchievements(db)` → `computeAchievements(db, current)`
- `server/src/routes/achievements.js:14`:`const metrics = computeMetrics(db);` → `const metrics = computeMetrics(db, now());`

- [ ] **Step 7: achievements.test.js 追加守卫(成就总数随新项增长)**

`server/test/achievements.test.js` 第一个用例中 `expect(ach.length).toBeGreaterThanOrEqual(12);` 改为:

```js
expect(ach.length).toBeGreaterThanOrEqual(14);
```

- [ ] **Step 8: 跑全量 server 测试**

Run: `npm test -w server`
Expected: 全部 PASS(原 77 + 新 5 = 82)。

- [ ] **Step 9: 提交**

```bash
git add server/src/services/streak.js server/src/services/achievements.js server/src/routes/stats.js server/src/routes/state.js server/src/routes/achievements.js server/test/streak.test.js server/test/achievements.test.js
git commit -m "feat: 连续专注天数——纯派生 streak 计算与成就(三日之约/七日星火)

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 3: streak 前端展示(统计页第 6 张卡)

**Files:**
- Modify: `client/src/pages/Stats.jsx:112`(第 5 张卡后)
- Modify: `client/src/theme/theme.css:242`(动画错峰)

- [ ] **Step 1: Stats.jsx 加第 6 张卡**

在「营地建筑」卡片(`buildingCount` 那行 `</div>`)之后、`</div>`(stat-cards 收口)之前插入:

```jsx
<div className="card stat-card"><span className="stat-ico"><Icon name="fire" /></span><b className="num">{data.streak.current}天</b><small className="dim">连续专注 · 最长{data.streak.best}天</small></div>
```

- [ ] **Step 2: theme.css 补错峰延迟**

在 `.stat-card:nth-child(5) { animation-delay: .24s; }` 同行之后追加:

```css
.stat-card:nth-child(6) { animation-delay: .3s; }
```

- [ ] **Step 3: 骨架屏占位数同步 5 → 6**

`client/src/pages/Stats.jsx:98` 骨架屏行改为:

```jsx
<div className="stat-cards">{Array.from({ length: 6 }, (_, i) => <div key={i} className="skel skel-stat" />)}</div>
```

- [ ] **Step 4: 构建验证**

Run: `npm run build`
Expected: 构建成功无报错。

- [ ] **Step 5: 提交**

```bash
git add client/src/pages/Stats.jsx client/src/theme/theme.css
git commit -m "feat(client): 统计页连续专注卡片(当前/最长)

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 4: 蛋保底进度提示(Camp 页)

**Files:**
- Modify: `client/src/pages/Camp.jsx:101`(egg 卡片块之后)
- Test: `client/src/pages/Camp.test.jsx`(新建)

**显示规则:** `pityCounter >= 2` 才显示(刚断 1 次不制造焦虑,接近保底才有钩子价值);文案 `已连空 N 次,再专注 M 次必得蛋`,M = 5 - N。无孵化蛋时也显示(保底与队列无关)。

- [ ] **Step 1: 写失败测试 `client/src/pages/Camp.test.jsx`**

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../components/Toast.jsx';

// mock 必须补齐所有具名导出:Camp 静态引入的 Wheel/Farm/Dice 分别要 spinWheel/plantCrop/harvestCrop/rollDice,
// vi.mock 工厂缺导出会让这些模块加载即抛 SyntaxError(先于任何断言)
vi.mock('../api/client.js', () => ({
  api: vi.fn(), createQuest: vi.fn(), startFreeRoam: vi.fn(),
  spinWheel: vi.fn(), plantCrop: vi.fn(), harvestCrop: vi.fn(), rollDice: vi.fn(),
}));
vi.mock('../state/GameStateContext.jsx', () => ({ useGame: vi.fn() }));
vi.mock('../utils/notify.js', () => ({ requestNotify: vi.fn(), notify: vi.fn() }));

import Camp from './Camp.jsx';
import { useGame } from '../state/GameStateContext.jsx';

const baseState = {
  quests: [], welcomeBack: null, runningSession: null, incubatingEgg: null,
  buildings: [], creatures: [], buildingCatalog: [], knownTags: [], // buildingCatalog 是数组(CampScene 对它 .map)
  player: { pityCounter: 0 },
};

function renderCamp(overrides = {}) {
  useGame.mockReturnValue({ state: { ...baseState, ...overrides }, refresh: vi.fn() });
  return render(<ToastProvider><MemoryRouter><Camp /></MemoryRouter></ToastProvider>);
}

// 数字被 <span className="num"> 隔开,getByText 的默认匹配只看直接文本节点,必须用 textContent 匹配器
const pityHint = () => screen.queryByText((_, el) => el?.classList?.contains('pity-hint'));

describe('Camp 保底提示', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows pity hint when pityCounter >= 2', () => {
    renderCamp({ player: { pityCounter: 3 } });
    expect(pityHint()?.textContent).toContain('已连空 3 次');
    expect(pityHint()?.textContent).toContain('再专注 2 次必得蛋');
  });

  it('hides pity hint when pityCounter < 2', () => {
    renderCamp({ player: { pityCounter: 1 } });
    expect(pityHint()).toBeNull();
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -w client -- Camp`
Expected: FAIL —— `pityHint()` 返回 null(找不到 .pity-hint 元素),toContain 在 undefined 上抛错。

- [ ] **Step 3: Camp.jsx 实现提示**

在 egg 卡片条件块(`{egg && ( ... )}`,第 95-101 行)的 `)}` 之后、`{showCreate && ...}` 之前插入:

```jsx
{state.player.pityCounter >= 2 && (
  <div className="card pity-hint">
    <small className="dim"><Icon name="spark" size={14} /> 已连空 <span className="num">{state.player.pityCounter}</span> 次,再专注 <span className="num">{5 - state.player.pityCounter}</span> 次必得蛋</small>
  </div>
)}
```

- [ ] **Step 4: 跑 client 测试确认通过**

Run: `npm test -w client`
Expected: 全部 PASS(原 4 + 新 2 = 6)。

- [ ] **Step 5: 提交**

```bash
git add client/src/pages/Camp.jsx client/src/pages/Camp.test.jsx
git commit -m "feat(client): 保底进度提示——连空 N 次再 M 次必得蛋

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 5: 回到前台自动刷新状态

**Files:**
- Modify: `client/src/state/GameStateContext.jsx`
- Test: `client/src/state/GameStateContext.test.jsx`(新建)

- [ ] **Step 1: 写失败测试 `client/src/state/GameStateContext.test.jsx`**

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';

const apiMock = vi.fn();
vi.mock('../api/client.js', () => ({ api: (...a) => apiMock(...a) }));

import { GameStateProvider, useGame } from './GameStateContext.jsx';

function Probe() {
  const { state } = useGame();
  return <div data-testid="probe">{state ? 'loaded' : 'empty'}</div>;
}

describe('GameStateProvider 回前台刷新', () => {
  it('refetches /state on window focus and on becoming visible', async () => {
    apiMock.mockResolvedValue({ player: {} });
    render(<GameStateProvider><Probe /></GameStateProvider>);
    await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(1)); // 挂载首拉
    await act(async () => { window.dispatchEvent(new Event('focus')); });
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); }); // jsdom 恒为 visible
    await waitFor(() => expect(apiMock.mock.calls.length).toBeGreaterThanOrEqual(3));
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -w client -- GameStateContext`
Expected: FAIL —— 事件触发后 api 调用数仍为 1。

- [ ] **Step 3: GameStateContext.jsx 加监听**

在 `useEffect(() => { refresh(); }, [refresh]);` 之后追加:

```jsx
// 回到前台(切标签页/多窗口切回)时重拉全量,避免展示陈旧状态
useEffect(() => {
  const onFocus = () => refresh();
  const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
  window.addEventListener('focus', onFocus);
  document.addEventListener('visibilitychange', onVisible);
  return () => {
    window.removeEventListener('focus', onFocus);
    document.removeEventListener('visibilitychange', onVisible);
  };
}, [refresh]);
```

- [ ] **Step 4: 跑 client 全量测试**

Run: `npm test -w client`
Expected: 全部 PASS(6 + 新 1 = 7)。

- [ ] **Step 5: 提交**

```bash
git add client/src/state/GameStateContext.jsx client/src/state/GameStateContext.test.jsx
git commit -m "feat(client): 回到前台自动刷新游戏状态

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 6: 内容扩充 + 图鉴成就与物种数解耦

**Files:**
- Modify: `server/src/content/quest-templates.json`
- Modify: `server/src/content/titles.json`
- Modify: `server/src/services/achievements.js`(collect_12 / collect_24)
- Test: `server/test/content.test.js`
- Test: `server/test/achievements.test.js`(追加)

**注意:** `achievements.key` 是已领取成就表的主键,**key 永不改**(存量存档按 key 记录),只改 threshold/desc 的派生方式。

- [ ] **Step 1: 扩充委托标题池 `quest-templates.json`**

整个文件替换为(5 分钟池 3→6、25 分钟池 4→8、45 分钟池 3→6,新增条目风格与现有一致):

```json
[
  { "durationMin": 5, "titles": ["营地散步", "捡拾柴火", "数一数星星", "溪边打水", "整理行囊", "喂食伙伴"] },
  { "durationMin": 25, "titles": ["林间巡逻", "溪谷采集", "古道护送", "萤光洞窟探查", "山涧溯源", "夜市巡查", "古树祈愿", "岩壁试炼"] },
  { "durationMin": 45, "titles": ["遗迹考察", "深林远征", "龙脊山道勘探", "群星观测", "废弃矿坑调查", "暴风前哨支援"] }
]
```

- [ ] **Step 2: 扩充称号 `titles.json`(Lv45 → Lv60)**

在 `{ "level": 45, "title": "星夜守望者" }` 之后追加三行:

```json
  { "level": 50, "title": "低语星辰" },
  { "level": 55, "title": "永恒旅人" },
  { "level": 60, "title": "星海化身" }
```

(注意上一行末尾补逗号;`titleFor` 对超出区间的高等级自动沿用最后一档,逻辑无需改。)

- [ ] **Step 3: achievements.js 解耦 collect_12 / collect_24**

`server/src/services/achievements.js`:
1. 顶部 import 改为从 content 引入 SPECIES:`import { SPECIES } from '../content/index.js';`(若该行已存在则复用)。
2. 两条成就定义替换为(key 不动):

```js
{ key: 'collect_12', name: '图鉴过半', desc: `收集 ${Math.floor(SPECIES.length / 2)} 种生物`, icon: 'book', metric: 'collected', threshold: Math.floor(SPECIES.length / 2), reward: { kind: 'egg', rarity: 'rare' } },
{ key: 'collect_24', name: '万物图鉴', desc: `集齐全部 ${SPECIES.length} 种生物`, icon: 'book', metric: 'collected', threshold: SPECIES.length, reward: { kind: 'egg', rarity: 'legendary' } },
```

并在 `ACHIEVEMENTS` 数组上方加一行注释:

```js
// collect_* 的 key 是 achievements 表主键,历史存档按 key 记录——物种数变化时只动 threshold/desc,key 永不改。
```

- [ ] **Step 4: 更新 content.test.js 断言**

`server/test/content.test.js` 的 `materials, templates, titles...` 用例中:
- `expect(TITLES).toHaveLength(10);` → `expect(TITLES).toHaveLength(13);`
- 追加标题池去重与称号单调校验(放在同用例末尾):

```js
for (const t of QUEST_TEMPLATES) expect(new Set(t.titles).size).toBe(t.titles.length);
for (let i = 1; i < TITLES.length; i++) expect(TITLES[i].level).toBeGreaterThan(TITLES[i - 1].level);
```

- [ ] **Step 5: achievements.test.js 追加解耦守卫**

`server/test/achievements.test.js` 追加用例:

```js
it('collection achievements track SPECIES length (content-decoupled)', async () => {
  const { app } = makeTestApp();
  const { SPECIES } = await import('../src/content/index.js');
  const ach = (await request(app).get('/api/state')).body.achievements;
  expect(ach.find(a => a.key === 'collect_24').threshold).toBe(SPECIES.length);
  expect(ach.find(a => a.key === 'collect_12').threshold).toBe(Math.floor(SPECIES.length / 2));
});
```

- [ ] **Step 6: 跑 server 全量测试**

Run: `npm test -w server`
Expected: 全部 PASS(82 + 新 1 = 83)。

- [ ] **Step 7: 提交**

```bash
git add server/src/content/quest-templates.json server/src/content/titles.json server/src/services/achievements.js server/test/content.test.js server/test/achievements.test.js
git commit -m "feat: 内容扩充——委托标题池翻倍/称号至 Lv60;图鉴成就与物种数解耦

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 7: lint + CI + engines + README 收尾

**Files:**
- Modify: `client/package.json`(devDeps + lint script)
- Modify: `server/package.json`(devDeps + lint script)
- Create: `server/eslint.config.js`
- Modify: `package.json`(root lint script + engines)
- Create: `.nvmrc`
- Create: `.github/workflows/ci.yml`
- Modify: `client/README.md`

- [ ] **Step 1: client 安装 eslint 依赖并加脚本(锁版本)**

```bash
npm install -w client -D eslint@^9 @eslint/js@^9 globals eslint-plugin-react-hooks eslint-plugin-react-refresh@^0.4.19
```

版本说明:**必须锁 `eslint@^9` 与 `eslint-plugin-react-refresh@^0.4.19`**——已提交的 `client/eslint.config.js:14` 按 0.4.x 形态把 `reactRefresh.configs.vite` 当对象用,而 0.5.7+ 改成了函数调用 `reactRefresh.configs.vite()`;eslint latest 已是 v10。装错版本 lint 会崩,那是插件形态问题不是代码问题。(react-hooks v7 的 `configs.flat.recommended`、`defineConfig` from 'eslint/config' 在 eslint 9 下均兼容。)

`client/package.json` scripts 加 `"lint": "eslint ."`。(配置文件 `client/eslint.config.js` 已存在,此前只是依赖没装。)

- [ ] **Step 2: server 新建 `eslint.config.js` 并装依赖**

```bash
npm install -w server -D eslint@^9 @eslint/js@^9 globals
```

`server/eslint.config.js`:

```js
import js from '@eslint/js';
import globals from 'globals';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['data/']),
  {
    files: ['**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: { globals: { ...globals.node } },
  },
]);
```

`server/package.json` scripts 加 `"lint": "eslint ."`。

- [ ] **Step 3: 根 package.json 加 lint 脚本与 engines**

scripts 加 `"lint": "npm run lint -w client && npm run lint -w server"`;顶层加:

```json
"engines": { "node": ">=20" }
```

- [ ] **Step 4: 跑双端 lint,最小修复暴露的问题**

Run: `npm run lint`
Expected: 0 error。若现有代码被揪出问题(如未用变量),**修代码不放宽配置**,保持 diff 最小;修完复跑至 0 error,并在提交信息里写明修了几处。

- [ ] **Step 5: 新建 `.nvmrc`**

```
20
```

- [ ] **Step 6: 新建 `.github/workflows/ci.yml`**

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

(better-sqlite3 11.x 在 ubuntu + node20 有预编译二进制,无需 build 工具链。)

- [ ] **Step 7: 重写 `client/README.md`(替换 Vite 模板默认文案)**

```markdown
# client — 星夜营地前端

React 18 + Vite SPA。开发与构建说明见[仓库根 README](../README.md)。

- `npm run dev -w client`:开发服务器(5173,`/api` 代理到 3001)
- `npm test -w client`:Vitest + Testing Library
- `npm run lint -w client`:ESLint(flat config)
```

- [ ] **Step 8: 全量验证**

Run: `npm run lint && npm test && npm run build`
Expected: lint 0 error;server 83 + client 7 全 PASS;构建成功。

- [ ] **Step 9: 提交**

```bash
git add client/package.json client/README.md server/package.json server/eslint.config.js package.json package-lock.json .nvmrc .github/workflows/ci.yml
git commit -m "chore: ESLint 双端接入 + GitHub Actions CI + engines/.nvmrc/README 收尾

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## 全局验收(计划执行完后由主会话运行)

- [ ] `git status` 干净(计划文档已随 Task 1 提交,不应再有未跟踪/未暂存文件)、`git log --oneline -8` 恰为 7 个新提交
- [ ] `npm run lint && npm test && npm run build` 全绿
- [ ] 手动冒烟(可选):`npm run dev` 后统计页出现「连续专注」卡;营地页把 pityCounter 手工置 ≥2 后出现保底提示
