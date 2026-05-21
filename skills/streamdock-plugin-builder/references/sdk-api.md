# SDK API 参考（模板内置封装）

模板已内置一层封装，**通常不需要改这些文件**，照下面的用法写业务代码即可。

---

## 后端：`plugin/utils/plugin.js`

`require('./utils/plugin')` 导出 4 个东西：

```js
const { Plugins, Actions, log, EventEmitter } = require('./utils/plugin');
```

### Plugins 类

单例。`const plugin = new Plugins();` 会自动连上软件。
（构造函数不接受参数；旧示例里写的 `new Plugins('xxx')` 中的参数会被忽略。）

**发送方法**（第一个参数多为 `context`）：

| 方法 | 作用 |
|------|------|
| `plugin.setTitle(context, str, row=0, num=6)` | 设标题。`row>0` 时自动按 `num` 字/行折行，超出加 `..` |
| `plugin.setImage(context, url)` | 设按键图标，`url` 为 base64 或 svg dataURL |
| `plugin.setState(context, state)` | 切换多状态动作的状态（0,1,...） |
| `plugin.setSettings(context, payload)` | 持久化该按键实例的数据 |
| `plugin.showOk(context)` | 按键闪「✓」 |
| `plugin.showAlert(context)` | 按键闪「⚠」 |
| `plugin.setGlobalSettings(payload)` | 持久化全局数据 |
| `plugin.getGlobalSettings()` | 请求全局数据（结果走 `didReceiveGlobalSettings`） |
| `plugin.sendToPropertyInspector(payload)` | 给当前打开的 PI 发数据 |
| `plugin.openUrl(url)` | 默认浏览器打开网址 |

**静态属性：**

| 属性 | 含义 |
|------|------|
| `Plugins.language` | 当前软件语言，如 `"zh_CN"` |
| `Plugins.globalSettings` | 最近一次收到的全局设置 |

**插件级事件**：直接往 `plugin` 上挂同名函数即可接收没有 `action` 字段的事件：

```js
plugin.didReceiveGlobalSettings = ({ payload: { settings } }) => { /* ... */ };
plugin.deviceDidConnect = (data) => { /* ... */ };
plugin.systemDidWakeUp = (data) => { /* ... */ };
```

### Actions 类

代表一种动作（一类按键）。**挂在 `plugin` 上的属性名必须等于 action UUID 的最后一段。**

```js
// UUID = com.acme.streamdock.timer.start  →  属性名 start
plugin.start = new Actions({
    default: { /* settings 默认值 */ },
    _willAppear({ context, payload }) {},
    keyUp({ context, payload }) {},
    // ...
});
```

**`this.data[context]`**：每个按键实例的设置。`_willAppear` 和
`didReceiveSettings` 都会把它重置为 `default` 与收到的 `settings` 的合并结果
（`{...default, ...settings}`）。

> 含义：`this.data[context]` 只存放**用户配置**。运行时的临时状态（定时器、
> 倒计时剩余秒数等）请放在模块级变量里（如 `const timers = {}` 按 `context` 存），
> 不要塞进 `this.data[context]`，否则收到 `didReceiveSettings` 时会被覆盖。

**事件处理器命名规则（重要）：**

| 用 `_` 前缀（SDK 拦截后再转发） | 用原名（直接转发） |
|------|------|
| `_willAppear` | `keyDown` `keyUp` |
| `_willDisappear` | `dialDown` `dialUp` `dialRotate` `touchTap` |
| `_didReceiveSettings` | `sendToPlugin` |
| `_propertyInspectorDidAppear` | `propertyInspectorDidDisappear` `titleParametersDidChange` |

原因：`Actions` 类自身定义了 `willAppear/willDisappear/didReceiveSettings/`
`propertyInspectorDidAppear` 四个方法来维护 `this.data`。你**直接**定义同名方法会
覆盖它们，导致 `this.data` 失效。所以这 4 个用 `_` 前缀版；其余事件用原名。

每个处理器收到的 `data` 形如 `{ event, action, context, payload }`，
常用解构：`({ context, payload })`，`payload.settings` 是当前设置。

### log

`log4js` 日志器，写到 `plugin/log/<日期>.log`：

```js
log.info('msg', obj);   log.error('err', e);   log.warn(...);
```

### EventEmitter

简单发布订阅：`subscribe(event, fn)` / `unsubscribe(event, fn)` / `emit(event, data)`。

---

## 前端（Property Inspector）

PI 的 HTML 按固定顺序加载 `common.js → action.js → axios.js → index.js`。
你只写 `index.js`（和 `index.html`）。

### 全局变量（`action.js` 提供）

| 变量 | 含义 |
|------|------|
| `$websocket` | 与软件的 WebSocket |
| `$uuid` | 本 PI 的 UUID |
| `$action` | 所属动作的 UUID |
| `$context` | 所配置按键实例的 context |
| `$settings` | 设置代理对象，**赋值即自动持久化**（防抖） |
| `$lang` | 当前语言的 Localization 对象 |

### `$websocket` 上的方法（`action.js` 提供）

| 方法 | 作用 |
|------|------|
| `$websocket.sendToPlugin(payload)` | 给插件后端发数据 |
| `$websocket.setTitle(str, row, num)` | 设按键标题 |
| `$websocket.setImage(url)` | 设按键图标（会自动转 PNG） |
| `$websocket.setState(state)` | 切换状态 |
| `$websocket.openUrl(url)` | 打开网址 |
| `$websocket.setGlobalSettings(payload)` / `getGlobalSettings()` | 全局设置 |

### 持久化设置：`$settings`

```js
$settings.volume = 50;      // 自动保存（debounce），后端会收到 didReceiveSettings
```

不要直接 `$websocket.send` 存设置，用 `$settings` 即可。

### 接收事件：`$propEvent`

在 `index.js` 里定义 `$propEvent` 对象，软件来的事件按 `event` 名路由进去：

```js
const $propEvent = {
    didReceiveSettings({ settings }) { /* 回显到表单 */ },
    didReceiveGlobalSettings({ settings }) {},
    sendToPropertyInspector(payload) { /* 后端发来的数据 */ }
};
```

### DOM 工具：`$()`（`common.js` 提供）

```js
$('#id')                 // 取单个元素（找不到会抛错），带 .on()/.attr() 方法
$('.cls', true)          // 取多个，返回数组
$('#btn').on('click', fn)
```

其它：`$.debounce(fn, delay)`、`$.throttle(fn, delay)`、事件总线 `$emit`
（`$emit.on(name,fn)` / `$emit.send(name,data)`）。

### 文件选择

`<input type="file" id="logo">` 被点击后，软件返回路径会触发
`$emit.send('File-logo', 数据)`：

```js
$emit.on('File-logo', (data) => { /* data 是选中文件信息 */ });
```

`<input type="num">` 会被 `common.js` 自动限制为只能输入数字。
