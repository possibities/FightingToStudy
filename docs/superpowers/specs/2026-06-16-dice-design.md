# 赌一赌 · 篝火骰戏 设计

日期：2026-06-16　分支：`feat/dice`

## 概念
营地入口「篝火骰戏」→ 弹层。押**金币**(10~100),押大(8~12)/小(2~6),掷 2 骰。猜中翻倍,出 7 庄家通杀,否则输。

## 克制原则(学习 App 不变质成赌博)
- 只赌金币(身外之物),绝不碰经验/伙伴/材料/蛋/已得资产。
- 每日上限 10 局(settings dice_day/dice_count,跨天重置)。
- 单注 10~100 封顶。

## 决策
- 赌法:猜大小(简单刺激、有微庄家优势=有输有赢)。

## 后端
- `routes/dice.js`:`POST /dice/roll{choice,bet}` → 校验押注/余额/当日次数 → 扣注 → 掷骰(rng) → 判定(7 通杀;中则 +2×bet)→ 回写当日次数 → 返回 `{dice,sum,win,delta,remainingToday}`;app 挂 `/api/dice`。
- `state.js` 暴露 `diceRemaining`(当日剩余,Date 参数)。
- 测试 `test/dice.test.js`:大胜翻倍、7 通杀、每日上限、押注/余额校验(seqRng 控点)。

## 前端
- `components/Dice.jsx`:2 颗 lucide 骰面;大/小 + 注额(10/20/50/100)选择;掷骰动画(reduced-motion 下不滚动);结果输赢着色(赢金/输酒红);余额/当日次数不足禁用。
- 营地入口;`api.rollDice`;Icon 加 dice + dice1~6。

## MVP 边界
- 做:猜大小、每日上限、注额档、骰面动画。
- 暂不做:押点数高倍率、连胜奖励、赌局历史。
