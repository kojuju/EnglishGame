# 可插拔题型策略层设计文档

## 1. 设计目标

本次设计遵循以下原则：

1. **横纵分层**：横向保持 `practice / stage / survival` 三条玩法线，纵向引入 `meaning / dictation` 题型策略层
2. **优先收口练习模式**：先处理 `app.js` 内已经存在的大量题型分支
3. **渐进接入其他玩法**：闯关和生存先接入题型注册与选择边界，再逐步补齐更多题型
4. **策略而非切面**：题型层是可插拔策略层，不是 AOP 式横切注入
5. **基于现状演进**：设计必须充分利用当前代码已有的分桶存储、共享工具和顶级页面拆分成果

## 2. 当前代码结构研判

## 2.1 练习模式中的题型耦合点

`app.js` 当前已经有“题型”的概念，但仍是分支式实现。

现有耦合主要分布在以下几类函数：

1. **题目构建**
   - `buildMeaningQuestionSet(...)`
   - `buildMeaningRematchQuestionSet(...)`
   - `buildDictationRound(...)`
   - `buildDictationRematchRound(...)`

2. **首页文案与统计**
   - `MODE_META`
   - `updateHomeModeContent()`
   - `updateHomeStats()`

3. **游戏页渲染**
   - `renderMeaningQuestion()`
   - `renderDictationQuestion()`
   - `renderQuestion()`
   - `updateStatusBar()`

4. **作答与回合推进**
   - `handleMeaningAnswer(...)`
   - `handleDictationSubmit(...)`
   - `moveToNextMeaningQuestion()`
   - `moveToNextDictationQuestion()`

5. **结果页与统计**
   - `renderResult()`
   - `saveRoundSummary()`

6. **副作用**
   - 词义模式倒计时
   - 听写播放、播放间隔、提交倒计时

这说明：

- 练习模式已经是“页面引擎 + 两套题型实现混写在一起”
- 拆题型层时，练习模式应作为第一落点

## 2.2 闯关模式中的题型边界

`stage-mode.js` 当前结构更简单：

- 关卡数据源固定读取 `STAGE_WORD_BANK.meaning`
- 题面、判题、状态栏、结果页都围绕词义选择
- 关卡主循环、通关判断、解锁逻辑都高度稳定

这意味着：

1. 闯关模式的“玩法引擎”边界已经比较清晰
2. 当前缺的不是玩法抽象，而是题型接入点

也就是说，闯关模式未来更适合演进为：

- `stage engine + meaning strategy`

而不是：

- 再做一套独立的 `stage dictation` 页面脚本

## 2.3 生存模式中的题型边界

`survival-mode.js` 当前结构也相对清晰：

- 无限续题主循环
- 近期去重
- 纪录保存
- 答错即终局

这些都属于“玩法引擎”的职责。  
题型真正介入的是：

- 如何生成题目
- 如何渲染题面
- 如何判题
- 如何更新题型专属状态

因此，生存模式也适合演进为：

- `survival engine + meaning strategy`

未来再扩展：

- `survival engine + dictation strategy`

## 2.4 当前共享层能力的可复用基础

`shared-game.js` 已经具备适合继续抽层的基础：

- `meaning / dictation` 的桶结构约定
- 级别、词库、存储读写等基础能力
- `createMeaningQuestion(...)`

因此，这次设计不需要推翻共享层，只需要在其之上增加一层更明确的“题型策略注册与调用能力”。

## 3. 目标架构

## 3.1 二维模型

建议形成如下二维结构：

| 横向玩法引擎 | 纵向题型策略 |
| --- | --- |
| `practice` | `meaning` |
| `stage` | `dictation` |
| `survival` | 后续更多题型 |

更准确地说，未来每条可玩路径都是一个组合：

- `practice + meaning`
- `practice + dictation`
- `stage + meaning`
- `survival + meaning`

后续再逐步补：

- `stage + dictation`
- `survival + dictation`

## 3.2 分层职责

### 页面引擎层负责

- 一局的生命周期
- 首页 / 游戏页 / 结果页切换
- 本玩法进度规则
- 玩法级统计含义
- 玩法结果节奏

### 题型策略层负责

- 题目构建
- 单题渲染
- 输入方式
- 判题规则
- 类型专属状态栏解释
- 类型专属副作用
- 类型专属结果字段解释

### 共享基础层负责

- 词库与级别
- 本地存储
- 题型注册表
- 通用工具函数
- 共享配置常量

## 4. 题型策略接口设计

## 4.1 建议接口

建议每个题型策略至少暴露以下能力：

```js
const meaningStrategy = {
  id: "meaning",
  isAvailable(context) {},
  buildRound(context) {},
  buildRematchRound(context) {},
  getHomeMeta(context) {},
  renderQuestion(context) {},
  updateStatusBar(context) {},
  handlePrimaryAction(context, payload) {},
  getResultPayload(context) {},
  saveStats(context) {},
  stopEffects(context) {}
};
```

说明：

- `context` 由玩法引擎传入，包含当前玩法页所需状态、元素和共享能力
- 题型策略通过统一接口工作，但内部可拥有完全不同的实现

## 4.2 按当前项目收敛后的最小接口

结合当前代码，不建议一开始就把所有能力都抽到最细。  
第一阶段更现实的最小接口建议是：

1. `buildRound(...)`
2. `buildRematchRound(...)`（若该玩法支持）
3. `renderQuestion(...)`
4. `updateStatusBar(...)`
5. `handleAnswer(...)`
6. `renderResult(...)`
7. `saveStats(...)`
8. `startEffects(...) / stopEffects(...)`

理由：

- 这些正好对应当前 `app.js` 中最明显的分叉带
- 可以先把大块 `if/else` 抽成策略对象
- 不要求一步重写整个页面引擎

## 4.3 题型注册表

建议增加统一注册表，例如：

```js
window.GameTypes = {
  meaning: meaningStrategy,
  dictation: dictationStrategy
};
```

或者由 `shared-game.js` / 新文件暴露：

```js
window.GameTypeRegistry.get("meaning");
window.GameTypeRegistry.get("dictation");
```

要求：

1. 顶级玩法页通过题型 ID 获取策略
2. 不直接硬编码某题型函数散落在页面文件中
3. 后续扩展新题型时，主要是“注册新策略”

## 5. 页面引擎接入方式

## 5.1 练习模式

练习模式建议最先改造。

当前：

- `app.js` 同时承担引擎和题型

目标：

- `app.js` 保留练习模式引擎
- `meaning` 与 `dictation` 的题型差异迁入策略对象

练习引擎继续负责：

- `selectedMode`
- 错题再战是否存在
- 首页切换按钮
- 首页 / 游戏 / 结果页切换

题型策略负责：

- 一局题目如何构建
- 游戏页具体如何渲染
- 具体如何判题
- 如何解释结果字段

## 5.2 闯关模式

闯关模式首期不需要立即支持多题型 UI，但建议先把题型接点抽出来。

建议方式：

1. 新增 `selectedType = "meaning"` 或等价常量
2. 所有题目构建、题面渲染、判题都通过 `currentTypeStrategy` 调用
3. 当前只注册 `meaning` 策略

这样做的收益：

- 先把架子搭好
- 以后补 `dictation` 时，不需要重写整个闯关引擎

## 5.3 生存模式

生存模式与闯关模式类似。

建议方式：

1. 保留当前无限续题引擎
2. 把 `createMeaningQuestion(...)` 的直接调用改成经由题型策略构建
3. 把题面渲染、作答处理、结果解释逐步交给题型策略

当前仍只启用：

- `meaning`

但结构上不再写死。

## 6. 文件组织建议

## 6.1 建议新增文件

建议新增一组题型文件：

- `game-types.js` 或 `shared-game-types.js`
- `game-type-meaning.js`
- `game-type-dictation.js`

如果希望更收敛，也可以先用一个文件承载：

- `game-types.js`

其中包含：

- 注册表
- `meaning` 策略
- `dictation` 策略

## 6.2 与现有文件的职责关系

| 文件 | 建议职责 |
| --- | --- |
| `shared-game.js` | 基础工具与共享数据能力 |
| `game-types.js` | 题型注册与题型策略 |
| `app.js` | 练习模式引擎 |
| `stage-mode.js` | 闯关模式引擎 |
| `survival-mode.js` | 生存模式引擎 |

说明：

- 不建议把所有题型逻辑继续堆进 `shared-game.js`
- 也不建议把题型逻辑继续散落回各玩法页脚本

## 7. 渐进迁移方案

## 7.1 第一阶段：提炼练习模式题型策略

目标：

- 从 `app.js` 中抽出 `meaning / dictation` 策略对象
- 保持页面表现不变

本阶段建议优先抽出：

1. 出题构建
2. 游戏页渲染
3. 判题
4. 结果页解释
5. 统计保存

## 7.2 第二阶段：为闯关模式接入题型选择边界

目标：

- 闯关引擎不再直接写死 `meaning`
- 但实际仍只启用 `meaning`

这样后续补题型时可以直接接入。

## 7.3 第三阶段：为生存模式接入题型选择边界

目标：

- 生存引擎不再直接写死 `createMeaningQuestion(...)`
- 仍先保持 `meaning-only`

## 7.4 第四阶段：逐步补齐新组合

优先级建议：

1. `stage + dictation`
2. `survival + dictation`
3. 后续更多题型

## 8. 风险与控制点

## 8.1 过度抽象风险

风险：

- 一开始就设计一个过大的统一接口，导致实现复杂度过高

控制方式：

- 先按当前代码里最明显的分叉点提炼最小接口
- 让接口服务现有三条玩法，而不是追求抽象完美

## 8.2 题型层反向污染玩法层

风险：

- 题型层开始接管闯关进度、生存纪录或练习再战规则

控制方式：

- 坚持“玩法引擎决定一局怎么玩，题型策略决定一道题怎么做”

## 8.3 共享层继续膨胀风险

风险：

- 抽题型时把所有新逻辑都继续塞进 `shared-game.js`

控制方式：

- 题型层单独成文件或单独成命名空间
- `shared-game.js` 继续作为基础层，而非总调度层

## 8.4 迁移中行为回归风险

风险：

- 练习模式的听写倒计时、语音播放、结果页文案在抽离时被破坏

控制方式：

- 第一阶段先保证练习模式外观与行为不变
- 用“抽策略对象、保留现有页面引擎”方式渐进迁移

## 9. 实施后预期结果

完成该设计后，项目应逐步达到以下状态：

1. 顶级玩法页负责玩法规则，题型层负责题型差异
2. `meaning / dictation` 不再只是页面脚本里的 scattered `if / else`
3. 练习模式更容易维护和扩展
4. 闯关、生存未来补题型时不需要再从头复制一套实现
5. 项目架构从“页面分叉”演进为“玩法引擎 × 题型策略”的二维组合结构
