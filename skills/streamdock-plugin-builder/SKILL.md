---
name: streamdock-plugin-builder
description: >-
  Use when the user wants to create, build, scaffold, or modify a StreamDock /
  Mirabox Stream Dock plugin — including manifest.json, the Node.js plugin
  backend, action handlers for keypad/dial/touchscreen buttons, or the Property
  Inspector settings UI. Triggers on requests like "写一个 StreamDock 插件",
  "做个流控台/Stream Dock 插件", "StreamDock plugin", or any text describing a
  button/dial behavior to run on a Stream Dock device.
---

# StreamDock 插件开发

## 用途

根据用户的**文字需求**，从内置模板出发，开发一个完整、可安装的 StreamDock
（Mirabox Stream Dock）插件。

**核心心智模型：一个插件 = 一个文件夹 + 事件驱动。**
StreamDock 软件把你的后端代码当作 Node.js 子进程拉起，双方通过本地
WebSocket 收发 JSON 事件；用户配置界面（Property Inspector）是一个独立 HTML 页。

## 适用

**适用：** 用户想做一个按 Stream Dock 按键/旋钮触发某个行为的插件（运行程序、
发命令、调 API、显示动态信息、控制音量等）。

## 必读约定（最容易踩的坑）

1. **插件 ID = 文件夹名**，必须形如 `com.<vendor>.streamdock.<name>.sdPlugin`，
   全小写、反向域名。
2. **`plugin.<x>` 里的 `x` 必须等于 action UUID 的最后一段。**
   例：UUID `com.acme.streamdock.timer.start` → 后端写 `plugin.start = new Actions(...)`。
   SDK 靠 `action.split('.').pop()` 路由事件，名字对不上 = 这个 action 收不到任何事件。
3. **`context`** 是「设备上某一个按键实例」的唯一标识。`setImage / setTitle /
   setSettings` 等几乎所有操作的第一个参数都是 `context`。
4. **生命周期事件用 `_` 前缀**（`_willAppear / _willDisappear /
   _didReceiveSettings / _propertyInspectorDidAppear`）；**输入事件用原名**
   （`keyDown / keyUp / dialDown / dialUp / dialRotate / touchTap / sendToPlugin`）。
   原因见 `references/sdk-api.md`。
5. **后端依赖必须打包**：软件内置的 Node 没有 `ws / log4js`，发布前要用
   `npm run build`（ncc 打包成单文件）。

## 开发流程（务必按顺序执行）

### Step 1 — 厘清需求

把用户的文字需求映射成插件能力。**先回答下面 6 个问题**，信息不足且影响实现时
才向用户提问，能合理默认的就默认并说明：

| 问题 | 影响 |
|------|------|
| 触发的硬件是什么？普通按键 / 旋钮(Knob) / 触摸屏 | `manifest` 的 `Controllers`、用哪些事件 |
| 按下后做什么？运行程序 / 命令 / HTTP / 快捷键 / 开网页 | 后端 `keyUp` 逻辑 |
| 按键上要显示什么？静态图标 / 动态数字 / 动态图 | 是否用 `setImage`/`setTitle`、是否要定时器 |
| 用户需要配置什么？（会变成 Property Inspector 的表单） | PI 的表单项 + `settings` 字段 |
| 需要几个 action（按键类型）？ | `manifest.Actions` 数组长度 |
| 要不要多语言、要不要轮询/定时刷新？ | 语言文件、`setInterval` |

详细的「需求 → 能力」对照见 `references/requirement-mapping.md`。
常见场景的最小代码见 `references/recipes.md`。

### Step 2 — 复制模板并命名

1. 把本 skill 的 `assets/plugin-template/` 整个复制到用户指定位置
   （没指定就放当前工作目录）。
2. 把复制出来的文件夹**重命名**为 `com.<vendor>.streamdock.<name>.sdPlugin`。
3. 模板里需要**同步改名**的耦合点（漏改会导致 action 不工作）：
   - `manifest.json`：`Name / Description / Category / Author / URL`、
     每个 action 的 `UUID / Name / Tooltip`、`PropertyInspectorPath`
   - `plugin/index.js`：`plugin.count` 的属性名 → 改成新 UUID 的最后一段
   - `propertyInspector/count/` 文件夹名 → 改成同一个最后一段
   - 所有 `<lang>.json`：把键 `com.example.streamdock.counter.count` 改成新 UUID
   重命名清单见 `references/build-and-debug.md`。

### Step 3 — 写 manifest.json

按需求增删 `Actions`、设 `Controllers`、`States`、`Settings` 默认值、
`Software.MinimumVersion`、`Nodejs.Version`。字段全集见 `references/manifest.md`。

### Step 4 — 写后端 `plugin/index.js`

为每个 action 写一个 `plugin.<x> = new Actions({...})`，实现需要的事件。
可用 API（`setImage / setTitle / setState / setSettings / showOk / showAlert /
openUrl ...`）见 `references/sdk-api.md`，事件与 payload 见 `references/events.md`。

### Step 5 — 写 Property Inspector

在 `propertyInspector/<x>/index.html` 放表单，`index.js` 里用 `$settings.xxx = ...`
把表单值写回设置（自动持久化）。详见 `references/property-inspector.md`。
**没有配置项就可以删掉 PI**：去掉 manifest 里的 `PropertyInspectorPath`。

### Step 6 — 多语言（可选）

软件按系统语言读取 `<lang>.json`。需要本地化插件/动作名时改对应文件；
模板已含 11 个语言文件（`en`/`zh_CN` 已译，其余 9 个为英文兜底副本，
缺文件会导致对应语言系统下 PI 异常，所以保留全部）。PI 界面文字自动翻译见
`references/property-inspector.md` 的 `$local` 一节。

### Step 7 — 安装依赖、构建、安装

```bash
cd <插件文件夹>/plugin
npm install
npm run build      # ncc 打包 + autofile.js 自动复制到 StreamDock 插件目录
```

`autofile.js` 已同时支持 **Windows 和 macOS**，会按系统自动选择插件目录。

**构建/安装完成后，必须明确提醒用户重启 StreamDock 软件** —— 软件只有重启后
才会加载或刷新插件。这一步要写进你给用户的交付说明里。

无法构建（无 npm / 非目标机器）时，把整个 `.sdPlugin` 文件夹交付给用户，
并附上 `references/build-and-debug.md` 的安装说明（含 Windows/macOS 插件目录）。

### Step 8 — 调试与验证

重启 StreamDock 软件让它识别新插件；用 `references/build-and-debug.md` 的
调试方法（`localhost:23519`、`plugin/log/` 日志）排错。
交付前对照 `references/checklist.md` 自查。

## 参考文档索引

| 文件 | 内容 |
|------|------|
| `references/architecture.md` | 插件结构、进程/WebSocket 通信模型、注册握手 |
| `references/manifest.md` | `manifest.json` 全字段参考 |
| `references/events.md` | 收/发事件全集与 JSON payload |
| `references/sdk-api.md` | 模板内置的 `Plugins/Actions/log` 与前端 API |
| `references/property-inspector.md` | PI 开发：表单、设置持久化、文件选择、i18n |
| `references/build-and-debug.md` | 命名/重命名清单、构建、安装路径、调试 |
| `references/requirement-mapping.md` | 「用户需求 → 插件能力」决策表 |
| `references/recipes.md` | 常见场景的最小可用代码片段 |
| `references/checklist.md` | 交付前自查清单 |

## 常见错误

| 错误 | 后果 / 修法 |
|------|------|
| `plugin.<x>` 名字与 UUID 最后一段不符 | action 收不到事件；改成一致 |
| 直接定义 `willAppear` 而非 `_willAppear` | 覆盖 SDK 拦截器，`this.data` 失效 |
| 忘了 `npm run build` 就发布 | 软件内置 Node 找不到 `ws`，插件起不来 |
| `setImage` 传了不存在的图片路径 | 按键空白；用 SVG dataURL 或确认 `static/` 路径 |
| SVG 用了 `#` 颜色 / 滤镜 / CSS 等高级特性 | 按键空白；StreamDock 只支持 SVG Tiny 1.2，见 `references/recipes.md` |
| 忘了提醒用户重启 StreamDock | 插件不出现/不更新；构建后必须重启软件 |
| PI 文字开了 `$local=true` 但语言文件缺 key | 界面显示 "undefined"；补全或设 `$local=false` |
| 文件夹名不是 `com.*.sdPlugin` 格式 | 软件不识别插件 |
