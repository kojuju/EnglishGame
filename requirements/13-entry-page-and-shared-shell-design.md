# 入口页与公共壳层重构设计文档

## 1. 设计目标

本次设计遵循以下原则：

1. **入口与玩法解耦**：让 `index.html` 回到站点入口层，不再承载练习模式业务
2. **公共壳层收口**：把侧边栏、设置弹窗和公共级别切换交互收口到共享层
3. **玩法逻辑不外溢**：练习、闯关、生存仍各自保留独立业务脚本
4. **静态项目友好**：方案必须适配当前无框架、无构建、纯静态页面结构
5. **渐进迁移**：尽量减少一次性大改，优先通过共享壳层降低重复，再完成入口页拆分

## 2. 目标信息架构

## 2.1 页面拆分

重构后的目标页面结构建议为：

| 页面 | 职责 |
| --- | --- |
| `index.html` | 网站入口页，展示玩法介绍、导航入口、当前级别说明 |
| `practice-mode.html` | 练习模式业务页面，承载词义选择与听写 |
| `stage-mode.html` | 闯关模式业务页面 |
| `survival-mode.html` | 生存模式业务页面 |

说明：

- `index.html` 不再加载练习模式的完整业务结构
- `practice-mode.html` 成为原练习模式的新承载页
- `stage-mode.html` 与 `survival-mode.html` 保持顶级玩法页定位不变

## 2.2 文件职责建议

建议形成如下分层：

| 文件 | 职责 |
| --- | --- |
| `shared-game.js` | 词库、存储、统计、题目构建、级别元信息等游戏共享能力 |
| `shared-layout.js` | 公共侧边栏、设置弹窗、导航配置、壳层交互 |
| `app.js` | 练习模式业务逻辑（首期可保留文件名） |
| `stage-mode.js` | 闯关模式业务逻辑 |
| `survival-mode.js` | 生存模式业务逻辑 |
| `entry-page.js` | 入口页专属交互（如后续需要） |

说明：

1. 这次设计建议新增 `shared-layout.js`，而不是继续把所有页面壳层逻辑堆进 `shared-game.js`
2. 这样可以把“游戏领域能力”和“页面公共壳层能力”分开
3. 若首期不想新增 `entry-page.js`，入口页也可以先只保留静态内容

## 3. 公共壳层设计

## 3.1 壳层承载范围

共享壳层负责以下内容：

- 左侧品牌区
- 左侧导航区
- 当前级别展示
- 设置弹窗
- 级别选项列表
- 公共开关与禁用状态

不负责以下内容：

- 题目渲染
- 回合推进
- 结算页业务
- 玩法统计更新
- 闯关进度或生存纪录计算

## 3.2 页面插槽结构

为了兼容静态页面，建议各页面使用“插槽 + 注入”的方式，而不是手工复制整段侧边栏与弹窗。

页面骨架建议统一为：

```html
<div class="app-shell">
  <div class="app-layout">
    <div id="shared-sidebar-slot"></div>
    <div class="content-shell">
      <!-- 当前页面业务内容 -->
    </div>
  </div>
</div>

<div id="shared-settings-slot"></div>
```

这样：

1. 页面仍保留自己的业务内容结构
2. 公共侧边栏与设置弹窗通过共享脚本注入
3. 后续菜单项变化时，不需要逐页手改重复 HTML

## 3.3 导航配置模型

建议把菜单改为集中配置：

```js
const NAV_ITEMS = [
  { id: "home", label: "首页", href: "index.html" },
  { id: "practice", label: "练习模式", href: "practice-mode.html" },
  { id: "stage", label: "闯关模式", href: "stage-mode.html" },
  { id: "survival", label: "生存模式", href: "survival-mode.html" }
];
```

`设置` 保持为公共动作按钮，不与普通跳转项混在同一配置对象里。

额外建议：

- 品牌区标题或 Logo 默认链接到 `index.html`
- 入口页高亮 `首页`
- 玩法页根据 `activeNav` 自动高亮当前项

## 3.4 共享壳层初始化接口

建议 `shared-layout.js` 提供一个统一入口：

```js
window.GameLayout.mountShell({
  activeNav: "practice",
  sidebarCopy: "练习模式负责自由练习，闯关模式负责固定进度，生存模式负责连续挑战纪录。",
  settingsCopy: "级别切换后，练习模式、闯关模式和生存模式都会切换到对应级别；三者的数据仍会分别保存。"
});
```

建议返回一个壳层控制对象：

```js
const shell = window.GameLayout.mountShell(...);

shell.setSettingsDisabled(true);
shell.setSettingsDisabled(false);
```

作用：

1. 页面脚本仍能在“游戏进行中”禁用设置按钮
2. 页面脚本不再需要重复实现弹窗本身的打开、关闭与级别渲染逻辑

## 3.5 级别切换事件模型

为减少页面脚本和壳层脚本的硬耦合，建议采用“共享壳层持久化 + 页面监听事件”的方式。

保存级别后的公共流程：

1. 共享壳层写入 `selectedLevel`
2. 共享壳层刷新自己的当前级别展示
3. 共享壳层关闭设置弹窗
4. 共享壳层派发级别变化事件

事件建议：

```js
window.dispatchEvent(new CustomEvent("english-game:level-change", {
  detail: { levelId: "cet4" }
}));
```

各玩法页面收到事件后，再执行各自刷新：

- 练习模式：刷新首页统计、玩法首页文案、题库数量
- 闯关模式：刷新关卡概览、关卡列表与推荐关卡
- 生存模式：刷新纪录、错词与词库数量

这样可以把公共壳层逻辑和玩法刷新逻辑拆开。

## 4. 页面职责设计

## 4.1 入口页 `index.html`

入口页建议只保留以下内容：

- 项目简介
- 三种玩法介绍
- 进入练习模式 / 闯关模式 / 生存模式的按钮或卡片
- 当前级别说明
- 与产品定位有关的辅助说明

入口页不再包含：

- 练习模式首页 screen
- 练习模式游戏 screen
- 练习模式结果 screen
- 练习模式题目渲染区
- 练习模式结果页错词回顾区

这意味着 `index.html` 会从“玩法承载页”变为“站点入口页”。

## 4.2 练习模式页 `practice-mode.html`

建议把现有 `index.html` 中的练习模式内容整体迁移到 `practice-mode.html`。

迁移后职责：

- 承载练习模式首页
- 承载词义选择流程
- 承载听写流程
- 承载练习结果页
- 继续加载 `app.js`

迁移原则：

1. 优先复用现有 DOM 结构和现有 `app.js`
2. 除公共壳层相关部分外，尽量不改练习模式业务 DOM
3. 先完成职责拆分，再考虑文件重命名

## 4.3 闯关与生存模式页

`stage-mode.html` 与 `survival-mode.html` 的业务区整体保留，主要变化是：

- 删除内嵌重复的侧边栏 HTML
- 删除内嵌重复的设置弹窗 HTML
- 接入共享壳层插槽
- 使用共享壳层控制设置按钮状态

这样可以把本次重构的影响集中在壳层层面，而不是深入改动玩法核心流程。

## 5. 脚本接入与加载顺序

这是本次设计里最重要的实现约束之一。

当前 `app.js`、`stage-mode.js`、`survival-mode.js` 在顶层就会读取 DOM 节点。  
如果共享壳层在这些脚本执行后才插入 DOM，会导致节点获取失败。

因此建议采用以下顺序：

```html
<script src="generated-word-bank.js"></script>
<script src="words.js"></script>
<script src="shared-game.js"></script>
<script src="shared-layout.js"></script>
<script>
  window.__gameShell = window.GameLayout.mountShell({
    activeNav: "practice",
    sidebarCopy: "...",
    settingsCopy: "..."
  });
</script>
<script src="app.js"></script>
```

这样可以保证：

1. 公共侧边栏与设置弹窗在玩法脚本运行前已插入 DOM
2. 玩法脚本仍可继续使用 `document.getElementById(...)` 获取公共节点
3. 迁移成本比“全面改成组件化引用”更低

## 6. 玩法脚本改造边界

本次改造不要求重写玩法逻辑，只建议收口与公共壳层相关的重复部分。

各玩法脚本中可以保留：

- 页面状态管理
- 题目构建与渲染
- 回合流程
- 结果结算
- 模式专属统计

各玩法脚本中建议移除或弱化：

- 设置弹窗的 DOM 结构依赖定义
- 级别选项列表重复渲染逻辑
- 打开 / 关闭设置的完整流程
- 焦点恢复与 body 滚动锁定的重复逻辑

保留的公共接点建议只有两类：

1. `window.__gameShell.setSettingsDisabled(...)`
2. `window.addEventListener("english-game:level-change", ...)`

## 7. 迁移顺序建议

为了降低重构风险，建议按以下顺序实施：

1. 新增 `shared-layout.js`，完成公共侧边栏与设置弹窗注入能力
2. 让 `stage-mode.html`、`survival-mode.html` 先接入共享壳层，验证公共菜单与设置逻辑
3. 新增 `practice-mode.html`，把现有练习模式结构从 `index.html` 迁出
4. 把 `index.html` 改为纯入口页
5. 最后再视情况决定是否把 `app.js` 重命名为 `practice-mode.js`

这样做的原因：

- 先抽公共壳层，可以一次性消除三套重复结构
- 再拆首页，可以减少“先改入口、后改壳层”带来的重复修改

## 8. 风险与控制点

## 8.1 DOM 节点时序风险

风险：

- 玩法脚本在共享壳层渲染前执行，会拿不到公共节点

控制方式：

- 强制共享壳层在玩法脚本前完成注入

## 8.2 页面行为回归风险

风险：

- 设置弹窗交互从各脚本抽走后，可能影响当前级别刷新、按钮禁用或焦点恢复

控制方式：

- 共享壳层必须完整承接这些公共行为
- 玩法脚本只保留级别变化后的业务刷新

## 8.3 职责重新混乱风险

风险：

- 如果把太多玩法逻辑继续塞进共享层，会让共享层变成新的“大杂烩”

控制方式：

- 共享壳层只管公共导航和设置，不管玩法回合本身

## 9. 实施后预期结果

完成该设计后，项目应达到以下状态：

1. `index.html` 成为真正的网站入口页
2. 练习模式、闯关模式、生存模式形成对称的顶级业务页面
3. 侧边栏与设置弹窗只维护一份共享实现
4. 新增顶级菜单项时，主要修改共享导航配置即可
5. 各玩法脚本职责更聚焦，后续继续扩展新玩法的成本更低
