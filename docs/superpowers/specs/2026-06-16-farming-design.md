# 种地 · 营地农园 设计

日期：2026-06-16　分支：`feat/farming`

## 概念
营地入口「营地农园」→ 弹层,6 块地。播种作物后,**每完成一次专注(委托/打野/代办)作物 +1 成长**,成熟即可收获材料(晶花概率出蛋)。把"种地"紧贴学习主线(成长靠专注,不靠挂机看页)。

## 决策
- 成长机制:按专注次数(on-mission,不鼓励空刷页面)。
- 入口:营地页按钮(弹层,与转盘一致)。

## 作物(inline CROPS)
- 麦穗 🌾 required 2 → 木材 ×2~3
- 灵草 🌿 required 3 → 星尘 ×1~2
- 晶花 💠 required 5 → 水晶 ×1 + 30% 蛋(按稀有度权重)

## 后端
- 新表 `farm(slot_index unique, crop, progress, required, planted_at)`(schema CREATE IF NOT EXISTS,老库自动建)。
- `routes/farm.js`:`POST /farm/plant{slotIndex,crop}`、`POST /farm/harvest{slotIndex}`;app 挂 `/api/farm`。
- 成长:`settlement.js` 每次结算把所有生长中作物 `progress+1`(MIN cap),并发 `farm_grow` 事件。
- `state.js` 暴露 `farm`(各地块)与 `farmPlots`。
- 测试 `test/farm.test.js`:种植→两次专注成熟→收获产材料且清空地;占用/未熟/越界/无效作物守卫。

## 前端
- `components/Farm.jsx`:6 地块网格。空地=3 作物种子按钮直接播种;生长中=作物 emoji+进度条(X/required 次);成熟=收获按钮。busy 防重复。
- `Camp.jsx` 加「营地农园」入口;`api.plantCrop/harvestCrop`;RewardSequence 加 `farm_grow` 事件;Icon 加 sprout。

## MVP 边界
- 做:6 地块、3 作物、按专注成长、收获产材料/蛋。
- 暂不做:地块解锁/扩建、施肥加速、作物图鉴。
