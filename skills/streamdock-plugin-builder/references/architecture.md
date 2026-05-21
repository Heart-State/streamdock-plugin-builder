# 架构与通信模型

## 一个插件是什么

一个 StreamDock 插件就是一个文件夹，名字必须形如
`com.<vendor>.streamdock.<name>.sdPlugin`（反向域名、全小写、`.sdPlugin` 结尾）。
软件从「插件目录」加载所有这样的文件夹。

```
com.acme.streamdock.timer.sdPlugin/
├── manifest.json              # 声明文件：插件/动作/平台/Node 版本
├── en.json, zh_CN.json, ...   # 多语言文本（按系统语言加载）
├── static/                    # 图标等静态资源
│   └── App-logo.svg
├── plugin/                    # ★ 后端：Node.js 子进程
│   ├── index.js               #   入口（manifest.CodePath 指向它）
│   ├── package.json           #   依赖与构建脚本
│   ├── autofile.js            #   构建后自动安装脚本
│   └── utils/plugin.js        #   SDK 封装（Plugins/Actions/log）
└── propertyInspector/         # ★ 前端：动作配置界面（HTML）
    ├── <action>/index.html    #   某个动作的设置页
    ├── <action>/index.js
    └── utils/                 #   前端 SDK 封装 + 第三方库
        ├── common.js          #   $ 选择器、防抖节流等
        ├── action.js          #   WebSocket 封装、connectElgato* 入口
        ├── axios.js           #   打包好的 axios（可选用于 HTTP）
        └── bootstrap*.css     #   样式
```

## 三个角色

| 角色 | 形态 | 职责 |
|------|------|------|
| **StreamDock 软件** | 桌面程序 | 调度中心；启动插件进程、转发所有事件 |
| **插件后端** | Node.js 子进程 | 业务逻辑；处理按键、改图标、调系统/网络 |
| **Property Inspector (PI)** | 嵌入式浏览器里的 HTML 页 | 让用户配置某个动作的设置 |

后端和 PI **不能直接通信**，所有消息都经软件中转
（`sendToPlugin` / `sendToPropertyInspector`）。

## 启动与注册（后端）

软件以子进程方式运行 `plugin/index.js`，通过命令行参数传入连接信息。
关键参数（`process.argv` 下标）：

| 下标 | 含义 |
|------|------|
| `argv[3]` | WebSocket 端口 |
| `argv[5]` | 本插件的注册 UUID（用作注册握手的 uuid，也用作 `context`） |
| `argv[7]` | 注册事件名（registerPlugin） |
| `argv[9]` | info JSON 字符串，含 `application.language` 等 |

模板的 `utils/plugin.js` 已封装好握手：

```js
this.ws = new ws("ws://127.0.0.1:" + process.argv[3]);
this.ws.on('open', () =>
    this.ws.send(JSON.stringify({ uuid: process.argv[5], event: process.argv[7] })));
```

注册成功后，软件就会把 `willAppear / keyDown / keyUp / ...` 等事件推过来。

## 启动与注册（Property Inspector）

PI 是一个普通 HTML 页。软件加载它后会调用全局函数：

```js
connectElgatoStreamDeckSocket(inPort, inUUID, inRegisterEvent, inInfo, inActionInfo)
```

模板的 `utils/action.js` 已实现该函数：建立 WebSocket、注册、解析出
`$uuid / $action / $context`，并把 `didReceiveSettings` 里的设置包装成可自动
持久化的 `$settings` 代理对象。

> 函数名带 "Elgato" 是为了兼容 Elgato Stream Deck 生态，StreamDock 沿用同名。

## 事件驱动模型

一切都是事件。两个方向：

- **软件 → 插件/PI**：`willAppear`、`keyUp`、`dialRotate`、`didReceiveSettings`…
  （完整列表见 `events.md`）
- **插件/PI → 软件**：`setImage`、`setTitle`、`setSettings`、`showOk`、`openUrl`…

消息都是 JSON，典型结构：

```json
{ "event": "keyUp",
  "action": "com.acme.streamdock.timer.start",
  "context": "<按键实例唯一标识>",
  "payload": { "settings": {}, "coordinates": {"column":1,"row":2} } }
```

## 三个核心标识，别搞混

| 标识 | 是什么 | 用途 |
|------|--------|------|
| **plugin UUID** | `manifest` 顶层不直接写，由文件夹名体现 | 插件身份 |
| **action UUID** | `manifest.Actions[].UUID`，如 `com.acme.streamdock.timer.start` | 动作类型身份；事件路由靠它最后一段 |
| **context** | 运行时由软件生成的不透明字符串 | 「设备上某一个具体按键实例」。同一动作拖到设备上 3 次 = 3 个 context |

后端把每个 `context` 的设置存在 `Actions` 实例的 `this.data[context]` 里，
所以「针对某个按键」操作时第一个参数永远是 `context`。

## SDK 封装层（模板已内置，通常不需要改）

| 文件 | 提供 |
|------|------|
| `plugin/utils/plugin.js` | `Plugins`（连接+发送方法）、`Actions`（动作+生命周期）、`log`（日志）、`EventEmitter` |
| `propertyInspector/utils/action.js` | `connectElgatoStreamDeckSocket`、`WebSocket` 上的 `setTitle/setImage/sendToPlugin/...`、`$settings` 代理 |
| `propertyInspector/utils/common.js` | `$()` DOM 选择器、`$.debounce/$.throttle`、`$emit` 事件总线 |

API 细节见 `sdk-api.md`。
