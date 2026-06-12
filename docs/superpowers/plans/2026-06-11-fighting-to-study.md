# 星夜营地(FightingToStudy)实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现「星夜营地」——本地运行的游戏化学习动力系统:专注计时 = 出击委托,结算经验/金币/材料/蛋,孵化生物伙伴、建造营地。

**Architecture:** npm workspaces 单仓库,`client/`(React 18 + Vite SPA)+ `server/`(Express 4 + better-sqlite3)。计时真相在后端(session 行存 ends_at),结算为纯函数(可注入时钟与种子 RNG),内容配置(物种/建筑/模板)以 JSON 与存档数据库分离。生产模式 Express 同时托管打包前端与 API。

**Tech Stack:** React 18, Vite, react-router-dom 6, framer-motion 11, Express 4, better-sqlite3, Vitest (+ supertest, @testing-library/react)。

**规格:** `docs/superpowers/specs/2026-06-11-fighting-to-study-design.md`(已获批)。

**两处实现层面的微调(不偏离规格意图):**
1. 音效用 WebAudio 振荡器合成(零二进制资产、零版权问题),替代规格中的"CC0 音频素材"。
2. 升级事件仅在跨称号档位时携带 title,其余为 null(前端据此显示)。

---

## 约定(所有任务通用)

- 仓库根:`G:/code/MyProject/FightingToStudy`(下文命令均假设从仓库根执行,bash 语法)。
- 后端测试:`cd server && npx vitest run`(单文件:`npx vitest run test/<file>.test.js`)。
- 前端测试:`cd client && npx vitest run`。
- 每个任务结尾提交一次 git;提交信息见各任务最后一步。
- **RNG 消耗顺序契约**(多个测试依赖):结算时依次为 ① 材料种类 → ② 蛋判定 roll(必消耗,即使保底触发)→ ③ 蛋稀有度(若掉蛋)→ ④ 孵化物种(若孵化)。
- 日期时间:数据库存 ISO 8601(`new Date().toISOString()`);"游戏日"用服务器本地日期 `YYYY-MM-DD`。

## 文件结构总览(职责地图)

```
FightingToStudy/
├── package.json                 # workspaces + dev/build/start/test 根脚本
├── README.md                    # T21
├── client/
│   ├── package.json  vite.config.js  index.html
│   └── src/
│       ├── main.jsx  App.jsx  test-setup.js
│       ├── theme/theme.css           # 全部 CSS(日/夜变量 + 组件类,一次写全)
│       ├── theme/ThemeContext.jsx    # auto/day/night,localStorage
│       ├── api/client.js             # fetch 封装,非 2xx 抛 Error(中文 message)
│       ├── state/GameStateContext.jsx# /api/state 全局状态 + refresh
│       ├── utils/rarity.js           # 稀有度中文名
│       ├── hooks/useCountdown.js     # 倒计时 hook(+测试)
│       ├── audio/sfx.js              # WebAudio 合成音效
│       ├── components/
│       │   ├── Layout.jsx TopBar.jsx NavBar.jsx Toast.jsx
│       │   ├── QuestCard.jsx CreateQuestModal.jsx
│       │   ├── TimerRing.jsx RewardSequence.jsx(+测试)
│       │   └── CampScene.jsx BuildMenu.jsx
│       └── pages/Camp.jsx Adventure.jsx Collection.jsx Stats.jsx
├── server/
│   ├── package.json
│   ├── src/
│   │   ├── index.js              # 生产入口:备份→建库→静态托管→listen 3001
│   │   ├── app.js                # createApp({db,now,rng,staticDir}) 工厂 + 引导数据
│   │   ├── db/schema.sql  db/index.js  db/backup.js
│   │   ├── content/  materials|species|buildings|quest-templates|titles .json + index.js
│   │   ├── services/ rng.js leveling.js bonuses.js rewards.js
│   │   │             dailyQuests.js settlement.js welcomeBack.js
│   │   ├── routes/   state.js quests.js sessions.js collection.js stats.js buildings.js
│   │   └── utils/    dates.js errors.js
│   └── test/  helpers.js + 各 *.test.js
└── data/                         # app.db + backups/(gitignored,运行时生成)
```

---

### Task 1: Monorepo 脚手架

**Files:**
- Create: `package.json`(根)
- Create: `client/`(create-vite 模板后替换 `client/package.json`)
- Create: `server/package.json`, `server/src/index.js`(临时 ping 版,T14 替换)

- [ ] **Step 1: 写根 package.json**

```json
{
  "name": "fighting-to-study",
  "private": true,
  "workspaces": ["client", "server"],
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

- [ ] **Step 2: 生成 client 脚手架**

Run: `cd G:/code/MyProject/FightingToStudy && npm create vite@latest client -- --template react`
Expected: 生成 `client/` 目录(框架已由参数指定,非交互完成)。

- [ ] **Step 3: 替换 client/package.json(锁定 React 18 与测试依赖)**

```json
{
  "name": "client",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run"
  },
  "dependencies": {
    "framer-motion": "^11.15.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.1.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^25.0.0",
    "vite": "^6.0.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 4: 写 server/package.json**

```json
{
  "name": "server",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node --watch src/index.js",
    "start": "node src/index.js",
    "test": "vitest run"
  },
  "dependencies": {
    "better-sqlite3": "^11.7.0",
    "express": "^4.21.0"
  },
  "devDependencies": {
    "supertest": "^7.0.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 5: 写临时 server/src/index.js(T14 会替换为正式入口)**

```js
import express from 'express';

const app = express();
app.get('/api/ping', (req, res) => res.json({ ok: true, name: '星夜营地' }));
app.listen(3001, () => console.log('API on http://localhost:3001'));
```

- [ ] **Step 6: 安装依赖**

Run: `npm install`
Expected: 三个 workspace 全部安装成功。
注意:better-sqlite3 在 Windows 会下载预编译二进制;若编译报错,改用 Node LTS(20/22)或安装 VS Build Tools 后重试。

- [ ] **Step 7: 冒烟验证**

Run: `npm run dev`(另开终端)`curl http://localhost:3001/api/ping`
Expected: `{"ok":true,"name":"星夜营地"}`;浏览器开 `http://localhost:5173` 显示 Vite 模板页。验证后 Ctrl+C 停止。

- [ ] **Step 8: 提交**

```bash
git add -A && git commit -m "chore: monorepo 脚手架(client/server/根脚本)"
```

---

### Task 2: SQLite 数据层

**Files:**
- Create: `server/src/db/schema.sql`, `server/src/db/index.js`
- Test: `server/test/db.test.js`

- [ ] **Step 1: 写失败测试**

```js
// server/test/db.test.js
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/db/index.js';

describe('createDb', () => {
  it('creates all tables', () => {
    const db = createDb(':memory:');
    const names = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
    for (const t of ['player', 'quests', 'sessions', 'inventory', 'eggs', 'creatures', 'buildings', 'settings'])
      expect(names).toContain(t);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `cd server && npx vitest run test/db.test.js`
Expected: FAIL(找不到 `../src/db/index.js`)。

- [ ] **Step 3: 写 schema.sql**

```sql
-- server/src/db/schema.sql
CREATE TABLE IF NOT EXISTS player (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL DEFAULT '冒险者',
  level INTEGER NOT NULL DEFAULT 1,
  exp INTEGER NOT NULL DEFAULT 0,
  gold INTEGER NOT NULL DEFAULT 0,
  pity_counter INTEGER NOT NULL DEFAULT 0,
  last_completed_at TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS quests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('daily','custom')),
  duration_min INTEGER NOT NULL,
  subject_tag TEXT,
  status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('ready','active','done','failed','expired')),
  daily_date TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quest_id INTEGER NOT NULL REFERENCES quests(id),
  started_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','completed','abandoned')),
  settlement_json TEXT,
  completed_at TEXT
);
CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_key TEXT NOT NULL UNIQUE,
  qty INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS eggs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rarity TEXT NOT NULL CHECK (rarity IN ('common','rare','epic','legendary')),
  progress INTEGER NOT NULL DEFAULT 0,
  required INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'incubating' CHECK (status IN ('incubating','hatched')),
  obtained_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS creatures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  species_key TEXT NOT NULL,
  rarity TEXT NOT NULL,
  hatched_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS buildings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slot_index INTEGER NOT NULL UNIQUE CHECK (slot_index BETWEEN 0 AND 7),
  building_key TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  built_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
```

- [ ] **Step 4: 写 db/index.js**

```js
// server/src/db/index.js
import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createDb(filePath = ':memory:') {
  const db = new Database(filePath);
  db.pragma('journal_mode = WAL');
  db.exec(readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  return db;
}

export const DATA_DIR = path.resolve(__dirname, '../../../data');
export const DB_PATH = path.join(DATA_DIR, 'app.db');
```

- [ ] **Step 5: 运行确认通过**

Run: `cd server && npx vitest run test/db.test.js`
Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add -A && git commit -m "feat(server): SQLite 数据层与建表"
```

---

### Task 3: 游戏内容配置

**Files:**
- Create: `server/src/content/materials.json`, `species.json`, `buildings.json`, `quest-templates.json`, `titles.json`, `index.js`
- Test: `server/test/content.test.js`

- [ ] **Step 1: 写失败测试**

```js
// server/test/content.test.js
import { describe, it, expect } from 'vitest';
import { SPECIES, BUILDINGS, MATERIALS, QUEST_TEMPLATES, TITLES, RARITY_WEIGHTS, HATCH_REQUIRED } from '../src/content/index.js';

describe('content data', () => {
  it('has 24 species: 10 common / 8 rare / 4 epic / 2 legendary', () => {
    const by = r => SPECIES.filter(s => s.rarity === r).length;
    expect(SPECIES).toHaveLength(24);
    expect(by('common')).toBe(10);
    expect(by('rare')).toBe(8);
    expect(by('epic')).toBe(4);
    expect(by('legendary')).toBe(2);
  });
  it('species have unique keys and required fields', () => {
    expect(new Set(SPECIES.map(s => s.key)).size).toBe(24);
    for (const s of SPECIES) {
      expect(s.name).toBeTruthy();
      expect(s.emoji).toBeTruthy();
      expect(s.flavor).toBeTruthy();
    }
  });
  it('buildings use only known effect types; campfire is not buildable', () => {
    const known = ['exp_pct', 'gold_pct', 'egg_pct_points', 'material_flat'];
    for (const b of BUILDINGS) {
      if (b.effect) expect(known).toContain(b.effect.type);
      if (b.buildable) expect(Object.keys(b.baseCost).length).toBeGreaterThan(0);
    }
    expect(BUILDINGS.find(b => b.key === 'campfire').buildable).toBe(false);
  });
  it('materials, templates, titles, weights are sane', () => {
    expect(MATERIALS.map(m => m.key)).toEqual(['wood', 'stone', 'stardust', 'crystal']);
    expect(QUEST_TEMPLATES.map(t => t.durationMin)).toEqual([5, 25, 45]);
    expect(TITLES).toHaveLength(10);
    expect(Object.keys(RARITY_WEIGHTS)).toEqual(['common', 'rare', 'epic', 'legendary']);
    expect(HATCH_REQUIRED).toEqual({ common: 3, rare: 5, epic: 8, legendary: 12 });
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `cd server && npx vitest run test/content.test.js`
Expected: FAIL(模块不存在)。

- [ ] **Step 3: 写 materials.json**

```json
[
  { "key": "wood", "name": "木材", "emoji": "🪵", "weight": 55 },
  { "key": "stone", "name": "石料", "emoji": "🪨", "weight": 30 },
  { "key": "stardust", "name": "星尘", "emoji": "✨", "weight": 12 },
  { "key": "crystal", "name": "知识水晶", "emoji": "🔮", "weight": 3 }
]
```

- [ ] **Step 4: 写 species.json(24 种)**

```json
[
  { "key": "fox", "name": "小狐", "emoji": "🦊", "rarity": "common", "flavor": "总在篝火边打瞌睡。" },
  { "key": "rabbit", "name": "团子兔", "emoji": "🐰", "rarity": "common", "flavor": "毛茸茸的圆滚滚。" },
  { "key": "owl", "name": "夜枭", "emoji": "🦉", "rarity": "common", "flavor": "熬夜学习的守护者。" },
  { "key": "hedgehog", "name": "刺球", "emoji": "🦔", "rarity": "common", "flavor": "缩成一团就是安全感。" },
  { "key": "squirrel", "name": "松栗鼠", "emoji": "🐿️", "rarity": "common", "flavor": "囤知识就像囤松果。" },
  { "key": "frog", "name": "雨蛙", "emoji": "🐸", "rarity": "common", "flavor": "雨天的歌唱家。" },
  { "key": "mushroom_sprite", "name": "蘑菇精", "emoji": "🍄", "rarity": "common", "flavor": "潮湿夜里悄悄冒头。" },
  { "key": "snail", "name": "慢慢", "emoji": "🐌", "rarity": "common", "flavor": "慢,但从不停下。" },
  { "key": "bat", "name": "夜翼", "emoji": "🦇", "rarity": "common", "flavor": "黑夜里的导航员。" },
  { "key": "cat", "name": "灰灰", "emoji": "🐱", "rarity": "common", "flavor": "高冷,但偷偷关心你。" },
  { "key": "wolf", "name": "月狼", "emoji": "🐺", "rarity": "rare", "flavor": "月圆之夜的远嚎。" },
  { "key": "deer", "name": "白鹿", "emoji": "🦌", "rarity": "rare", "flavor": "林间一闪而过的白影。" },
  { "key": "raccoon", "name": "浣月", "emoji": "🦝", "rarity": "rare", "flavor": "总想洗一洗你的文具。" },
  { "key": "penguin", "name": "冰原客", "emoji": "🐧", "rarity": "rare", "flavor": "从极南之地远道而来。" },
  { "key": "octopus", "name": "墨墨", "emoji": "🐙", "rarity": "rare", "flavor": "八只手都拿着书。" },
  { "key": "butterfly", "name": "蝶灵", "emoji": "🦋", "rarity": "rare", "flavor": "停在书页上的彩光。" },
  { "key": "turtle", "name": "星龟", "emoji": "🐢", "rarity": "rare", "flavor": "背甲上刻着星图。" },
  { "key": "eagle", "name": "风隼", "emoji": "🦅", "rarity": "rare", "flavor": "俯瞰整片大陆的眼睛。" },
  { "key": "unicorn", "name": "微光独角兽", "emoji": "🦄", "rarity": "epic", "flavor": "角尖闪着银河的光。" },
  { "key": "dragonling", "name": "云霭幼龙", "emoji": "🐲", "rarity": "epic", "flavor": "在云端打盹的小家伙。" },
  { "key": "fairy", "name": "星尘精灵", "emoji": "🧚", "rarity": "epic", "flavor": "撒下星尘祝福努力的人。" },
  { "key": "peacock", "name": "琉璃孔雀", "emoji": "🦚", "rarity": "epic", "flavor": "开屏时如极光流转。" },
  { "key": "galaxy_dragon", "name": "星河古龙", "emoji": "🐉", "rarity": "legendary", "flavor": "尾巴一摆,银河泛起涟漪。" },
  { "key": "moon_swan", "name": "月神天鹅", "emoji": "🦢", "rarity": "legendary", "flavor": "月光是它羽毛的倒影。" }
]
```

- [ ] **Step 5: 写 buildings.json**

```json
[
  { "key": "campfire", "name": "篝火", "emoji": "🔥", "buildable": false, "desc": "营地之心,永远为你燃烧。", "effect": null, "baseCost": {} },
  { "key": "tent", "name": "帐篷", "emoji": "⛺", "buildable": true, "desc": "温暖的住处让人更勤快。", "effect": { "type": "gold_pct", "value": 3 }, "baseCost": { "wood": 5 } },
  { "key": "library", "name": "图书角", "emoji": "📚", "buildable": true, "desc": "知识的殿堂。", "effect": { "type": "exp_pct", "value": 5 }, "baseCost": { "wood": 10, "stone": 5 } },
  { "key": "workshop", "name": "工坊", "emoji": "⚒️", "buildable": true, "desc": "出击时多带回一份材料。", "effect": { "type": "material_flat", "value": 1 }, "baseCost": { "wood": 8, "stone": 8 } },
  { "key": "herb_garden", "name": "药草园", "emoji": "🌿", "buildable": true, "desc": "草药香气让头脑更清醒。", "effect": { "type": "exp_pct", "value": 3 }, "baseCost": { "wood": 6, "stardust": 1 } },
  { "key": "treasury", "name": "宝物库", "emoji": "💰", "buildable": true, "desc": "妥善保管,钱生钱。", "effect": { "type": "gold_pct", "value": 5 }, "baseCost": { "stone": 12, "stardust": 2 } },
  { "key": "watchtower", "name": "瞭望塔", "emoji": "🗼", "buildable": true, "desc": "看得更远,发现更多蛋。", "effect": { "type": "egg_pct_points", "value": 1 }, "baseCost": { "wood": 12, "stone": 10 } },
  { "key": "observatory", "name": "星象台", "emoji": "🔭", "buildable": true, "desc": "聆听星辰,蛋的眷顾更多。", "effect": { "type": "egg_pct_points", "value": 2 }, "baseCost": { "stone": 10, "stardust": 3, "crystal": 1 } }
]
```

- [ ] **Step 6: 写 quest-templates.json 与 titles.json**

```json
[
  { "durationMin": 5, "titles": ["营地散步", "捡拾柴火", "数一数星星"] },
  { "durationMin": 25, "titles": ["林间巡逻", "溪谷采集", "古道护送", "萤光洞窟探查"] },
  { "durationMin": 45, "titles": ["遗迹考察", "深林远征", "龙脊山道勘探"] }
]
```

```json
[
  { "level": 1, "title": "见习学者" },
  { "level": 5, "title": "青铜探索者" },
  { "level": 10, "title": "白银远行者" },
  { "level": 15, "title": "黄金开拓者" },
  { "level": 20, "title": "秘银猎手" },
  { "level": 25, "title": "星辉骑士" },
  { "level": 30, "title": "贤者之徒" },
  { "level": 35, "title": "奥术贤者" },
  { "level": 40, "title": "传奇冒险家" },
  { "level": 45, "title": "星夜守望者" }
]
```

- [ ] **Step 7: 写 content/index.js**

```js
// server/src/content/index.js
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const load = (file) => JSON.parse(readFileSync(path.join(__dirname, file), 'utf8'));

export const MATERIALS = load('materials.json');
export const SPECIES = load('species.json');
export const BUILDINGS = load('buildings.json');
export const QUEST_TEMPLATES = load('quest-templates.json');
export const TITLES = load('titles.json');

export const MATERIAL_MAP = Object.fromEntries(MATERIALS.map(m => [m.key, m]));
export const SPECIES_MAP = Object.fromEntries(SPECIES.map(s => [s.key, s]));
export const BUILDING_MAP = Object.fromEntries(BUILDINGS.map(b => [b.key, b]));

export const RARITY_WEIGHTS = { common: 70, rare: 22, epic: 7, legendary: 1 };
export const HATCH_REQUIRED = { common: 3, rare: 5, epic: 8, legendary: 12 };
```

- [ ] **Step 8: 运行确认通过并提交**

Run: `cd server && npx vitest run test/content.test.js`
Expected: PASS。

```bash
git add -A && git commit -m "feat(server): 游戏内容配置(物种/建筑/委托模板/称号/材料)"
```

---

### Task 4: 可注入种子的 RNG

**Files:**
- Create: `server/src/services/rng.js`
- Test: `server/test/rng.test.js`

- [ ] **Step 1: 写失败测试**

```js
// server/test/rng.test.js
import { describe, it, expect } from 'vitest';
import { mulberry32, pickWeighted } from '../src/services/rng.js';

describe('mulberry32', () => {
  it('is deterministic for the same seed', () => {
    const a = mulberry32(42), b = mulberry32(42);
    for (let i = 0; i < 5; i++) expect(a()).toBe(b());
  });
  it('returns values in [0,1)', () => {
    const r = mulberry32(7);
    for (let i = 0; i < 100; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('pickWeighted', () => {
  const entries = [{ value: 'a', weight: 70 }, { value: 'b', weight: 30 }];
  it('picks by cumulative weight', () => {
    expect(pickWeighted(() => 0.0, entries)).toBe('a');
    expect(pickWeighted(() => 0.69, entries)).toBe('a');
    expect(pickWeighted(() => 0.71, entries)).toBe('b');
    expect(pickWeighted(() => 0.999, entries)).toBe('b');
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `cd server && npx vitest run test/rng.test.js`
Expected: FAIL。

- [ ] **Step 3: 实现 rng.js**

```js
// server/src/services/rng.js
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// entries: [{ value, weight }]
export function pickWeighted(rng, entries) {
  const total = entries.reduce((s, e) => s + e.weight, 0);
  let roll = rng() * total;
  for (const e of entries) {
    roll -= e.weight;
    if (roll < 0) return e.value;
  }
  return entries[entries.length - 1].value;
}
```

- [ ] **Step 4: 运行确认通过并提交**

Run: `cd server && npx vitest run test/rng.test.js`
Expected: PASS。

```bash
git add -A && git commit -m "feat(server): 可注入种子的 RNG 与加权抽取"
```

---

### Task 5: 等级曲线与称号

**Files:**
- Create: `server/src/services/leveling.js`
- Test: `server/test/leveling.test.js`

- [ ] **Step 1: 写失败测试**

```js
// server/test/leveling.test.js
import { describe, it, expect } from 'vitest';
import { expToNext, applyExp, titleFor } from '../src/services/leveling.js';
import { TITLES } from '../src/content/index.js';

describe('leveling', () => {
  it('exp curve: 100, 150, …, 100+(L-1)*50', () => {
    expect(expToNext(1)).toBe(100);
    expect(expToNext(2)).toBe(150);
    expect(expToNext(10)).toBe(550);
  });
  it('applies exp without level up', () => {
    expect(applyExp(1, 0, 99)).toEqual({ level: 1, exp: 99, levelUps: [] });
  });
  it('handles single and multi level ups with carry-over', () => {
    expect(applyExp(1, 90, 20)).toEqual({ level: 2, exp: 10, levelUps: [2] });
    expect(applyExp(1, 0, 260)).toEqual({ level: 3, exp: 10, levelUps: [2, 3] });
  });
  it('titleFor returns the highest reached tier', () => {
    expect(titleFor(1, TITLES)).toBe('见习学者');
    expect(titleFor(7, TITLES)).toBe('青铜探索者');
    expect(titleFor(45, TITLES)).toBe('星夜守望者');
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `cd server && npx vitest run test/leveling.test.js`
Expected: FAIL。

- [ ] **Step 3: 实现 leveling.js**

```js
// server/src/services/leveling.js
export function expToNext(level) {
  return 100 + (level - 1) * 50;
}

export function applyExp(level, exp, gained) {
  let newLevel = level;
  let newExp = exp + gained;
  const levelUps = [];
  while (newExp >= expToNext(newLevel)) {
    newExp -= expToNext(newLevel);
    newLevel += 1;
    levelUps.push(newLevel);
  }
  return { level: newLevel, exp: newExp, levelUps };
}

export function titleFor(level, titles) {
  let current = titles[0].title;
  for (const row of titles) if (level >= row.level) current = row.title;
  return current;
}
```

- [ ] **Step 4: 运行确认通过并提交**

Run: `cd server && npx vitest run test/leveling.test.js`
Expected: PASS。

```bash
git add -A && git commit -m "feat(server): 等级曲线与称号"
```

---

### Task 6: 结算计算核心(纯函数)

**Files:**
- Create: `server/src/services/rewards.js`, `server/src/services/bonuses.js`
- Create: `server/test/helpers.js`(本任务只含 seqRng,T7 整文件替换扩充)
- Test: `server/test/rewards.test.js`

- [ ] **Step 1: 写测试辅助 seqRng**

```js
// server/test/helpers.js
export function seqRng(values) {
  let i = 0;
  return () => (i < values.length ? values[i++] : values[values.length - 1]);
}
```

- [ ] **Step 2: 写失败测试(结算全行为)**

```js
// server/test/rewards.test.js
import { describe, it, expect } from 'vitest';
import { calculateSettlement } from '../src/services/rewards.js';
import { aggregateBonuses } from '../src/services/bonuses.js';
import { BUILDING_MAP } from '../src/content/index.js';
import { seqRng } from './helpers.js';

const NO_BONUS = { expPct: 0, goldPct: 0, eggPctPoints: 0, materialFlat: 0 };
const basePlayer = { level: 1, exp: 0, pity_counter: 0 };

function calc(overrides = {}) {
  return calculateSettlement({
    durationMin: 25, player: basePlayer, bonuses: NO_BONUS,
    incubatingEgg: null, collectedKeys: [], rng: () => 0.5, ...overrides,
  });
}

describe('calculateSettlement', () => {
  it('awards exp = min*2 and gold = min*1', () => {
    const { events, deltas } = calc();
    expect(deltas.expGained).toBe(50);
    expect(deltas.goldGained).toBe(25);
    expect(events[0]).toMatchObject({ type: 'exp', amount: 50 });
    expect(events[1]).toMatchObject({ type: 'gold', amount: 25 });
  });

  it('applies percentage bonuses', () => {
    const { deltas } = calc({ bonuses: { ...NO_BONUS, expPct: 10, goldPct: 20 } });
    expect(deltas.expGained).toBe(55);
    expect(deltas.goldGained).toBe(30);
  });

  it('emits levelup events', () => {
    const { events } = calc({ durationMin: 120, player: { level: 1, exp: 90, pity_counter: 0 } });
    const ups = events.filter(e => e.type === 'levelup');
    expect(ups.map(u => u.level)).toEqual([2, 3]);
  });

  it('grants materials: qty = 1 + floor(min/15) + flat bonus', () => {
    expect(calc().events.find(e => e.type === 'material').qty).toBe(2);
    expect(calc({ durationMin: 5 }).events.find(e => e.type === 'material').qty).toBe(1);
    expect(calc({ bonuses: { ...NO_BONUS, materialFlat: 2 } }).events.find(e => e.type === 'material').qty).toBe(4);
  });

  it('egg drop follows rng order: material → egg-roll → rarity', () => {
    const { deltas } = calc({ rng: seqRng([0.5, 0.10, 0.5]) }); // 25min → P=0.20
    expect(deltas.eggDropped).toEqual({ rarity: 'common', required: 3 });
    expect(deltas.newPity).toBe(0);
  });

  it('no egg increments pity', () => {
    const { deltas } = calc({ rng: seqRng([0.5, 0.99]) });
    expect(deltas.eggDropped).toBeNull();
    expect(deltas.newPity).toBe(1);
  });

  it('pity >= 4 forces an egg even on a bad roll', () => {
    const { deltas, events } = calc({ player: { ...basePlayer, pity_counter: 4 }, rng: seqRng([0.5, 0.99, 0.5]) });
    expect(deltas.eggDropped).not.toBeNull();
    expect(events.find(e => e.type === 'egg').pity).toBe(true);
  });

  it('egg chance caps at 0.35 by duration and is boosted by points', () => {
    const miss = calc({ durationMin: 120, rng: seqRng([0.5, 0.36]) });
    expect(miss.deltas.eggDropped).toBeNull();
    const hit = calc({ durationMin: 120, bonuses: { ...NO_BONUS, eggPctPoints: 5 }, rng: seqRng([0.5, 0.39, 0.1]) });
    expect(hit.deltas.eggDropped).not.toBeNull();
  });

  it('rarity follows weights (legendary on extreme roll)', () => {
    const { deltas } = calc({ rng: seqRng([0.5, 0.0, 0.995]) });
    expect(deltas.eggDropped.rarity).toBe('legendary');
    expect(deltas.eggDropped.required).toBe(12);
  });

  it('advances incubation of the provided egg', () => {
    const { deltas, events } = calc({ incubatingEgg: { id: 9, rarity: 'rare', progress: 1, required: 5 } });
    expect(deltas.eggProgress).toEqual({ eggId: 9, progress: 2 });
    expect(events.find(e => e.type === 'egg_progress')).toMatchObject({ progress: 2, required: 5 });
    expect(deltas.hatched).toBeNull();
  });

  it('hatches at required progress, preferring uncollected species', () => {
    const { deltas, events } = calc({
      incubatingEgg: { id: 9, rarity: 'legendary', progress: 11, required: 12 },
      collectedKeys: ['galaxy_dragon'],
      rng: seqRng([0.5, 0.99, 0.0]),
    });
    expect(deltas.hatched.species.key).toBe('moon_swan');
    expect(events.find(e => e.type === 'hatch').species.key).toBe('moon_swan');
  });

  it('allows duplicates when the rarity tier is fully collected', () => {
    const { deltas } = calc({
      incubatingEgg: { id: 9, rarity: 'legendary', progress: 11, required: 12 },
      collectedKeys: ['galaxy_dragon', 'moon_swan'],
      rng: seqRng([0.5, 0.99, 0.0]),
    });
    expect(['galaxy_dragon', 'moon_swan']).toContain(deltas.hatched.species.key);
  });

  it('event order: exp → gold → levelup → material → egg → incubation', () => {
    const { events } = calc({
      durationMin: 120, player: { level: 1, exp: 90, pity_counter: 4 },
      incubatingEgg: { id: 9, rarity: 'common', progress: 0, required: 3 },
      rng: seqRng([0.5, 0.99, 0.5, 0.5]),
    });
    const types = events.map(e => e.type);
    expect(types.slice(0, 2)).toEqual(['exp', 'gold']);
    expect(types.indexOf('material')).toBeGreaterThan(types.lastIndexOf('levelup'));
    expect(types.indexOf('egg')).toBeGreaterThan(types.indexOf('material'));
    expect(types.indexOf('egg_progress')).toBeGreaterThan(types.indexOf('egg'));
  });
});

describe('aggregateBonuses', () => {
  it('stacks effects across buildings scaled by level, skipping no-effect ones', () => {
    const bonuses = aggregateBonuses([
      { building_key: 'library', level: 2 },     // exp +10
      { building_key: 'herb_garden', level: 1 }, // exp +3
      { building_key: 'tent', level: 3 },        // gold +9
      { building_key: 'observatory', level: 2 }, // egg +4
      { building_key: 'workshop', level: 1 },    // material +1
      { building_key: 'campfire', level: 1 },    // 无效果
    ], BUILDING_MAP);
    expect(bonuses).toEqual({ expPct: 13, goldPct: 9, eggPctPoints: 4, materialFlat: 1 });
  });
});
```

- [ ] **Step 3: 运行确认失败**

Run: `cd server && npx vitest run test/rewards.test.js`
Expected: FAIL。

- [ ] **Step 4: 实现 bonuses.js**

```js
// server/src/services/bonuses.js
// buildings: [{ building_key, level }];catalog: BUILDING_MAP
export function aggregateBonuses(buildings, catalog) {
  const acc = { expPct: 0, goldPct: 0, eggPctPoints: 0, materialFlat: 0 };
  for (const b of buildings) {
    const def = catalog[b.building_key];
    if (!def?.effect) continue;
    const v = def.effect.value * b.level;
    if (def.effect.type === 'exp_pct') acc.expPct += v;
    else if (def.effect.type === 'gold_pct') acc.goldPct += v;
    else if (def.effect.type === 'egg_pct_points') acc.eggPctPoints += v;
    else if (def.effect.type === 'material_flat') acc.materialFlat += v;
  }
  return acc;
}
```

- [ ] **Step 5: 实现 rewards.js**

```js
// server/src/services/rewards.js
import { pickWeighted } from './rng.js';
import { applyExp, titleFor } from './leveling.js';
import { MATERIALS, SPECIES, TITLES, RARITY_WEIGHTS, HATCH_REQUIRED } from '../content/index.js';

// rng 消耗顺序(测试依赖):① 材料种类 ② 蛋判定(必消耗) ③ 蛋稀有度(若掉蛋) ④ 孵化物种(若孵化)
export function calculateSettlement({ durationMin, player, bonuses, incubatingEgg, collectedKeys, rng }) {
  const events = [];

  const expGained = Math.round(durationMin * 2 * (1 + bonuses.expPct / 100));
  const goldGained = Math.round(durationMin * 1 * (1 + bonuses.goldPct / 100));
  const lvl = applyExp(player.level, player.exp, expGained);
  events.push({ type: 'exp', amount: expGained });
  events.push({ type: 'gold', amount: goldGained });
  for (const newLevel of lvl.levelUps) {
    const newTitle = titleFor(newLevel, TITLES);
    events.push({ type: 'levelup', level: newLevel, title: newTitle !== titleFor(newLevel - 1, TITLES) ? newTitle : null });
  }

  const mat = pickWeighted(rng, MATERIALS.map(m => ({ value: m, weight: m.weight })));
  const qty = 1 + Math.floor(durationMin / 15) + bonuses.materialFlat;
  events.push({ type: 'material', key: mat.key, name: mat.name, emoji: mat.emoji, qty });

  const chance = Math.min(0.15 + durationMin * 0.002, 0.35) + bonuses.eggPctPoints / 100;
  const roll = rng(); // 必消耗,保底也不跳过,保证 rng 顺序稳定
  const pity = player.pity_counter >= 4;
  let eggDropped = null;
  if (pity || roll < chance) {
    const rarity = pickWeighted(rng, Object.entries(RARITY_WEIGHTS).map(([value, weight]) => ({ value, weight })));
    eggDropped = { rarity, required: HATCH_REQUIRED[rarity] };
    events.push({ type: 'egg', rarity, pity });
  }
  const newPity = eggDropped ? 0 : player.pity_counter + 1;

  let eggProgress = null;
  let hatched = null;
  if (incubatingEgg) {
    const progress = incubatingEgg.progress + 1;
    if (progress >= incubatingEgg.required) {
      const pool = SPECIES.filter(s => s.rarity === incubatingEgg.rarity);
      const uncollected = pool.filter(s => !collectedKeys.includes(s.key));
      const candidates = uncollected.length > 0 ? uncollected : pool;
      const species = candidates[Math.floor(rng() * candidates.length)];
      hatched = { eggId: incubatingEgg.id, species };
      events.push({ type: 'hatch', species });
    } else {
      eggProgress = { eggId: incubatingEgg.id, progress };
      events.push({ type: 'egg_progress', progress, required: incubatingEgg.required, rarity: incubatingEgg.rarity });
    }
  }

  return {
    events,
    deltas: {
      expGained, goldGained, newLevel: lvl.level, newExp: lvl.exp, levelUps: lvl.levelUps,
      material: { key: mat.key, qty }, eggDropped, newPity, eggProgress, hatched,
    },
  };
}
```

- [ ] **Step 6: 运行确认通过并提交**

Run: `cd server && npx vitest run test/rewards.test.js`
Expected: PASS(14 个用例)。

```bash
git add -A && git commit -m "feat(server): 结算计算核心(奖励/掉落/保底/孵化)"
```

---

### Task 7: App 工厂与 GET /api/state

**Files:**
- Create: `server/src/utils/errors.js`, `server/src/utils/dates.js`
- Create: `server/src/app.js`, `server/src/routes/state.js`, `server/src/routes/quests.js`(本任务只含 toQuestJson)
- Modify: `server/test/helpers.js`(整文件替换)
- Test: `server/test/state.test.js`

- [ ] **Step 1: 替换 helpers.js(完整新内容)**

```js
// server/test/helpers.js
import { createDb } from '../src/db/index.js';
import { createApp } from '../src/app.js';

export function seqRng(values) {
  let i = 0;
  return () => (i < values.length ? values[i++] : values[values.length - 1]);
}

// clock.current 可被测试直接改写以"快进时间"
export function makeTestApp({ start = '2026-06-11T10:00:00', rng = () => 0.5 } = {}) {
  const db = createDb(':memory:');
  const clock = { current: new Date(start) };
  const app = createApp({ db, now: () => clock.current, rng });
  return { app, db, clock };
}

export function grant(db, key, qty) {
  db.prepare('UPDATE inventory SET qty = qty + ? WHERE item_key=?').run(qty, key);
}
```

- [ ] **Step 2: 写失败测试**

```js
// server/test/state.test.js
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { makeTestApp } from './helpers.js';

describe('GET /api/state', () => {
  it('bootstraps player, campfire and empty inventory', async () => {
    const { app } = makeTestApp();
    const res = await request(app).get('/api/state');
    expect(res.status).toBe(200);
    expect(res.body.player).toMatchObject({ name: '冒险者', level: 1, exp: 0, gold: 0, title: '见习学者', expToNext: 100, pityCounter: 0 });
    expect(res.body.buildings).toEqual([{ slotIndex: 0, key: 'campfire', level: 1 }]);
    expect(res.body.resources).toHaveLength(4);
    expect(res.body.resources.every(r => r.qty === 0)).toBe(true);
    expect(res.body.runningSession).toBeNull();
    expect(res.body.incubatingEgg).toBeNull();
    expect(res.body.creatures).toEqual([]);
    expect(res.body.collectionProgress).toEqual({ collected: 0, total: 24 });
    expect(res.body.buildingCatalog).toHaveLength(8);
    expect(res.body.welcomeBack).toBeNull();
    expect(typeof res.body.serverNow).toBe('string');
  });
});
```

- [ ] **Step 3: 运行确认失败**

Run: `cd server && npx vitest run test/state.test.js`
Expected: FAIL(app.js 不存在)。

- [ ] **Step 4: 写 utils**

```js
// server/src/utils/errors.js
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
```

```js
// server/src/utils/dates.js
// 服务器本地日期,作为"游戏日"
export function localDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
```

- [ ] **Step 5: 写 routes/quests.js(本任务仅 toQuestJson,T9 补全路由)**

```js
// server/src/routes/quests.js
export function toQuestJson(q) {
  return { id: q.id, title: q.title, type: q.type, durationMin: q.duration_min, subjectTag: q.subject_tag, status: q.status };
}
```

- [ ] **Step 6: 写 routes/state.js(quests 查询就绪;每日生成 T8、回归礼包 T13 接入)**

```js
// server/src/routes/state.js
import { Router } from 'express';
import { localDateStr } from '../utils/dates.js';
import { expToNext, titleFor } from '../services/leveling.js';
import { MATERIAL_MAP, SPECIES, SPECIES_MAP, BUILDINGS, TITLES } from '../content/index.js';
import { toQuestJson } from './quests.js';

export function createStateRouter({ db, now, rng }) {
  const router = Router();

  router.get('/', (req, res, next) => {
    try {
      const today = localDateStr(now());
      const welcomeBack = null; // T13 替换为 checkWelcomeBack(db, now, rng)
      const player = db.prepare('SELECT * FROM player WHERE id=1').get();
      const resources = db.prepare('SELECT item_key, qty FROM inventory').all()
        .map(r => ({ key: r.item_key, name: MATERIAL_MAP[r.item_key].name, emoji: MATERIAL_MAP[r.item_key].emoji, qty: r.qty }));
      const quests = db.prepare(
        "SELECT * FROM quests WHERE (type='daily' AND daily_date=?) OR (type='custom' AND status IN ('ready','active')) ORDER BY type DESC, id"
      ).all(today).map(toQuestJson);
      const running = db.prepare(
        "SELECT s.*, q.title AS quest_title, q.type AS quest_type, q.duration_min AS qmin, q.subject_tag AS qtag FROM sessions s JOIN quests q ON q.id=s.quest_id WHERE s.status='running'"
      ).get();
      const egg = db.prepare("SELECT * FROM eggs WHERE status='incubating' ORDER BY obtained_at, id LIMIT 1").get();
      const queueCount = db.prepare("SELECT COUNT(*) AS c FROM eggs WHERE status='incubating'").get().c;
      const buildings = db.prepare('SELECT slot_index, building_key, level FROM buildings ORDER BY slot_index').all()
        .map(b => ({ slotIndex: b.slot_index, key: b.building_key, level: b.level }));
      const creatures = db.prepare('SELECT id, species_key, rarity FROM creatures ORDER BY hatched_at, id').all()
        .map(c => ({ id: c.id, key: c.species_key, name: SPECIES_MAP[c.species_key]?.name, emoji: SPECIES_MAP[c.species_key]?.emoji, rarity: c.rarity }));
      const collected = db.prepare('SELECT COUNT(DISTINCT species_key) AS c FROM creatures').get().c;

      res.json({
        serverNow: now().toISOString(),
        player: {
          name: player.name, level: player.level, exp: player.exp, expToNext: expToNext(player.level),
          title: titleFor(player.level, TITLES), gold: player.gold, pityCounter: player.pity_counter,
        },
        resources, quests,
        runningSession: running ? {
          id: running.id, questId: running.quest_id, questTitle: running.quest_title, questType: running.quest_type,
          durationMin: running.qmin, subjectTag: running.qtag, startedAt: running.started_at, endsAt: running.ends_at,
        } : null,
        incubatingEgg: egg ? { id: egg.id, rarity: egg.rarity, progress: egg.progress, required: egg.required, queueCount } : null,
        buildings, buildingCatalog: BUILDINGS, creatures,
        collectionProgress: { collected, total: SPECIES.length },
        welcomeBack,
      });
    } catch (e) { next(e); }
  });

  return router;
}
```

- [ ] **Step 7: 写 app.js**

```js
// server/src/app.js
import express from 'express';
import path from 'node:path';
import { MATERIALS } from './content/index.js';
import { createStateRouter } from './routes/state.js';

function ensureBootstrap(db, now) {
  const nowIso = now().toISOString();
  db.prepare("INSERT OR IGNORE INTO player (id, name, created_at) VALUES (1, '冒险者', ?)").run(nowIso);
  db.prepare("INSERT OR IGNORE INTO buildings (slot_index, building_key, level, built_at) VALUES (0, 'campfire', 1, ?)").run(nowIso);
  for (const m of MATERIALS) db.prepare('INSERT OR IGNORE INTO inventory (item_key, qty) VALUES (?, 0)').run(m.key);
}

export function createApp({ db, now = () => new Date(), rng = Math.random, staticDir = null }) {
  ensureBootstrap(db, now);
  const app = express();
  app.use(express.json());
  const deps = { db, now, rng };
  app.use('/api/state', createStateRouter(deps));
  if (staticDir) {
    app.use(express.static(staticDir));
    app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(staticDir, 'index.html')));
  }
  // 统一错误中间件(四参签名不可省)
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message || '服务器开小差了' });
  });
  return app;
}
```

- [ ] **Step 8: 运行确认通过并提交**

Run: `cd server && npx vitest run test/state.test.js`
Expected: PASS。

```bash
git add -A && git commit -m "feat(server): app 工厂、引导数据与 GET /api/state"
```

---

### Task 8: 每日委托懒生成与过期

**Files:**
- Create: `server/src/services/dailyQuests.js`
- Modify: `server/src/routes/state.js`(接入生成)
- Test: `server/test/daily.test.js`

- [ ] **Step 1: 写失败测试**

```js
// server/test/daily.test.js
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { makeTestApp } from './helpers.js';

describe('daily quests', () => {
  it('lazily generates exactly 3 daily quests (5/25/45 min) once per day', async () => {
    const { app } = makeTestApp();
    const r1 = await request(app).get('/api/state');
    const daily = r1.body.quests.filter(q => q.type === 'daily');
    expect(daily).toHaveLength(3);
    expect(daily.map(q => q.durationMin).sort((a, b) => a - b)).toEqual([5, 25, 45]);
    expect(daily.every(q => q.status === 'ready')).toBe(true);
    const r2 = await request(app).get('/api/state');
    expect(r2.body.quests.filter(q => q.type === 'daily')).toHaveLength(3);
  });

  it("expires yesterday's ready quests and generates new ones next day", async () => {
    const { app, db, clock } = makeTestApp();
    await request(app).get('/api/state');
    clock.current = new Date('2026-06-12T08:00:00');
    const res = await request(app).get('/api/state');
    expect(res.body.quests.filter(q => q.type === 'daily')).toHaveLength(3); // 只剩今天的
    expect(db.prepare("SELECT COUNT(*) AS c FROM quests WHERE status='expired'").get().c).toBe(3);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `cd server && npx vitest run test/daily.test.js`
Expected: FAIL(目前 daily quests 恒为空)。

- [ ] **Step 3: 实现 dailyQuests.js**

```js
// server/src/services/dailyQuests.js
import { QUEST_TEMPLATES } from '../content/index.js';
import { localDateStr } from '../utils/dates.js';

export function ensureDailyQuests(db, now, rng) {
  const today = localDateStr(now());
  const count = db.prepare("SELECT COUNT(*) AS c FROM quests WHERE type='daily' AND daily_date=?").get(today).c;
  if (count > 0) return;
  // 过去的、还没出发过的每日委托标记过期(active 的留给结算正常收尾)
  db.prepare("UPDATE quests SET status='expired' WHERE type='daily' AND status='ready' AND daily_date<?").run(today);
  const nowIso = now().toISOString();
  const ins = db.prepare(
    "INSERT INTO quests (title, type, duration_min, status, daily_date, created_at) VALUES (?, 'daily', ?, 'ready', ?, ?)"
  );
  for (const tpl of QUEST_TEMPLATES) {
    const title = tpl.titles[Math.floor(rng() * tpl.titles.length)];
    ins.run(title, tpl.durationMin, today, nowIso);
  }
}
```

- [ ] **Step 4: 接入 state.js**

在 `server/src/routes/state.js` 的 import 区追加:

```js
import { ensureDailyQuests } from '../services/dailyQuests.js';
```

在 `router.get('/', …)` 内 `const today = …` 一行**之前**插入:

```js
ensureDailyQuests(db, now, rng);
```

- [ ] **Step 5: 运行全部测试并提交**

Run: `cd server && npx vitest run`
Expected: 全部 PASS。

```bash
git add -A && git commit -m "feat(server): 每日委托懒生成与过期"
```

---

### Task 9: 自建委托与出发

**Files:**
- Modify: `server/src/routes/quests.js`(整文件替换,补全路由)
- Modify: `server/src/app.js`(挂载)
- Test: `server/test/quests.test.js`

- [ ] **Step 1: 写失败测试**

```js
// server/test/quests.test.js
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { makeTestApp } from './helpers.js';

describe('quests', () => {
  it('creates a custom quest', async () => {
    const { app } = makeTestApp();
    const res = await request(app).post('/api/quests').send({ title: '读《操作系统》', durationMin: 30, subjectTag: '读书' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ title: '读《操作系统》', type: 'custom', durationMin: 30, subjectTag: '读书', status: 'ready' });
  });

  it('validates input', async () => {
    const { app } = makeTestApp();
    expect((await request(app).post('/api/quests').send({ title: '', durationMin: 30 })).status).toBe(400);
    expect((await request(app).post('/api/quests').send({ title: 'x', durationMin: 3 })).status).toBe(400);
    expect((await request(app).post('/api/quests').send({ title: 'x', durationMin: 121 })).status).toBe(400);
    expect((await request(app).post('/api/quests').send({ title: 'x'.repeat(31), durationMin: 30 })).status).toBe(400);
  });

  it('starts a session and computes ends_at from duration', async () => {
    const { app } = makeTestApp();
    const q = (await request(app).post('/api/quests').send({ title: '晨读', durationMin: 25 })).body;
    const res = await request(app).post(`/api/quests/${q.id}/start`);
    expect(res.status).toBe(200);
    expect(new Date(res.body.endsAt).getTime() - new Date('2026-06-11T10:00:00').getTime()).toBe(25 * 60 * 1000);
    const state = (await request(app).get('/api/state')).body;
    expect(state.runningSession).toMatchObject({ questTitle: '晨读', questType: 'custom', durationMin: 25 });
  });

  it('rejects concurrent sessions and non-ready quests', async () => {
    const { app } = makeTestApp();
    const q1 = (await request(app).post('/api/quests').send({ title: 'a', durationMin: 25 })).body;
    const q2 = (await request(app).post('/api/quests').send({ title: 'b', durationMin: 25 })).body;
    await request(app).post(`/api/quests/${q1.id}/start`);
    expect((await request(app).post(`/api/quests/${q2.id}/start`)).status).toBe(409);
    expect((await request(app).post(`/api/quests/${q1.id}/start`)).status).toBe(409);
    expect((await request(app).post('/api/quests/999/start')).status).toBe(404);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `cd server && npx vitest run test/quests.test.js`
Expected: FAIL(404)。

- [ ] **Step 3: 整文件替换 routes/quests.js**

```js
// server/src/routes/quests.js
import { Router } from 'express';
import { HttpError } from '../utils/errors.js';

export function createQuestsRouter({ db, now }) {
  const router = Router();

  router.post('/', (req, res, next) => {
    try {
      const { title, durationMin, subjectTag } = req.body ?? {};
      if (typeof title !== 'string' || !title.trim() || title.trim().length > 30)
        throw new HttpError(400, '标题需为 1~30 个字');
      if (!Number.isInteger(durationMin) || durationMin < 5 || durationMin > 120)
        throw new HttpError(400, '时长需为 5~120 分钟的整数');
      const info = db.prepare(
        "INSERT INTO quests (title, type, duration_min, subject_tag, status, created_at) VALUES (?, 'custom', ?, ?, 'ready', ?)"
      ).run(title.trim(), durationMin, (typeof subjectTag === 'string' && subjectTag.trim()) || null, now().toISOString());
      const q = db.prepare('SELECT * FROM quests WHERE id=?').get(info.lastInsertRowid);
      res.json(toQuestJson(q));
    } catch (e) { next(e); }
  });

  router.post('/:id/start', (req, res, next) => {
    try {
      const quest = db.prepare('SELECT * FROM quests WHERE id=?').get(Number(req.params.id));
      if (!quest) throw new HttpError(404, '没有这个委托');
      if (quest.status !== 'ready') throw new HttpError(409, '这个委托不可出发');
      if (db.prepare("SELECT id FROM sessions WHERE status='running'").get())
        throw new HttpError(409, '已有进行中的冒险');
      const startedAt = now();
      const endsAt = new Date(startedAt.getTime() + quest.duration_min * 60_000);
      const info = db.transaction(() => {
        const r = db.prepare('INSERT INTO sessions (quest_id, started_at, ends_at) VALUES (?,?,?)')
          .run(quest.id, startedAt.toISOString(), endsAt.toISOString());
        db.prepare("UPDATE quests SET status='active' WHERE id=?").run(quest.id);
        return r;
      })();
      res.json({ sessionId: Number(info.lastInsertRowid), endsAt: endsAt.toISOString() });
    } catch (e) { next(e); }
  });

  return router;
}

export function toQuestJson(q) {
  return { id: q.id, title: q.title, type: q.type, durationMin: q.duration_min, subjectTag: q.subject_tag, status: q.status };
}
```

- [ ] **Step 4: 在 app.js 挂载**

import 区追加:

```js
import { createQuestsRouter } from './routes/quests.js';
```

在 `app.use('/api/state', …)` 之后追加:

```js
app.use('/api/quests', createQuestsRouter(deps));
```

- [ ] **Step 5: 运行全部测试并提交**

Run: `cd server && npx vitest run`
Expected: 全部 PASS。

```bash
git add -A && git commit -m "feat(server): 自建委托与出发(并发守卫)"
```

---

### Task 10: 结算与撤退(幂等 + 时间校验)

**Files:**
- Create: `server/src/services/settlement.js`, `server/src/routes/sessions.js`
- Modify: `server/src/app.js`(挂载)
- Test: `server/test/settlement.test.js`

- [ ] **Step 1: 写失败测试**

```js
// server/test/settlement.test.js
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { makeTestApp, seqRng } from './helpers.js';

async function startQuest(app, { title = '晨读', durationMin = 25 } = {}) {
  const q = (await request(app).post('/api/quests').send({ title, durationMin })).body;
  const s = (await request(app).post(`/api/quests/${q.id}/start`)).body;
  return { quest: q, sessionId: s.sessionId, endsAt: s.endsAt };
}

describe('settlement', () => {
  it('rejects completing before time is up', async () => {
    const { app, clock } = makeTestApp();
    const { sessionId } = await startQuest(app);
    clock.current = new Date('2026-06-11T10:10:00');
    expect((await request(app).post(`/api/sessions/${sessionId}/complete`)).status).toBe(409);
  });

  it('allows completion within the 30s tolerance and pays out', async () => {
    const { app, clock } = makeTestApp();
    const { sessionId } = await startQuest(app);
    clock.current = new Date('2026-06-11T10:24:35'); // 结束于 10:25,容差 30s
    const res = await request(app).post(`/api/sessions/${sessionId}/complete`);
    expect(res.status).toBe(200);
    const types = res.body.events.map(e => e.type);
    expect(types).toEqual(expect.arrayContaining(['exp', 'gold', 'material']));
    const state = (await request(app).get('/api/state')).body;
    expect(state.player.gold).toBe(25);
    expect(state.player.exp).toBe(50);
    expect(state.runningSession).toBeNull();
  });

  it('is idempotent: double complete returns same events and pays once', async () => {
    const { app, clock } = makeTestApp();
    const { sessionId } = await startQuest(app);
    clock.current = new Date('2026-06-11T11:00:00');
    const r1 = await request(app).post(`/api/sessions/${sessionId}/complete`);
    const r2 = await request(app).post(`/api/sessions/${sessionId}/complete`);
    expect(r2.status).toBe(200);
    expect(r2.body).toEqual(r1.body);
    expect((await request(app).get('/api/state')).body.player.gold).toBe(25);
  });

  it('stores egg drops; the new egg gains no progress in the same settlement', async () => {
    const rng = seqRng([
      0.5, 0.0, 0.5,  // 结算1:材料、掉蛋判定命中、稀有度 common(required 3)
      0.5, 0.99,      // 结算2:无蛋 → 孵化进度 1/3
    ]);
    const { app, clock } = makeTestApp({ rng });
    const a = await startQuest(app, { title: 'a' });
    clock.current = new Date('2026-06-11T11:00:00');
    const r1 = await request(app).post(`/api/sessions/${a.sessionId}/complete`);
    expect(r1.body.events.find(e => e.type === 'egg')).toBeTruthy();
    expect(r1.body.events.find(e => e.type === 'egg_progress')).toBeFalsy();

    const b = await startQuest(app, { title: 'b' });
    clock.current = new Date('2026-06-11T12:00:00');
    const r2 = await request(app).post(`/api/sessions/${b.sessionId}/complete`);
    expect(r2.body.events.find(e => e.type === 'egg_progress')).toMatchObject({ progress: 1, required: 3 });
  });

  it('hatches the egg and registers the creature', async () => {
    const rng = seqRng([
      0.5, 0.0, 0.5,   // 掉 common 蛋(required 3)
      0.5, 0.99,       // 进度 1
      0.5, 0.99,       // 进度 2
      0.5, 0.99, 0.0,  // 进度 3 → 孵化,取第一个未收集物种
    ]);
    const { app, clock } = makeTestApp({ rng });
    let last;
    for (let i = 0; i < 4; i++) {
      const s = await startQuest(app, { title: `q${i}` });
      clock.current = new Date(clock.current.getTime() + 60 * 60 * 1000);
      last = await request(app).post(`/api/sessions/${s.sessionId}/complete`);
    }
    const hatch = last.body.events.find(e => e.type === 'hatch');
    expect(hatch).toBeTruthy();
    expect(hatch.species.rarity).toBe('common');
    const state = (await request(app).get('/api/state')).body;
    expect(state.creatures).toHaveLength(1);
    expect(state.incubatingEgg).toBeNull();
  });

  it('incubates only the oldest egg when multiple are queued', async () => {
    const rng = seqRng([
      0.5, 0.0, 0.5,  // 结算1:掉蛋A(common)
      0.5, 0.0, 0.5,  // 结算2:掉蛋B;蛋A进度→1(新蛋B本次不吃进度)
      0.5, 0.99,      // 结算3:无蛋;蛋A进度→2
    ]);
    const { app, db, clock } = makeTestApp({ rng });
    for (let i = 0; i < 3; i++) {
      const s = await startQuest(app, { title: `m${i}` });
      clock.current = new Date(clock.current.getTime() + 60 * 60 * 1000);
      await request(app).post(`/api/sessions/${s.sessionId}/complete`);
    }
    const eggs = db.prepare('SELECT * FROM eggs ORDER BY id').all();
    expect(eggs).toHaveLength(2);
    expect(eggs[0].progress).toBe(2); // 最老的蛋吃进度
    expect(eggs[1].progress).toBe(0); // 排队的蛋不动
    const state = (await request(app).get('/api/state')).body;
    expect(state.incubatingEgg).toMatchObject({ id: eggs[0].id, progress: 2, queueCount: 2 });
  });

  it('abandon fails the quest with no rewards and frees the slot', async () => {
    const { app, db } = makeTestApp();
    const { sessionId, quest } = await startQuest(app);
    expect((await request(app).post(`/api/sessions/${sessionId}/abandon`)).status).toBe(200);
    const state = (await request(app).get('/api/state')).body;
    expect(state.player.gold).toBe(0);
    expect(state.runningSession).toBeNull();
    // 已失败的 custom 委托不再出现在 /api/state 列表,直接查库验证状态
    expect(db.prepare('SELECT status FROM quests WHERE id=?').get(quest.id).status).toBe('failed');
    expect((await request(app).post(`/api/sessions/${sessionId}/abandon`)).status).toBe(409);
    expect((await request(app).post(`/api/sessions/${sessionId}/complete`)).status).toBe(409);
  });

  it('updates pity counter across settlements', async () => {
    const { app, db, clock } = makeTestApp({ rng: seqRng([0.5, 0.99]) });
    const s = await startQuest(app);
    clock.current = new Date('2026-06-11T11:00:00');
    await request(app).post(`/api/sessions/${s.sessionId}/complete`);
    expect(db.prepare('SELECT pity_counter AS p FROM player WHERE id=1').get().p).toBe(1);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `cd server && npx vitest run test/settlement.test.js`
Expected: FAIL(404)。

- [ ] **Step 3: 实现 services/settlement.js**

```js
// server/src/services/settlement.js
import { HttpError } from '../utils/errors.js';
import { calculateSettlement } from './rewards.js';
import { aggregateBonuses } from './bonuses.js';
import { BUILDING_MAP } from '../content/index.js';

export function settleSession({ db, sessionId, now, rng }) {
  const session = db.prepare('SELECT * FROM sessions WHERE id=?').get(sessionId);
  if (!session) throw new HttpError(404, '没有这次冒险');
  if (session.status === 'completed') return JSON.parse(session.settlement_json); // 幂等
  if (session.status === 'abandoned') throw new HttpError(409, '该次冒险已撤退');
  if (now().getTime() < new Date(session.ends_at).getTime() - 30_000)
    throw new HttpError(409, '还没到凯旋时间');

  const quest = db.prepare('SELECT * FROM quests WHERE id=?').get(session.quest_id);
  const nowIso = now().toISOString();

  return db.transaction(() => {
    const player = db.prepare('SELECT * FROM player WHERE id=1').get();
    const buildings = db.prepare('SELECT building_key, level FROM buildings').all();
    const bonuses = aggregateBonuses(buildings, BUILDING_MAP);
    const incubatingEgg = db.prepare("SELECT * FROM eggs WHERE status='incubating' ORDER BY obtained_at, id LIMIT 1").get() || null;
    const collectedKeys = db.prepare('SELECT DISTINCT species_key FROM creatures').all().map(r => r.species_key);

    const { events, deltas } = calculateSettlement({
      durationMin: quest.duration_min, player, bonuses, incubatingEgg, collectedKeys, rng,
    });

    db.prepare('UPDATE player SET level=?, exp=?, gold=gold+?, pity_counter=?, last_completed_at=? WHERE id=1')
      .run(deltas.newLevel, deltas.newExp, deltas.goldGained, deltas.newPity, nowIso);
    db.prepare('UPDATE inventory SET qty=qty+? WHERE item_key=?').run(deltas.material.qty, deltas.material.key);
    if (deltas.eggProgress)
      db.prepare('UPDATE eggs SET progress=? WHERE id=?').run(deltas.eggProgress.progress, deltas.eggProgress.eggId);
    if (deltas.hatched) {
      db.prepare("UPDATE eggs SET status='hatched', progress=required WHERE id=?").run(deltas.hatched.eggId);
      db.prepare('INSERT INTO creatures (species_key, rarity, hatched_at) VALUES (?,?,?)')
        .run(deltas.hatched.species.key, deltas.hatched.species.rarity, nowIso);
    }
    // 新蛋最后入库:同一次结算不吃进度(规格 2.4)
    if (deltas.eggDropped)
      db.prepare('INSERT INTO eggs (rarity, required, obtained_at) VALUES (?,?,?)')
        .run(deltas.eggDropped.rarity, deltas.eggDropped.required, nowIso);
    db.prepare("UPDATE quests SET status='done' WHERE id=?").run(quest.id);
    const payload = { events };
    db.prepare("UPDATE sessions SET status='completed', completed_at=?, settlement_json=? WHERE id=?")
      .run(nowIso, JSON.stringify(payload), sessionId);
    return payload;
  })();
}
```

- [ ] **Step 4: 实现 routes/sessions.js 并挂载**

```js
// server/src/routes/sessions.js
import { Router } from 'express';
import { HttpError } from '../utils/errors.js';
import { settleSession } from '../services/settlement.js';

export function createSessionsRouter({ db, now, rng }) {
  const router = Router();

  router.post('/:id/complete', (req, res, next) => {
    try {
      res.json(settleSession({ db, sessionId: Number(req.params.id), now, rng }));
    } catch (e) { next(e); }
  });

  router.post('/:id/abandon', (req, res, next) => {
    try {
      const session = db.prepare('SELECT * FROM sessions WHERE id=?').get(Number(req.params.id));
      if (!session) throw new HttpError(404, '没有这次冒险');
      if (session.status !== 'running') throw new HttpError(409, '这次冒险已经结束了');
      db.transaction(() => {
        db.prepare("UPDATE sessions SET status='abandoned', completed_at=? WHERE id=?").run(now().toISOString(), session.id);
        db.prepare("UPDATE quests SET status='failed' WHERE id=?").run(session.quest_id);
      })();
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  return router;
}
```

app.js import 区追加 `import { createSessionsRouter } from './routes/sessions.js';`,挂载区追加:

```js
app.use('/api/sessions', createSessionsRouter(deps));
```

- [ ] **Step 5: 运行全部测试并提交**

Run: `cd server && npx vitest run`
Expected: 全部 PASS。

```bash
git add -A && git commit -m "feat(server): 结算/撤退路由(幂等+时间校验)"
```

---

### Task 11: 图鉴与统计接口

**Files:**
- Create: `server/src/routes/collection.js`, `server/src/routes/stats.js`
- Modify: `server/src/app.js`(挂载)
- Test: `server/test/collection-stats.test.js`

- [ ] **Step 1: 写失败测试**

```js
// server/test/collection-stats.test.js
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { makeTestApp } from './helpers.js';

describe('collection & stats', () => {
  it('lists all species as uncollected initially', async () => {
    const { app } = makeTestApp();
    const res = await request(app).get('/api/collection');
    expect(res.body.species).toHaveLength(24);
    expect(res.body.species.every(s => !s.collected)).toBe(true);
    expect(res.body.progress).toEqual({ collected: 0, total: 24 });
  });

  it('aggregates totals, week and subjects from completed sessions', async () => {
    const { app, clock } = makeTestApp();
    for (const [title, durationMin, subjectTag] of [['英语听力', 30, '英语'], ['刷题', 60, '算法'], ['再刷题', 30, '算法']]) {
      const q = (await request(app).post('/api/quests').send({ title, durationMin, subjectTag })).body;
      const s = (await request(app).post(`/api/quests/${q.id}/start`)).body;
      clock.current = new Date(new Date(s.endsAt).getTime() + 1000);
      await request(app).post(`/api/sessions/${s.sessionId}/complete`);
    }
    const res = await request(app).get('/api/stats');
    expect(res.body.totalMinutes).toBe(120);
    expect(res.body.totalSessions).toBe(3);
    expect(res.body.week).toHaveLength(7);
    expect(res.body.week[6].minutes).toBe(120); // 第 7 个是"今天"
    expect(res.body.subjects).toEqual([{ tag: '算法', minutes: 90 }, { tag: '英语', minutes: 30 }]);
    expect(res.body.collection.total).toBe(24);
    expect(res.body.buildingCount).toBe(1); // 篝火
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `cd server && npx vitest run test/collection-stats.test.js`
Expected: FAIL(404)。

- [ ] **Step 3: 实现 routes/collection.js**

```js
// server/src/routes/collection.js
import { Router } from 'express';
import { SPECIES } from '../content/index.js';

export function createCollectionRouter({ db }) {
  const router = Router();
  router.get('/', (req, res, next) => {
    try {
      const counts = Object.fromEntries(
        db.prepare('SELECT species_key, COUNT(*) AS c FROM creatures GROUP BY species_key').all().map(r => [r.species_key, r.c])
      );
      const species = SPECIES.map(s => ({ ...s, collected: !!counts[s.key], count: counts[s.key] || 0 }));
      res.json({ species, progress: { collected: Object.keys(counts).length, total: SPECIES.length } });
    } catch (e) { next(e); }
  });
  return router;
}
```

- [ ] **Step 4: 实现 routes/stats.js**

```js
// server/src/routes/stats.js
import { Router } from 'express';
import { SPECIES, TITLES } from '../content/index.js';
import { titleFor } from '../services/leveling.js';
import { localDateStr } from '../utils/dates.js';

export function createStatsRouter({ db, now }) {
  const router = Router();
  router.get('/', (req, res, next) => {
    try {
      const rows = db.prepare(
        "SELECT q.duration_min AS m, q.subject_tag AS tag, s.completed_at AS at FROM sessions s JOIN quests q ON q.id=s.quest_id WHERE s.status='completed'"
      ).all();
      const totalMinutes = rows.reduce((sum, r) => sum + r.m, 0);
      const week = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now().getTime() - i * 86400000);
        const ds = localDateStr(d);
        week.push({ date: ds, minutes: rows.filter(r => localDateStr(new Date(r.at)) === ds).reduce((s, r) => s + r.m, 0) });
      }
      const byTag = {};
      for (const r of rows) {
        const t = r.tag || '未分类';
        byTag[t] = (byTag[t] || 0) + r.m;
      }
      const player = db.prepare('SELECT * FROM player WHERE id=1').get();
      const collected = db.prepare('SELECT COUNT(DISTINCT species_key) AS c FROM creatures').get().c;
      const buildingCount = db.prepare('SELECT COUNT(*) AS c FROM buildings').get().c;
      res.json({
        totalMinutes,
        totalSessions: rows.length,
        level: player.level,
        title: titleFor(player.level, TITLES),
        week,
        subjects: Object.entries(byTag).map(([tag, minutes]) => ({ tag, minutes })).sort((a, b) => b.minutes - a.minutes),
        collection: { collected, total: SPECIES.length },
        buildingCount,
      });
    } catch (e) { next(e); }
  });
  return router;
}
```

- [ ] **Step 5: 挂载、运行全部测试并提交**

app.js import 区追加:

```js
import { createCollectionRouter } from './routes/collection.js';
import { createStatsRouter } from './routes/stats.js';
```

挂载区追加:

```js
app.use('/api/collection', createCollectionRouter(deps));
app.use('/api/stats', createStatsRouter(deps));
```

Run: `cd server && npx vitest run`
Expected: 全部 PASS。

```bash
git add -A && git commit -m "feat(server): 图鉴与统计接口"
```

---

### Task 12: 营地建造接口

**Files:**
- Create: `server/src/routes/buildings.js`
- Modify: `server/src/app.js`(挂载)
- Test: `server/test/buildings.test.js`

- [ ] **Step 1: 写失败测试**

```js
// server/test/buildings.test.js
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { makeTestApp, grant } from './helpers.js';

describe('buildings', () => {
  it('rejects building without materials', async () => {
    const { app } = makeTestApp();
    const res = await request(app).post('/api/buildings').send({ slotIndex: 1, buildingKey: 'tent' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('材料不足');
  });

  it('builds, deducts cost, then upgrades with level-scaled cost', async () => {
    const { app, db } = makeTestApp();
    grant(db, 'wood', 100);
    const b1 = await request(app).post('/api/buildings').send({ slotIndex: 1, buildingKey: 'tent' });
    expect(b1.body).toEqual({ slotIndex: 1, buildingKey: 'tent', level: 1 });
    expect(db.prepare("SELECT qty FROM inventory WHERE item_key='wood'").get().qty).toBe(95);  // 5×1
    const b2 = await request(app).post('/api/buildings').send({ slotIndex: 1, buildingKey: 'tent' });
    expect(b2.body.level).toBe(2);
    expect(db.prepare("SELECT qty FROM inventory WHERE item_key='wood'").get().qty).toBe(85);  // 再扣 5×2
  });

  it('enforces slot and level rules', async () => {
    const { app, db } = makeTestApp();
    grant(db, 'wood', 999); grant(db, 'stone', 999);
    expect((await request(app).post('/api/buildings').send({ slotIndex: 0, buildingKey: 'tent' })).status).toBe(400);     // 篝火地块
    expect((await request(app).post('/api/buildings').send({ slotIndex: 1, buildingKey: 'campfire' })).status).toBe(400); // 不可建
    expect((await request(app).post('/api/buildings').send({ slotIndex: 9, buildingKey: 'tent' })).status).toBe(400);     // 越界
    await request(app).post('/api/buildings').send({ slotIndex: 1, buildingKey: 'tent' });
    expect((await request(app).post('/api/buildings').send({ slotIndex: 1, buildingKey: 'library' })).status).toBe(400);  // 已有其他建筑
    await request(app).post('/api/buildings').send({ slotIndex: 1, buildingKey: 'tent' }); // Lv2
    await request(app).post('/api/buildings').send({ slotIndex: 1, buildingKey: 'tent' }); // Lv3
    expect((await request(app).post('/api/buildings').send({ slotIndex: 1, buildingKey: 'tent' })).status).toBe(400);     // 满级
  });

  it('building bonuses affect settlement', async () => {
    const { app, db, clock } = makeTestApp();
    grant(db, 'wood', 100); grant(db, 'stone', 100);
    await request(app).post('/api/buildings').send({ slotIndex: 1, buildingKey: 'library' }); // EXP +5%
    const q = (await request(app).post('/api/quests').send({ title: '晨读', durationMin: 20 })).body;
    const s = (await request(app).post(`/api/quests/${q.id}/start`)).body;
    clock.current = new Date(new Date(s.endsAt).getTime() + 1000);
    const res = await request(app).post(`/api/sessions/${s.sessionId}/complete`);
    expect(res.body.events.find(e => e.type === 'exp').amount).toBe(42); // 40 × 1.05
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `cd server && npx vitest run test/buildings.test.js`
Expected: FAIL(404)。

- [ ] **Step 3: 实现 routes/buildings.js**

```js
// server/src/routes/buildings.js
import { Router } from 'express';
import { HttpError } from '../utils/errors.js';
import { BUILDING_MAP, MATERIAL_MAP } from '../content/index.js';

export function createBuildingsRouter({ db, now }) {
  const router = Router();

  router.post('/', (req, res, next) => {
    try {
      const { slotIndex, buildingKey } = req.body ?? {};
      if (!Number.isInteger(slotIndex) || slotIndex < 1 || slotIndex > 7)
        throw new HttpError(400, '无效地块(1~7)');
      const def = BUILDING_MAP[buildingKey];
      if (!def || !def.buildable) throw new HttpError(400, '无效建筑');
      const existing = db.prepare('SELECT * FROM buildings WHERE slot_index=?').get(slotIndex);
      if (existing && existing.building_key !== buildingKey)
        throw new HttpError(400, '该地块已有其他建筑');
      if (existing && existing.level >= 3) throw new HttpError(400, '已达最高等级');
      const targetLevel = existing ? existing.level + 1 : 1;
      const cost = Object.entries(def.baseCost).map(([key, base]) => ({ key, qty: base * targetLevel }));

      db.transaction(() => {
        for (const c of cost) {
          const row = db.prepare('SELECT qty FROM inventory WHERE item_key=?').get(c.key);
          if (!row || row.qty < c.qty)
            throw new HttpError(400, `材料不足:${MATERIAL_MAP[c.key].name} 需要 ${c.qty}`);
        }
        for (const c of cost) db.prepare('UPDATE inventory SET qty=qty-? WHERE item_key=?').run(c.qty, c.key);
        if (existing) db.prepare('UPDATE buildings SET level=? WHERE id=?').run(targetLevel, existing.id);
        else db.prepare('INSERT INTO buildings (slot_index, building_key, level, built_at) VALUES (?,?,1,?)')
          .run(slotIndex, buildingKey, now().toISOString());
      })();

      res.json({ slotIndex, buildingKey, level: targetLevel });
    } catch (e) { next(e); }
  });

  return router;
}
```

- [ ] **Step 4: 挂载、运行全部测试并提交**

app.js import 区追加 `import { createBuildingsRouter } from './routes/buildings.js';`,挂载区追加:

```js
app.use('/api/buildings', createBuildingsRouter(deps));
```

Run: `cd server && npx vitest run`
Expected: 全部 PASS。

```bash
git add -A && git commit -m "feat(server): 营地建造接口"
```

---

### Task 13: 回归礼包

**Files:**
- Create: `server/src/services/welcomeBack.js`
- Modify: `server/src/routes/state.js`(接入)
- Test: `server/test/welcome.test.js`

- [ ] **Step 1: 写失败测试**

```js
// server/test/welcome.test.js
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { makeTestApp } from './helpers.js';

describe('welcome back gift', () => {
  it('grants a gift after 3+ days away, once per day', async () => {
    const { app, db } = makeTestApp();
    db.prepare("UPDATE player SET last_completed_at='2026-06-01T10:00:00.000Z' WHERE id=1").run();
    const r1 = await request(app).get('/api/state');
    expect(r1.body.welcomeBack).toBeTruthy();
    expect(r1.body.welcomeBack.gold).toBe(200);
    expect(r1.body.welcomeBack.materials.reduce((s, m) => s + m.qty, 0)).toBe(5);
    expect(r1.body.player.gold).toBe(200); // 已入账
    const r2 = await request(app).get('/api/state');
    expect(r2.body.welcomeBack).toBeNull();
    expect(r2.body.player.gold).toBe(200); // 不重复发
  });

  it('does not trigger for fresh players or recent activity', async () => {
    const { app, db } = makeTestApp();
    expect((await request(app).get('/api/state')).body.welcomeBack).toBeNull();
    db.prepare("UPDATE player SET last_completed_at='2026-06-10T10:00:00.000Z' WHERE id=1").run();
    expect((await request(app).get('/api/state')).body.welcomeBack).toBeNull();
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `cd server && npx vitest run test/welcome.test.js`
Expected: FAIL(welcomeBack 恒为 null,第一用例失败)。

- [ ] **Step 3: 实现 services/welcomeBack.js**

```js
// server/src/services/welcomeBack.js
import { pickWeighted } from './rng.js';
import { MATERIALS, MATERIAL_MAP } from '../content/index.js';
import { localDateStr } from '../utils/dates.js';

const GIFT_GOLD = 200;
const GIFT_MATERIAL_COUNT = 5;
const AWAY_DAYS = 3;

export function checkWelcomeBack(db, now, rng) {
  const player = db.prepare('SELECT * FROM player WHERE id=1').get();
  if (!player?.last_completed_at) return null;
  const daysAway = (now().getTime() - new Date(player.last_completed_at).getTime()) / 86400000;
  if (daysAway < AWAY_DAYS) return null;
  const today = localDateStr(now());
  const claimed = db.prepare("SELECT value FROM settings WHERE key='welcome_back_date'").get();
  if (claimed?.value === today) return null;

  const gained = {};
  for (let i = 0; i < GIFT_MATERIAL_COUNT; i++) {
    const mat = pickWeighted(rng, MATERIALS.map(m => ({ value: m, weight: m.weight })));
    gained[mat.key] = (gained[mat.key] || 0) + 1;
  }
  db.transaction(() => {
    db.prepare('UPDATE player SET gold=gold+? WHERE id=1').run(GIFT_GOLD);
    for (const [key, qty] of Object.entries(gained))
      db.prepare('UPDATE inventory SET qty=qty+? WHERE item_key=?').run(qty, key);
    db.prepare(
      "INSERT INTO settings (key, value) VALUES ('welcome_back_date', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value"
    ).run(today);
  })();

  return {
    gold: GIFT_GOLD,
    materials: Object.entries(gained).map(([key, qty]) => ({ key, name: MATERIAL_MAP[key].name, emoji: MATERIAL_MAP[key].emoji, qty })),
  };
}
```

- [ ] **Step 4: 接入 state.js**

import 区追加:

```js
import { checkWelcomeBack } from '../services/welcomeBack.js';
```

把 `const welcomeBack = null; // T13 替换为 checkWelcomeBack(db, now, rng)` 替换为:

```js
const welcomeBack = checkWelcomeBack(db, now, rng);
```

(保持在 `ensureDailyQuests(db, now, rng);` 之后、`const player = …` 之前——礼包先入账,本次响应里的 gold 才是最新值。)

- [ ] **Step 5: 运行全部测试并提交**

Run: `cd server && npx vitest run`
Expected: 全部 PASS。

```bash
git add -A && git commit -m "feat(server): 回归礼包"
```

---

### Task 14: 服务器生产入口(静态托管 + 启动备份)

**Files:**
- Create: `server/src/db/backup.js`
- Modify: `server/src/index.js`(整文件替换)

- [ ] **Step 1: 写 db/backup.js**

```js
// server/src/db/backup.js
import { copyFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { DATA_DIR, DB_PATH } from './index.js';

const KEEP = 3;

export function backupDb() {
  if (!existsSync(DB_PATH)) return;
  const dir = path.join(DATA_DIR, 'backups');
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  copyFileSync(DB_PATH, path.join(dir, `app-${stamp}.db`));
  const files = readdirSync(dir).filter(f => f.startsWith('app-') && f.endsWith('.db')).sort();
  while (files.length > KEEP) unlinkSync(path.join(dir, files.shift()));
}
```

- [ ] **Step 2: 整文件替换 server/src/index.js**

```js
// server/src/index.js
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createDb, DATA_DIR, DB_PATH } from './db/index.js';
import { backupDb } from './db/backup.js';
import { createApp } from './app.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

mkdirSync(DATA_DIR, { recursive: true });
backupDb();
const db = createDb(DB_PATH);
const staticDir = path.resolve(__dirname, '../../client/dist');
const app = createApp({ db, staticDir });
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🏕️ 星夜营地: http://localhost:${PORT}`));
```

- [ ] **Step 3: 手动验证**

Run: `npm run build && npm start`
Expected: 控制台输出 `🏕️ 星夜营地: http://localhost:3001`;浏览器开 `http://localhost:3001/api/state` 返回 JSON;`data/app.db` 已生成。重启一次后 `data/backups/` 出现备份。验证完 Ctrl+C。

- [ ] **Step 4: 提交**

```bash
git add -A && git commit -m "feat(server): 生产入口(静态托管+启动备份)"
```

---

### Task 15: 前端基础骨架(主题/状态/布局/导航)

**Files:**
- Replace: `client/vite.config.js`, `client/index.html`, `client/src/main.jsx`, `client/src/App.jsx`
- Create: `client/src/test-setup.js`, `client/src/theme/theme.css`, `client/src/theme/ThemeContext.jsx`
- Create: `client/src/api/client.js`, `client/src/state/GameStateContext.jsx`, `client/src/utils/rarity.js`
- Create: `client/src/components/Layout.jsx`, `TopBar.jsx`, `NavBar.jsx`, `Toast.jsx`
- Create: 简版页 `client/src/pages/Camp.jsx`, `Adventure.jsx`, `Collection.jsx`, `Stats.jsx`(T16/T17/T20 整文件替换)
- Delete: `client/src/App.css`, `client/src/index.css`, `client/src/assets/`, `client/public/`

- [ ] **Step 1: 清理模板并替换配置**

Run: `rm -f client/src/App.css client/src/index.css && rm -rf client/src/assets client/public`

```js
// client/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:3001' } },
  test: { environment: 'jsdom', setupFiles: './src/test-setup.js', globals: true },
});
```

```html
<!-- client/index.html -->
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏕️</text></svg>" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>星夜营地</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

```js
// client/src/test-setup.js
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 2: 写 theme.css(完整,含后续任务全部样式类,一次写全)**

```css
/* client/src/theme/theme.css */
:root[data-theme='night'] {
  --bg: #0f1626; --bg-soft: #141d33; --card: #1a2336; --card-2: #232f4a;
  --border: #2a3a5c; --text: #e6ecf7; --text-dim: #8a94aa;
  --gold: #d8b36a; --gold-ink: #1a1408; --purple: #8d7bb8;
  --danger: #c46a6a; --glow: 0 0 18px rgba(216, 179, 106, .25);
  --sky-top: #0c1224; --sky-bottom: #1d2a45; --ground: #1a2b22;
}
:root[data-theme='day'] {
  --bg: #f4ead8; --bg-soft: #f9f2e4; --card: #fffaf0; --card-2: #efe4cc;
  --border: #e0d3b8; --text: #4a4233; --text-dim: #95896f;
  --gold: #c89b4a; --gold-ink: #fffaf0; --purple: #9a86c8;
  --danger: #c46a6a; --glow: 0 0 14px rgba(200, 155, 74, .25);
  --sky-top: #bfdcec; --sky-bottom: #efe0bc; --ground: #b9d3a0;
}

* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text); font-family: system-ui, 'Microsoft YaHei', sans-serif; transition: background .6s, color .6s; }
button { font-family: inherit; }
h2, h3 { margin: 10px 0; }
small, .dim { color: var(--text-dim); font-size: 12px; }

.card { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 14px; }
.btn { background: var(--gold); color: var(--gold-ink); border: 0; border-radius: 10px; padding: 8px 16px; font-weight: 700; cursor: pointer; font-size: 14px; }
.btn:disabled { opacity: .4; cursor: not-allowed; }
.btn-big { font-size: 18px; padding: 12px 32px; }
.btn-ghost { background: transparent; color: var(--text-dim); border: 1px solid var(--border); border-radius: 10px; padding: 6px 12px; cursor: pointer; }
.input { width: 100%; background: var(--card-2); border: 1px solid var(--border); border-radius: 10px; padding: 8px 10px; color: var(--text); margin: 6px 0; font-size: 14px; }
.bar { background: var(--card-2); border-radius: 8px; height: 10px; overflow: hidden; }
.bar > div { background: linear-gradient(90deg, var(--purple), var(--gold)); height: 100%; border-radius: 8px; transition: width .5s; }

.rarity-common { color: var(--text-dim); }
.rarity-rare { color: #7da7e8; text-shadow: 0 0 8px rgba(125, 167, 232, .35); }
.rarity-epic { color: #b08aff; text-shadow: 0 0 12px rgba(176, 138, 255, .45); }
.rarity-legendary { color: var(--gold); text-shadow: var(--glow); }

.splash { display: flex; align-items: center; justify-content: center; min-height: 100vh; font-size: 18px; }
.layout { max-width: 1100px; margin: 0 auto; padding: 12px 16px 70px; }
.page { margin-top: 12px; }

.topbar { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.topbar-id { display: flex; gap: 10px; align-items: center; min-width: 240px; }
.topbar-avatar { font-size: 30px; }
.exp-bar { width: 180px; margin: 4px 0 2px; }
.topbar-res { display: flex; gap: 14px; font-weight: 600; color: var(--gold); flex-wrap: wrap; }

.navbar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; justify-content: center; align-items: center; gap: 8px; padding: 8px; background: var(--bg-soft); border-top: 1px solid var(--border); z-index: 20; }
.navbar a { color: var(--text-dim); text-decoration: none; padding: 8px 18px; border-radius: 10px; font-weight: 600; }
.navbar a.active { color: var(--text); background: var(--card-2); }
.nav-gear { background: none; border: none; font-size: 18px; cursor: pointer; }
.settings-pop { position: fixed; bottom: 58px; right: 16px; display: flex; flex-direction: column; gap: 10px; z-index: 30; }
.settings-pop label { display: flex; justify-content: space-between; gap: 12px; align-items: center; font-size: 14px; }
.settings-pop select { background: var(--card-2); color: var(--text); border: 1px solid var(--border); border-radius: 8px; padding: 4px 8px; }

.camp-split { display: grid; grid-template-columns: 1.4fr 1fr; gap: 14px; }
@media (max-width: 900px) { .camp-split { grid-template-columns: 1fr; } }
.panel-title { margin: 6px 0; }
.quest-panel { display: flex; flex-direction: column; gap: 8px; }
.quest-card { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 10px 12px; }
.quest-main { display: flex; flex-direction: column; gap: 2px; }
.quest-done { opacity: .55; }
.quest-badge { font-size: 18px; }
.quest-add { border-style: dashed; padding: 10px; }
.egg-card { margin-top: 4px; display: flex; flex-direction: column; gap: 6px; }

.scene-placeholder { display: flex; align-items: center; justify-content: center; min-height: 280px; font-size: 18px; }
.scene { position: relative; min-height: 420px; border-radius: 14px; border: 1px solid var(--border); overflow: hidden;
  background: linear-gradient(180deg, var(--sky-top) 0%, var(--sky-bottom) 62%, var(--ground) 62%, var(--ground) 100%); }
.scene-sky { position: absolute; inset: 0 0 38% 0; }
.star { position: absolute; width: 3px; height: 3px; border-radius: 50%; background: #fff; opacity: .8; animation: twinkle 2.4s ease-in-out infinite; }
[data-theme='day'] .star { display: none; }
@keyframes twinkle { 0%, 100% { opacity: .15; } 50% { opacity: .9; } }
.scene-sign { position: absolute; right: 8%; top: 8%; font-size: 34px; }
.only-day { display: none; }
[data-theme='day'] .only-day { display: inline; }
[data-theme='day'] .only-night { display: none; }
.slot { position: absolute; transform: translate(-50%, -50%); background: none; border: none; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; gap: 2px; color: var(--text); padding: 0; }
.slot-emoji { font-size: 34px; filter: drop-shadow(0 2px 6px rgba(0, 0, 0, .35)); }
.slot-label { font-size: 11px; background: rgba(0, 0, 0, .35); color: #fff; border-radius: 6px; padding: 1px 6px; white-space: nowrap; }
[data-theme='day'] .slot-label { background: rgba(255, 255, 255, .55); color: #4a4233; }
.slot-empty .slot-plus { width: 34px; height: 34px; border: 2px dashed rgba(255, 255, 255, .35); border-radius: 50%;
  display: flex; align-items: center; justify-content: center; color: rgba(255, 255, 255, .55); font-size: 18px; }
[data-theme='day'] .slot-empty .slot-plus { border-color: rgba(0, 0, 0, .25); color: rgba(0, 0, 0, .35); }
.slot-campfire .slot-emoji { animation: fireglow 2.2s ease-in-out infinite; }
@keyframes fireglow {
  0%, 100% { filter: drop-shadow(0 0 6px rgba(255, 160, 60, .55)); }
  50% { filter: drop-shadow(0 0 16px rgba(255, 160, 60, .9)); }
}
.scene-creatures { position: absolute; bottom: 8px; left: 12px; right: 12px; display: flex; gap: 10px; flex-wrap: wrap; }
.creature { font-size: 24px; animation: floaty 3.2s ease-in-out infinite; cursor: default; }
@keyframes floaty { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }

.adventure { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
  background: radial-gradient(ellipse at 50% 28%, var(--sky-bottom), var(--sky-top)); text-align: center; padding: 20px; }
.timer-ring { position: relative; }
.timer-label { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 34px; font-weight: 700; color: var(--gold); }
.adventure-buddy { font-size: 36px; animation: floaty 3.2s ease-in-out infinite; }
.retreat { opacity: .5; margin-top: 16px; }
.error-line { color: var(--danger); }

.reward-mask { position: fixed; inset: 0; background: rgba(8, 12, 24, .8); display: flex; align-items: center; justify-content: center; z-index: 50; }
.reward-panel { width: min(440px, 92vw); display: flex; flex-direction: column; gap: 10px; text-align: center; padding: 22px; }
.reward-title { color: var(--gold); margin: 0 0 6px; }
.reward-item { background: var(--card-2); border-radius: 10px; padding: 10px; font-weight: 600; }
.reward-icon { font-size: 18px; margin-right: 6px; }
.reward-actions { display: flex; justify-content: center; gap: 10px; margin-top: 8px; }

.modal-mask { position: fixed; inset: 0; background: rgba(8, 12, 24, .6); display: flex; align-items: center; justify-content: center; z-index: 40; }
.modal { width: min(420px, 92vw); display: flex; flex-direction: column; gap: 8px; max-height: 80vh; overflow-y: auto; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
.tag-row { display: flex; gap: 6px; flex-wrap: wrap; }
.tag { padding: 3px 10px; font-size: 12px; }
.build-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 10px; }

.dex-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; margin: 8px 0 16px; }
.dex-card { display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; padding: 12px 8px; }
.dex-emoji { font-size: 34px; }
.dex-locked { opacity: .45; filter: grayscale(.8); }

.stat-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin-bottom: 12px; }
.stat-card { text-align: center; display: flex; flex-direction: column; gap: 4px; font-size: 20px; }
.week-bars { display: flex; align-items: flex-end; gap: 8px; height: 140px; padding-top: 10px; }
.week-col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 4px; height: 100%; }
.week-bar { width: 70%; background: linear-gradient(180deg, var(--gold), var(--purple)); border-radius: 6px 6px 0 0; min-height: 2px; }
.week-num { font-size: 10px; }
.subject-row { display: flex; align-items: center; gap: 10px; margin: 6px 0; }
.subject-tag { min-width: 64px; font-size: 13px; }
.subject-bar { flex: 1; }

.toast-stack { position: fixed; bottom: 70px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; gap: 6px; z-index: 60; }
.toast { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 9px 16px; box-shadow: 0 4px 14px rgba(0, 0, 0, .3); }
```

- [ ] **Step 3: 写 ThemeContext / api client / GameState / rarity**

```jsx
// client/src/theme/ThemeContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';

export function resolveTheme(mode, hour) {
  if (mode === 'day' || mode === 'night') return mode;
  return hour >= 6 && hour < 18 ? 'day' : 'night';
}

const ThemeCtx = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('theme_mode') || 'auto');
  useEffect(() => {
    localStorage.setItem('theme_mode', mode);
    const apply = () => { document.documentElement.dataset.theme = resolveTheme(mode, new Date().getHours()); };
    apply();
    const t = setInterval(apply, 60_000);
    return () => clearInterval(t);
  }, [mode]);
  return <ThemeCtx.Provider value={{ mode, setMode }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
```

```js
// client/src/api/client.js
export async function api(path, options = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error('信号不佳,联系不上营地');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `请求失败 (${res.status})`);
  return data;
}
```

```jsx
// client/src/state/GameStateContext.jsx
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api/client.js';

const Ctx = createContext(null);

export function GameStateProvider({ children }) {
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const refresh = useCallback(async () => {
    try {
      setState(await api('/state'));
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return <Ctx.Provider value={{ state, refresh, error }}>{children}</Ctx.Provider>;
}

export const useGame = () => useContext(Ctx);
```

```js
// client/src/utils/rarity.js
export const RARITY_NAMES = { common: '寻常', rare: '稀有', epic: '史诗', legendary: '传说' };
```

- [ ] **Step 4: 写 Toast / TopBar / NavBar / Layout**

```jsx
// client/src/components/Toast.jsx
import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);
  const show = useCallback((message) => {
    const id = ++idRef.current;
    setToasts(t => [...t, { id, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);
  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div className="toast-stack">
        {toasts.map(t => <div key={t.id} className="toast">{t.message}</div>)}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
```

```jsx
// client/src/components/TopBar.jsx
import { useGame } from '../state/GameStateContext.jsx';

export default function TopBar() {
  const { state } = useGame();
  const { player, resources } = state;
  const pct = Math.round((player.exp / player.expToNext) * 100);
  return (
    <header className="topbar card">
      <div className="topbar-id">
        <span className="topbar-avatar">🧙</span>
        <div>
          <b>{player.title} · Lv{player.level}</b>
          <div className="bar exp-bar"><div style={{ width: `${pct}%` }} /></div>
          <small className="dim">EXP {player.exp}/{player.expToNext}</small>
        </div>
      </div>
      <div className="topbar-res">
        <span>🪙 {player.gold}</span>
        {resources.map(r => <span key={r.key} title={r.name}>{r.emoji} {r.qty}</span>)}
      </div>
    </header>
  );
}
```

```jsx
// client/src/components/NavBar.jsx(T21 整文件替换加设置面板)
import { NavLink } from 'react-router-dom';

export default function NavBar() {
  return (
    <nav className="navbar">
      <NavLink to="/" end>🏕️ 营地</NavLink>
      <NavLink to="/collection">📖 图鉴</NavLink>
      <NavLink to="/stats">📊 统计</NavLink>
    </nav>
  );
}
```

```jsx
// client/src/components/Layout.jsx
import { Outlet } from 'react-router-dom';
import TopBar from './TopBar.jsx';
import NavBar from './NavBar.jsx';
import { useGame } from '../state/GameStateContext.jsx';

export default function Layout() {
  const { state, error } = useGame();
  if (error && !state) return <div className="splash">📡 {error} —— 请确认后端已启动(npm run dev)</div>;
  if (!state) return <div className="splash">🔥 正在点亮篝火…</div>;
  return (
    <div className="layout">
      <TopBar />
      <main className="page"><Outlet /></main>
      <NavBar />
    </div>
  );
}
```

- [ ] **Step 5: 写简版页与 App/main**

```jsx
// client/src/pages/Camp.jsx(T16 整文件替换为完整版)
export default function Camp() {
  return <section className="card scene-placeholder">🏕️ 营地一切如常。</section>;
}
```

```jsx
// client/src/pages/Adventure.jsx(T17 整文件替换为完整版)
export default function Adventure() {
  return <div className="adventure">⚔️ 整装待发。</div>;
}
```

```jsx
// client/src/pages/Collection.jsx(T20 整文件替换为完整版)
export default function Collection() {
  return <p className="dim">📖 图鉴空空如也。</p>;
}
```

```jsx
// client/src/pages/Stats.jsx(T20 整文件替换为完整版)
export default function Stats() {
  return <p className="dim">📊 还没有战绩。</p>;
}
```

```jsx
// client/src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameStateProvider } from './state/GameStateContext.jsx';
import { ThemeProvider } from './theme/ThemeContext.jsx';
import { ToastProvider } from './components/Toast.jsx';
import Layout from './components/Layout.jsx';
import Camp from './pages/Camp.jsx';
import Adventure from './pages/Adventure.jsx';
import Collection from './pages/Collection.jsx';
import Stats from './pages/Stats.jsx';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <GameStateProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/adventure" element={<Adventure />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Camp />} />
                <Route path="collection" element={<Collection />} />
                <Route path="stats" element={<Stats />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </GameStateProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
```

```jsx
// client/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './theme/theme.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
);
```

- [ ] **Step 6: 手动验证**

Run: `npm run dev`
Expected: `http://localhost:5173` 显示顶栏(见习学者 Lv1、🪙0、四种材料 0)、营地简版卡、底部导航三页可切换;主题随本地时间呈日/夜配色。验证完 Ctrl+C。

- [ ] **Step 7: 提交**

```bash
git add -A && git commit -m "feat(client): 基础骨架(主题/状态/布局/导航)"
```

---

### Task 16: 营地页与委托流

**Files:**
- Create: `client/src/components/QuestCard.jsx`, `client/src/components/CreateQuestModal.jsx`
- Replace: `client/src/pages/Camp.jsx`

- [ ] **Step 1: 写 QuestCard.jsx**

```jsx
// client/src/components/QuestCard.jsx
export default function QuestCard({ quest, onStart }) {
  const done = quest.status === 'done';
  const failed = quest.status === 'failed' || quest.status === 'expired';
  return (
    <div className={`card quest-card${done ? ' quest-done' : ''}`}>
      <div className="quest-main">
        <b>📜 {quest.title}</b>
        <small className="dim">
          {quest.durationMin} 分钟{quest.subjectTag ? ` · ${quest.subjectTag}` : ''} · 预期 ✨{quest.durationMin * 2} 🪙{quest.durationMin} 📦×{1 + Math.floor(quest.durationMin / 15)}
        </small>
      </div>
      {done ? <span className="quest-badge">✅</span>
        : failed ? <span className="quest-badge dim">✖</span>
        : <button className="btn" onClick={() => onStart(quest)}>出发</button>}
    </div>
  );
}
```

- [ ] **Step 2: 写 CreateQuestModal.jsx**

```jsx
// client/src/components/CreateQuestModal.jsx
import { useState } from 'react';
import { api } from '../api/client.js';
import { useGame } from '../state/GameStateContext.jsx';
import { useToast } from './Toast.jsx';

const TAG_SUGGESTIONS = ['英语', '算法', '阅读', '数学', '写作'];

export default function CreateQuestModal({ onClose }) {
  const { refresh } = useGame();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(25);
  const [tag, setTag] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!title.trim()) { toast.show('给委托起个名字吧'); return; }
    setBusy(true);
    try {
      await api('/quests', { method: 'POST', body: { title: title.trim(), durationMin: duration, subjectTag: tag.trim() || null } });
      await refresh();
      onClose();
    } catch (e) {
      toast.show(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal card" onClick={e => e.stopPropagation()}>
        <h3>新的委托</h3>
        <input className="input" maxLength={30} placeholder="比如:读《操作系统》第3章"
          value={title} onChange={e => setTitle(e.target.value)} autoFocus />
        <label className="dim">时长:{duration} 分钟</label>
        <input type="range" min={5} max={120} step={5} value={duration} onChange={e => setDuration(Number(e.target.value))} />
        <input className="input" placeholder="学科标签(可选)" value={tag} onChange={e => setTag(e.target.value)} />
        <div className="tag-row">
          {TAG_SUGGESTIONS.map(t => <button key={t} className="btn-ghost tag" onClick={() => setTag(t)}>{t}</button>)}
        </div>
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>取消</button>
          <button className="btn" disabled={busy} onClick={submit}>创建</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 整文件替换 Camp.jsx(场景区暂为简单卡片,T19 换 CampScene)**

```jsx
// client/src/pages/Camp.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../state/GameStateContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { api } from '../api/client.js';
import QuestCard from '../components/QuestCard.jsx';
import CreateQuestModal from '../components/CreateQuestModal.jsx';

export default function Camp() {
  const { state, refresh } = useGame();
  const toast = useToast();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (state.runningSession) navigate('/adventure');
  }, [state.runningSession, navigate]);

  useEffect(() => {
    if (state.welcomeBack) {
      const mats = state.welcomeBack.materials.reduce((s, m) => s + m.qty, 0);
      toast.show(`🦊 伙伴们想你了!回归礼包:🪙${state.welcomeBack.gold} + 材料×${mats}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startQuest(quest) {
    try {
      await api(`/quests/${quest.id}/start`, { method: 'POST' });
      await refresh();
      navigate('/adventure');
    } catch (e) {
      toast.show(e.message);
    }
  }

  const daily = state.quests.filter(q => q.type === 'daily');
  const custom = state.quests.filter(q => q.type === 'custom');
  const egg = state.incubatingEgg;

  return (
    <div className="camp-split">
      <section className="card scene-placeholder">🏕️ {state.creatures.map(c => c.emoji).join(' ') || '营地静悄悄的…'}</section>
      <section className="quest-panel">
        <h3 className="panel-title">📜 今日委托</h3>
        {daily.map(q => <QuestCard key={q.id} quest={q} onStart={startQuest} />)}
        <h3 className="panel-title">🗺️ 自由委托</h3>
        {custom.map(q => <QuestCard key={q.id} quest={q} onStart={startQuest} />)}
        <button className="btn-ghost quest-add" onClick={() => setShowCreate(true)}>＋ 自建委托</button>
        {egg && (
          <div className="card egg-card">
            <span>🥚 <b className={`rarity-${egg.rarity}`}>孵化中</b>{egg.queueCount > 1 ? <small className="dim"> · 队列 {egg.queueCount}</small> : null}</span>
            <div className="bar"><div style={{ width: `${(egg.progress / egg.required) * 100}%` }} /></div>
            <small className="dim">再专注 {egg.required - egg.progress} 次就孵出来了!</small>
          </div>
        )}
        {showCreate && <CreateQuestModal onClose={() => setShowCreate(false)} />}
      </section>
    </div>
  );
}
```

- [ ] **Step 4: 手动验证**

Run: `npm run dev`
Expected: 右栏 3 个今日委托(5/25/45 分钟)+ 自建按钮;创建自建委托后出现在列表;点「出发」跳到冒险简版页(完整冒险页 T17)。

- [ ] **Step 5: 提交**

```bash
git add -A && git commit -m "feat(client): 营地页与委托流"
```

---

### Task 17: 冒险计时页

**Files:**
- Create: `client/src/hooks/useCountdown.js`, `client/src/components/TimerRing.jsx`
- Replace: `client/src/pages/Adventure.jsx`
- Test: `client/src/hooks/useCountdown.test.jsx`

- [ ] **Step 1: 写失败测试**

```jsx
// client/src/hooks/useCountdown.test.jsx
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCountdown, formatMs } from './useCountdown.js';

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-11T10:00:00'));
  });
  afterEach(() => vi.useRealTimers());

  it('counts down to zero and reports done', () => {
    const endsAt = new Date('2026-06-11T10:00:02').toISOString();
    const { result } = renderHook(() => useCountdown(endsAt));
    expect(result.current.remainingMs).toBe(2000);
    expect(result.current.done).toBe(false);
    act(() => { vi.advanceTimersByTime(2100); });
    expect(result.current.remainingMs).toBe(0);
    expect(result.current.done).toBe(true);
  });

  it('formats ms as mm:ss', () => {
    expect(formatMs(25 * 60 * 1000)).toBe('25:00');
    expect(formatMs(61000)).toBe('01:01');
    expect(formatMs(0)).toBe('00:00');
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `cd client && npx vitest run src/hooks/useCountdown.test.jsx`
Expected: FAIL(模块不存在)。

- [ ] **Step 3: 实现 useCountdown.js**

```js
// client/src/hooks/useCountdown.js
import { useEffect, useState } from 'react';

export function useCountdown(endsAtIso) {
  const calc = () => Math.max(0, new Date(endsAtIso).getTime() - Date.now());
  const [remainingMs, setRemainingMs] = useState(calc);
  useEffect(() => {
    setRemainingMs(calc());
    const t = setInterval(() => setRemainingMs(calc()), 250);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endsAtIso]);
  return { remainingMs, done: remainingMs <= 0 };
}

export function formatMs(ms) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
```

- [ ] **Step 4: 运行确认通过**

Run: `cd client && npx vitest run src/hooks/useCountdown.test.jsx`
Expected: PASS。

- [ ] **Step 5: 写 TimerRing.jsx**

```jsx
// client/src/components/TimerRing.jsx
const R = 88;
const C = 2 * Math.PI * R;

export default function TimerRing({ remainingMs, totalMs, label }) {
  const frac = totalMs > 0 ? Math.min(1, Math.max(0, remainingMs / totalMs)) : 0;
  return (
    <div className="timer-ring">
      <svg width="220" height="220" viewBox="0 0 220 220">
        <circle cx="110" cy="110" r={R} fill="none" stroke="var(--card-2)" strokeWidth="8" />
        <circle cx="110" cy="110" r={R} fill="none" stroke="var(--gold)" strokeWidth="8"
          strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - frac)}
          transform="rotate(-90 110 110)"
          style={{ transition: 'stroke-dashoffset .3s linear', filter: 'drop-shadow(0 0 10px rgba(216,179,106,.45))' }} />
      </svg>
      <div className="timer-label">{label}</div>
    </div>
  );
}
```

- [ ] **Step 6: 整文件替换 Adventure.jsx(结算遮罩 T18 接入,本步先用简版结算回显)**

```jsx
// client/src/pages/Adventure.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../state/GameStateContext.jsx';
import { api } from '../api/client.js';
import { useCountdown, formatMs } from '../hooks/useCountdown.js';
import TimerRing from '../components/TimerRing.jsx';

export default function Adventure() {
  const { state, refresh } = useGame();
  const navigate = useNavigate();
  const [events, setEvents] = useState(null);
  const [finishedQuest, setFinishedQuest] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const session = state?.runningSession;

  async function complete() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const data = await api(`/sessions/${session.id}/complete`, { method: 'POST' });
      setFinishedQuest({ title: session.questTitle, type: session.questType, durationMin: session.durationMin, subjectTag: session.subjectTag });
      setEvents(data.events);
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  }

  async function abandon() {
    if (!window.confirm('确定撤退吗?本次冒险将没有任何掉落。')) return;
    try {
      await api(`/sessions/${session.id}/abandon`, { method: 'POST' });
      await refresh();
      navigate('/');
    } catch (e) {
      setError(e.message);
    }
  }

  async function done() {
    await refresh();
    navigate('/');
  }

  if (events) {
    // T18 替换为 <RewardSequence events={events} quest={finishedQuest} onDone={done} />
    return (
      <div className="adventure">
        <h2>⚔️ 委托完成!{finishedQuest?.title}</h2>
        {events.map((e, i) => <p key={i}>{JSON.stringify(e)}</p>)}
        <button className="btn" onClick={done}>回营地</button>
      </div>
    );
  }
  if (!state) return <div className="splash">🔥 正在点亮篝火…</div>;
  if (!session) {
    navigate('/');
    return null;
  }
  const buddy = state.creatures.at(-1)?.emoji ?? '🔥';
  return <Running session={session} buddy={buddy} onComplete={complete} onAbandon={abandon} error={error} busy={busy} />;
}

function Running({ session, buddy, onComplete, onAbandon, error, busy }) {
  const { remainingMs, done } = useCountdown(session.endsAt);
  const totalMs = new Date(session.endsAt).getTime() - new Date(session.startedAt).getTime();
  return (
    <div className="adventure">
      <p className="dim">— 委托:{session.questTitle} —</p>
      <TimerRing remainingMs={remainingMs} totalMs={totalMs} label={done ? '时辰已到' : formatMs(remainingMs)} />
      <div className="adventure-buddy">{buddy}</div>
      <p className="dim">{done ? '冒险归来,清点战利品吧!' : '伙伴在篝火旁等你凯旋…'}</p>
      {error && <p className="error-line">{error}</p>}
      {done || error
        ? <button className="btn btn-big" disabled={busy} onClick={onComplete}>{error ? '重试结算' : '🎺 凯旋归来'}</button>
        : <button className="btn-ghost retreat" onClick={onAbandon}>中途撤退(本次无掉落)</button>}
    </div>
  );
}
```

- [ ] **Step 7: 手动验证(计时恢复是核心)**

Run: `npm run dev`
1. 自建 5 分钟委托并出发 → 全屏金色计时环倒数。
2. **刷新页面** → 自动回到冒险页继续倒计时(状态在后端)。
3. 撤退 → 确认弹窗 → 回营地,委托标记 ✖,资产未扣。
4. 再出发一个 5 分钟委托,等待到点 →「凯旋归来」→ 简版结算列表 → 回营地,金币/EXP 已更新。

- [ ] **Step 8: 提交**

```bash
git add -A && git commit -m "feat(client): 冒险计时页(恢复/撤退/凯旋)"
```

---

### Task 18: 结算动画序列与音效

**Files:**
- Create: `client/src/audio/sfx.js`, `client/src/components/RewardSequence.jsx`
- Modify: `client/src/pages/Adventure.jsx`(接入 RewardSequence)
- Test: `client/src/components/RewardSequence.test.jsx`

- [ ] **Step 1: 写失败测试(mock framer-motion 与音效,聚焦时序逻辑)**

```jsx
// client/src/components/RewardSequence.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import RewardSequence from './RewardSequence.jsx';
import { ToastProvider } from './Toast.jsx';

vi.mock('../audio/sfx.js', () => ({ playSfx: vi.fn() }));
vi.mock('../api/client.js', () => ({ api: vi.fn() }));
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }) => children,
  motion: { div: ({ children, className }) => <div className={className}>{children}</div> },
}));

const EVENTS = [
  { type: 'exp', amount: 50 },
  { type: 'gold', amount: 25 },
  { type: 'egg', rarity: 'rare', pity: false },
];

describe('RewardSequence', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('reveals events one by one, then shows the return button', () => {
    const onDone = vi.fn();
    render(
      <ToastProvider>
        <RewardSequence events={EVENTS} quest={{ type: 'daily' }} onDone={onDone} />
      </ToastProvider>
    );
    expect(screen.queryByText(/经验 \+50/)).toBeNull();
    act(() => { vi.advanceTimersByTime(950); });
    expect(screen.getByText(/经验 \+50/)).toBeInTheDocument();
    expect(screen.queryByText(/金币 \+25/)).toBeNull();
    act(() => { vi.advanceTimersByTime(900); });
    expect(screen.getByText(/金币 \+25/)).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(900); });
    expect(screen.getByText(/稀有的蛋/)).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(900); });
    fireEvent.click(screen.getByText('回营地'));
    expect(onDone).toHaveBeenCalled();
  });

  it('offers 再来一次 for custom quests', () => {
    render(
      <ToastProvider>
        <RewardSequence events={[{ type: 'exp', amount: 10 }]} quest={{ type: 'custom', title: 'x', durationMin: 25, subjectTag: null }} onDone={() => {}} />
      </ToastProvider>
    );
    act(() => { vi.advanceTimersByTime(2000); });
    expect(screen.getByText(/再来一次/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `cd client && npx vitest run src/components/RewardSequence.test.jsx`
Expected: FAIL(模块不存在)。

- [ ] **Step 3: 写 sfx.js(WebAudio 合成,无资产)**

```js
// client/src/audio/sfx.js
let ctx;

function beep(freq, at, dur, type = 'sine', gain = 0.04) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + dur);
}

export function playSfx(kind) {
  try {
    if (localStorage.getItem('sfx_enabled') === 'off') return;
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime;
    if (kind === 'complete') {
      beep(523, t, 0.12); beep(659, t + 0.12, 0.12); beep(784, t + 0.24, 0.25);
    } else if (kind === 'rare') {
      [440, 554, 659, 880].forEach((f, i) => beep(f, t + i * 0.1, 0.12, 'triangle', 0.05));
    } else if (kind === 'levelup') {
      [523, 587, 659, 784, 1047].forEach((f, i) => beep(f, t + i * 0.09, 0.12, 'square', 0.03));
    }
  } catch {
    /* 音频不可用时静默 */
  }
}
```

- [ ] **Step 4: 写 RewardSequence.jsx**

```jsx
// client/src/components/RewardSequence.jsx
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client.js';
import { useToast } from './Toast.jsx';
import { playSfx } from '../audio/sfx.js';
import { RARITY_NAMES } from '../utils/rarity.js';

const STEP_MS = 900;

function eventView(e) {
  switch (e.type) {
    case 'exp': return { icon: '✨', text: `经验 +${e.amount}` };
    case 'gold': return { icon: '🪙', text: `金币 +${e.amount}` };
    case 'levelup': return { icon: '🎺', text: `升级!Lv${e.level}${e.title ? ` · 获得称号「${e.title}」` : ''}`, cls: 'rarity-legendary' };
    case 'material': return { icon: e.emoji, text: `${e.name} ×${e.qty}` };
    case 'egg': return { icon: '🥚', text: `获得${RARITY_NAMES[e.rarity]}的蛋!${e.pity ? '(命运的眷顾)' : ''}`, cls: `rarity-${e.rarity}` };
    case 'egg_progress': return { icon: '🐣', text: `孵化进度 ${e.progress}/${e.required}`, cls: `rarity-${e.rarity}` };
    case 'hatch': return { icon: e.species.emoji, text: `孵化了「${e.species.name}」!${e.species.flavor}`, cls: `rarity-${e.species.rarity}` };
    default: return { icon: '❔', text: '???' };
  }
}

export default function RewardSequence({ events, quest, onDone }) {
  const [shown, setShown] = useState(0);
  const toast = useToast();

  useEffect(() => { playSfx('complete'); }, []);

  useEffect(() => {
    if (shown >= events.length) return;
    const e = events[shown];
    if (e.type === 'levelup') playSfx('levelup');
    else if ((e.type === 'egg' || e.type === 'hatch') && ['rare', 'epic', 'legendary'].includes(e.rarity ?? e.species?.rarity)) playSfx('rare');
    const t = setTimeout(() => setShown(s => s + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [shown, events]);

  async function again() {
    try {
      await api('/quests', { method: 'POST', body: { title: quest.title, durationMin: quest.durationMin, subjectTag: quest.subjectTag } });
    } catch (e) {
      toast.show(e.message);
    }
    onDone();
  }

  const allShown = shown >= events.length;
  return (
    <div className="reward-mask">
      <div className="reward-panel card">
        <h2 className="reward-title">⚔️ 委托完成!</h2>
        <AnimatePresence>
          {events.slice(0, shown).map((e, i) => {
            const v = eventView(e);
            return (
              <motion.div key={i} className={`reward-item ${v.cls || ''}`}
                initial={{ opacity: 0, y: 16, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
                <span className="reward-icon">{v.icon}</span>{v.text}
              </motion.div>
            );
          })}
        </AnimatePresence>
        {allShown && (
          <div className="reward-actions">
            {quest?.type === 'custom' && <button className="btn-ghost" onClick={again}>🔁 再来一次</button>}
            <button className="btn" onClick={onDone}>回营地</button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 接入 Adventure.jsx**

import 区追加:

```js
import RewardSequence from '../components/RewardSequence.jsx';
```

把 `if (events) { … }` 整块(含简版回显 JSX)替换为:

```jsx
if (events) return <RewardSequence events={events} quest={finishedQuest} onDone={done} />;
```

- [ ] **Step 6: 运行测试并手动验证**

Run: `cd client && npx vitest run`
Expected: 全部 PASS。
手动:完成一个 5 分钟委托 → 奖励逐条弹出伴随音效;稀有掉落带稀有度配色;自建委托结算尾部有「再来一次」。

- [ ] **Step 7: 提交**

```bash
git add -A && git commit -m "feat(client): 结算动画序列与音效"
```

---

### Task 19: 营地场景与建造菜单

**Files:**
- Create: `client/src/components/CampScene.jsx`, `client/src/components/BuildMenu.jsx`
- Modify: `client/src/pages/Camp.jsx`(替换场景占位)

- [ ] **Step 1: 写 BuildMenu.jsx**

```jsx
// client/src/components/BuildMenu.jsx
import { useState } from 'react';
import { api } from '../api/client.js';
import { useGame } from '../state/GameStateContext.jsx';
import { useToast } from './Toast.jsx';

const EFFECT_TEXT = {
  exp_pct: v => `EXP +${v}%/级`,
  gold_pct: v => `金币 +${v}%/级`,
  egg_pct_points: v => `蛋概率 +${v} 个百分点/级`,
  material_flat: v => `材料 +${v}/级`,
};

export default function BuildMenu({ slotIndex, building, onClose }) {
  const { state, refresh } = useGame();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const have = Object.fromEntries(state.resources.map(r => [r.key, r.qty]));
  const matMeta = Object.fromEntries(state.resources.map(r => [r.key, r]));
  const options = building
    ? state.buildingCatalog.filter(b => b.key === building.key)
    : state.buildingCatalog.filter(b => b.buildable);

  async function build(key) {
    setBusy(true);
    try {
      await api('/buildings', { method: 'POST', body: { slotIndex, buildingKey: key } });
      await refresh();
      onClose();
    } catch (e) {
      toast.show(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal card" onClick={e => e.stopPropagation()}>
        <h3>{building ? '升级建筑' : '建造新建筑'}</h3>
        {options.map(def => {
          const maxed = building && building.level >= 3;
          const targetLevel = building ? building.level + 1 : 1;
          const cost = Object.entries(def.baseCost).map(([k, v]) => ({ key: k, qty: v * targetLevel }));
          const afford = cost.every(c => (have[c.key] || 0) >= c.qty);
          return (
            <div key={def.key} className="card build-row">
              <div>
                <b>{def.emoji} {def.name}{building ? ` Lv${building.level}${maxed ? '' : ` → Lv${targetLevel}`}` : ''}</b>
                <div className="dim">{def.desc}</div>
                {def.effect && <div className="dim">效果:{EFFECT_TEXT[def.effect.type](def.effect.value)}</div>}
                {!maxed && (
                  <div className="dim">消耗:{cost.map(c => `${matMeta[c.key]?.emoji ?? c.key}${c.qty}`).join('  ')}</div>
                )}
              </div>
              {maxed
                ? <span className="quest-badge">已满级</span>
                : <button className="btn" disabled={busy || !afford} onClick={() => build(def.key)}>{building ? '升级' : '建造'}</button>}
            </div>
          );
        })}
        <button className="btn-ghost" onClick={onClose}>关闭</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 写 CampScene.jsx**

```jsx
// client/src/components/CampScene.jsx
import { useState } from 'react';
import { useGame } from '../state/GameStateContext.jsx';
import BuildMenu from './BuildMenu.jsx';

const SLOT_POS = [
  { left: '44%', top: '58%' },  // 0 篝火(固定)
  { left: '18%', top: '48%' },
  { left: '68%', top: '44%' },
  { left: '8%', top: '68%' },
  { left: '30%', top: '74%' },
  { left: '58%', top: '72%' },
  { left: '80%', top: '62%' },
  { left: '86%', top: '80%' },
];

const STARS = [[8, 12], [20, 6], [33, 18], [47, 9], [61, 14], [72, 7], [85, 16], [15, 26], [55, 24], [90, 28], [40, 30], [78, 33]];

export default function CampScene() {
  const { state } = useGame();
  const [slot, setSlot] = useState(null);
  const bySlot = Object.fromEntries(state.buildings.map(b => [b.slotIndex, b]));
  const catalog = Object.fromEntries(state.buildingCatalog.map(b => [b.key, b]));

  return (
    <section className="scene">
      <div className="scene-sky">
        {STARS.map(([x, y], i) => (
          <span key={i} className="star" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(i % 5) * 0.6}s` }} />
        ))}
        <span className="scene-sign"><span className="only-night">🌙</span><span className="only-day">☀️</span></span>
      </div>
      {SLOT_POS.map((pos, i) => {
        const b = bySlot[i];
        return (
          <button key={i}
            className={`slot${b ? '' : ' slot-empty'}${b?.key === 'campfire' ? ' slot-campfire' : ''}`}
            style={pos}
            onClick={() => i !== 0 && setSlot(i)}
            title={b ? catalog[b.key].name : '空地,点击建造'}>
            {b ? (
              <>
                <span className="slot-emoji">{catalog[b.key].emoji}</span>
                <span className="slot-label">{catalog[b.key].name} Lv{b.level}</span>
              </>
            ) : <span className="slot-plus">＋</span>}
          </button>
        );
      })}
      <div className="scene-creatures">
        {state.creatures.map((c, i) => (
          <span key={c.id} className="creature" style={{ animationDelay: `${(i % 4) * 0.8}s` }} title={c.name}>{c.emoji}</span>
        ))}
      </div>
      {slot !== null && <BuildMenu slotIndex={slot} building={bySlot[slot] ?? null} onClose={() => setSlot(null)} />}
    </section>
  );
}
```

- [ ] **Step 3: 接入 Camp.jsx**

import 区追加:

```js
import CampScene from '../components/CampScene.jsx';
```

把 `<section className="card scene-placeholder">🏕️ {state.creatures.map(c => c.emoji).join(' ') || '营地静悄悄的…'}</section>` 替换为:

```jsx
<CampScene />
```

- [ ] **Step 4: 手动验证**

Run: `npm run dev`
Expected: 左侧星空营地(夜间星星闪烁+🌙,日间☀️无星)、篝火光晕脉动;点空地块弹建造菜单(材料不足按钮置灰);攒够材料能建帐篷并升级;伙伴 emoji 漂浮在场景底部。

- [ ] **Step 5: 提交**

```bash
git add -A && git commit -m "feat(client): 营地场景与建造菜单"
```

---

### Task 20: 图鉴页与统计页

**Files:**
- Replace: `client/src/pages/Collection.jsx`, `client/src/pages/Stats.jsx`

- [ ] **Step 1: 整文件替换 Collection.jsx**

```jsx
// client/src/pages/Collection.jsx
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useGame } from '../state/GameStateContext.jsx';
import { RARITY_NAMES } from '../utils/rarity.js';

const ORDER = ['common', 'rare', 'epic', 'legendary'];

export default function Collection() {
  const { state } = useGame();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    api('/collection').then(setData).catch(e => setError(e.message));
  }, []);
  if (error) return <p className="dim">📡 {error}</p>;
  if (!data) return <p className="dim">翻阅图鉴中…</p>;
  return (
    <div>
      <h2>📖 生物图鉴 <small className="dim">{data.progress.collected}/{data.progress.total}</small></h2>
      {ORDER.map(r => (
        <section key={r}>
          <h3 className={`rarity-${r}`}>{RARITY_NAMES[r]}</h3>
          <div className="dex-grid">
            {data.species.filter(s => s.rarity === r).map(s => (
              <div key={s.key} className={`card dex-card rarity-${r}${s.collected ? '' : ' dex-locked'}`}>
                <span className="dex-emoji">{s.collected ? s.emoji : '❓'}</span>
                <b>{s.collected ? s.name : '???'}</b>
                {s.collected && <small className="dim">{s.flavor}{s.count > 1 ? ` ×${s.count}` : ''}</small>}
              </div>
            ))}
          </div>
        </section>
      ))}
      <section>
        <h3>🎒 材料一览</h3>
        <div className="dex-grid">
          {state.resources.map(r => (
            <div key={r.key} className="card dex-card">
              <span className="dex-emoji">{r.emoji}</span>
              <b>{r.name}</b>
              <small className="dim">持有 {r.qty}</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: 整文件替换 Stats.jsx**

```jsx
// client/src/pages/Stats.jsx
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function Stats() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    api('/stats').then(setData).catch(e => setError(e.message));
  }, []);
  if (error) return <p className="dim">📡 {error}</p>;
  if (!data) return <p className="dim">清点战果中…</p>;
  const maxWeek = Math.max(1, ...data.week.map(d => d.minutes));
  const maxSubject = Math.max(1, ...data.subjects.map(s => s.minutes));
  return (
    <div>
      <h2>📊 冒险统计</h2>
      <div className="stat-cards">
        <div className="card stat-card"><b>{Math.floor(data.totalMinutes / 60)}h {data.totalMinutes % 60}m</b><small className="dim">总专注</small></div>
        <div className="card stat-card"><b>{data.totalSessions}</b><small className="dim">完成委托</small></div>
        <div className="card stat-card"><b>Lv{data.level}</b><small className="dim">{data.title}</small></div>
        <div className="card stat-card"><b>{data.collection.collected}/{data.collection.total}</b><small className="dim">图鉴收集</small></div>
        <div className="card stat-card"><b>{data.buildingCount}</b><small className="dim">营地建筑</small></div>
      </div>
      <div className="card">
        <h3>本周专注(分钟)</h3>
        <div className="week-bars">
          {data.week.map(d => (
            <div key={d.date} className="week-col">
              <span className="dim week-num">{d.minutes || ''}</span>
              <div className="week-bar" style={{ height: `${(d.minutes / maxWeek) * 100}%` }} />
              <small className="dim">{d.date.slice(5)}</small>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h3>学科分布</h3>
        {data.subjects.length === 0 && <p className="dim">还没有数据,出发吧!</p>}
        {data.subjects.map(s => (
          <div key={s.tag} className="subject-row">
            <span className="subject-tag">{s.tag}</span>
            <div className="bar subject-bar"><div style={{ width: `${(s.minutes / maxSubject) * 100}%` }} /></div>
            <small className="dim">{s.minutes}m</small>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 手动验证并提交**

Run: `npm run dev`
Expected: 图鉴页 4 个稀有度分组、未收集为 ❓ 剪影、底部材料一览;统计页五张卡 + 本周柱状图 + 学科条形图。

```bash
git add -A && git commit -m "feat(client): 图鉴页与统计页"
```

---

### Task 21: 设置面板、README 与收尾

**Files:**
- Replace: `client/src/components/NavBar.jsx`(加设置面板)
- Create: `README.md`

- [ ] **Step 1: 整文件替换 NavBar.jsx**

```jsx
// client/src/components/NavBar.jsx
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../theme/ThemeContext.jsx';

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const { mode, setMode } = useTheme();
  const [sfx, setSfx] = useState(() => localStorage.getItem('sfx_enabled') !== 'off');

  function toggleSfx() {
    const next = !sfx;
    setSfx(next);
    localStorage.setItem('sfx_enabled', next ? 'on' : 'off');
  }

  return (
    <nav className="navbar">
      <NavLink to="/" end>🏕️ 营地</NavLink>
      <NavLink to="/collection">📖 图鉴</NavLink>
      <NavLink to="/stats">📊 统计</NavLink>
      <button className="nav-gear" onClick={() => setOpen(o => !o)} title="设置">⚙️</button>
      {open && (
        <div className="card settings-pop">
          <label>主题
            <select value={mode} onChange={e => setMode(e.target.value)}>
              <option value="auto">跟随时间</option>
              <option value="day">日间</option>
              <option value="night">夜间</option>
            </select>
          </label>
          <label>音效
            <button className="btn-ghost" onClick={toggleSfx}>{sfx ? '开 🔔' : '关 🔕'}</button>
          </label>
        </div>
      )}
    </nav>
  );
}
```

- [ ] **Step 2: 写 README.md**

````markdown
# 🏕️ 星夜营地(FightingToStudy)

让"主动学习"像游戏一样上瘾的本地网页应用:专注学习 = 出击委托,
归来结算经验、金币、材料与蛋;孵化生物伙伴、点亮图鉴、建造你的星夜营地。

## 快速开始

```bash
npm install        # 首次
npm run build      # 打包前端
npm start          # 打开 http://localhost:3001
```

开发模式(前端热更新):`npm run dev`,访问 http://localhost:5173。

## 玩法

- **今日委托**:每天 3 个(5/25/45 分钟),也可自建委托(5~120 分钟,可贴学科标签)。
- **出击**:点「出发」进入全屏专注;刷新/误关页面自动恢复;中途撤退则本次无掉落(已有资产永不扣)。
- **结算**:经验、金币、材料必得;蛋概率掉落(连续 4 次不掉,第 5 次保底)。
- **孵化**:蛋按获得顺序排队孵化,每完成一次专注 +1 进度;24 种伙伴等你收集。
- **建造**:材料用于 7 种建筑(各 3 级),提供经验/金币/掉蛋/材料加成。
- **日夜**:界面随本地时间切换日/夜主题,右下角 ⚙️ 可锁定主题、开关音效。

## 技术

React 18 + Vite / Express 4 + better-sqlite3 / Vitest。
存档在 `data/app.db`(启动时自动备份最近 3 份于 `data/backups/`)。

## 测试

```bash
npm test           # server + client 全部测试
```
````

- [ ] **Step 3: 全量回归**

Run: `npm test`
Expected: server(12 个测试文件)与 client(2 个测试文件)全部 PASS。

- [ ] **Step 4: 端到端手动验收清单**

Run: `npm run build && npm start`,在 `http://localhost:3001` 走通:
1. 首屏:3 个今日委托、篝火营地、Lv1 见习学者。
2. 自建 5 分钟委托(贴标签"测试")→ 出发 → 刷新页面恢复 → 到点 → 凯旋 → 奖励序列动画 + 音效。
3. 反复完成 5 分钟委托直到掉蛋(最多 5 次必掉)→ 右栏出现孵化进度 → 孵化 → 图鉴点亮 + 营地出现伙伴。
4. 攒木材建帐篷 → 升级 → 后续结算金币微增(+3%)。
5. 统计页数字与柱状图正确;⚙️ 切换日/夜主题、关音效生效。
6. 重启 `npm start` → 数据还在,`data/backups/` 有新备份。

- [ ] **Step 5: 提交**

```bash
git add -A && git commit -m "feat: 设置面板、README 与收尾打磨"
```

---

## 计划自审记录

- **规格覆盖**:角色/称号(T5)、每日+自建委托(T8/T9)、专注会话与恢复/幂等/容差/并发守卫(T9/T10/T17)、掉落公式+保底+稀有度(T6)、孵化队列+图鉴(T6/T10/T11/T20)、建造+加成(T12/T19)、统计(T11/T20)、回归礼包(T13/T16)、音效(T18/T21)、日夜主题(T15/T19/T21)、备份(T14)、结算失败重试(T17)。Boss 战/AI 剧情等按规格 2.5 明确推迟,无对应任务。
- **占位符**:T15 的简版页均在 T16/T17/T20 有"整文件替换"步骤,非悬空 TODO;每个代码步骤均含完整代码。
- **类型一致性**:结算事件字段(`type/amount/level/title/key/name/emoji/qty/rarity/pity/progress/required/species`)由 T6 服务端产生、T18 前端 `eventView` 消费,一一对应;`/api/state` 字段在 T7 定义,T15–T19 按相同驼峰名消费;`seqRng`/`makeTestApp`/`grant`/`toQuestJson` 签名全程一致;RNG 消耗顺序契约在 T6 代码注释与"约定"小节双处声明。
- **对抗审查修正记录**(多智能体审查后修复):① T10 撤退测试改为直查数据库验证 custom 委托 failed 状态(原断言与 T7 state 查询矛盾,会抛 TypeError);② T20 统计页补第五张卡渲染 buildingCount;③ T20 图鉴页补"材料一览"区块(复用 state.resources);④ T10 增加多蛋队列"只孵最老"测试;⑤ T6 增加 aggregateBonuses 叠加单测;⑥ T19 BuildMenu 显示效果文案;⑦ T16 QuestCard 预期奖励补材料数;⑧ 稀有度光效改为逐级递增;⑨ 修正 T21 测试文件计数(12 个)。
