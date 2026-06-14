# v1.5 讨伐（Boss × 代办）设计

日期：2026-06-15　分支：`feat/boss-todo`

## 概念
大目标 = 讨伐目标（Boss）。其下的**代办**即一条带预估时长的委托。选代办「出发」专注，凯旋时照常给奖励 + 勾掉代办 + Boss 扣血（=该代办时长）。HP = 代办时长总和（派生）。清空全部代办 = 击败，发大奖。

## 决策
- 融合模型：**代办即委托**（复用 quests/session/结算）。
- 可同时多个讨伐目标（清单式）。
- 入口：底栏新增「讨伐」页；已击败目标转入战绩。
- 击败大奖：金币 +总时长M ＋ 必得蛋（M<120 稀有 / 120–360 史诗 / ≥360 传说）＋ 称号「{目标} 讨伐者」。

## 数据模型（纯增量，不动存档）
- 新表 `bosses(id, title, status active|defeated, title_award, created_at, defeated_at)`（schema.sql `CREATE IF NOT EXISTS`）。
- `quests` 加列 `boss_id INTEGER`（migrate `ALTER ADD COLUMN`，空=普通委托）。

## 后端
- `routes/bosses.js`：POST `/`(建目标) / POST `/:id/todos`(加代办) / DELETE `/:id/todos/:tid`(删 ready 代办) / DELETE `/:id`(删无进展目标)。app.js 挂 `/api/bosses`。
- 代办出发/结算复用 `/quests/:id/start`、`/sessions/:id/complete`。
- `settlement.js`：完成的委托若有 `boss_id` → 标 done；该 Boss 全部代办 done 且仍 active → 击败：发金币M + 插必得蛋 + 写 `title_award`，并把 `boss_defeated`/`gold`/`egg` 事件并入本次结算。
- `state.js`：营地委托排除 `boss_id` 非空；新增 `bosses`（含 todos 与 doneMin/totalMin）；`runningSession.bossId` 暴露（供前端抑制「再来一次」）。
- 删除约束：只删 `ready` 代办、只删无 `active/done` 代办的目标——避免孤儿 session 影响统计。

## 前端
- 新页 `pages/Boss.jsx` + 路由 `/boss`（懒加载）+ 底栏「讨伐」(Icon skull)。
- 目标卡：标题 + HP 条(doneMin/totalMin) + 代办清单（☐/☑ + 时长 + [出发] / 删除）；新建目标、加代办表单；战绩区展示已击败目标与称号。
- 代办[出发] → 复用冒险页；结算时若击败弹 `boss_defeated` 特效。
- `api/client.js` 加 createBoss/addBossTodo/deleteBossTodo/deleteBoss；RewardSequence 加 `boss_defeated` 事件视图；Adventure 用 `session.bossId` 把 finishedQuest.type 设为 'boss'（隐藏「再来一次」）。

## MVP 边界
- 做：多目标、代办=承诺委托、击败大奖、讨伐页、战绩。
- 暂不做：对代办打野、代办拖拽/改时长。

全程 build/test 绿，纯增量迁移。
