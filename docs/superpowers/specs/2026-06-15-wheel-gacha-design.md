# 抽卡 · 星夜转盘 设计

日期：2026-06-15　分支：`feat/wheel-gacha`

## 概念
营地入口「星夜转盘」→ 弹层转盘。金币抽奖,概率得 金币返还 / 材料 / 蛋（含小概率史诗+蛋）。保底:每 10 抽内必出 ≥1 颗蛋。复用现有蛋/材料/金币系统,不直接送伙伴(伙伴仍靠孵蛋)。

## 决策
- 入口:营地页按钮(开弹层,不占导航)。
- 货币:金币。单抽 40,十连 360(9 折,十连内保底必出蛋)。

## 奖池(服务端权威 RNG,pickWeighted)
- 金币返还 25%(+20~50) / 材料 45%(随机材料×1~3) / 蛋 27%(按 RARITY_WEIGHTS) / 史诗+蛋 3%(epic 8:legendary 2)。
- 保底:`settings.wheel_pity` 计数,达 10 强制出蛋,出蛋清零。

## 后端
- `routes/wheel.js`:`POST /wheel/spin {count:1|10}` → 校验金币、扣费、循环掷奖并入库(金币/材料/蛋)、回写保底、返回 `{results, cost}`。app 挂 `/api/wheel`。
- 复用 pickWeighted、MATERIALS、RARITY_WEIGHTS、HATCH_REQUIRED。
- 测试 `test/wheel.test.js`:扣费/应用、金币不足 400、保底 10 抽必出蛋、十连。

## 前端
- `components/Wheel.jsx`:野兽派硬边转盘(conic-gradient 8 段 + 指针 + 中心轴),单抽旋转 2.8s 落到结果类目段并揭晓;十连转一圈后列 10 结果 chip。金币不足禁用按钮。复用结算音效/振动。
- `Camp.jsx` 加「星夜转盘」入口按钮 + 弹层;`api.spinWheel(count)`;Icon 加 wheel(Disc3)/gem 别名。

## MVP 边界
- 做:金币单抽/十连、保底、转盘动画、十连结果。
- 暂不做:星尘高级盘、直接出伙伴、抽卡历史。
