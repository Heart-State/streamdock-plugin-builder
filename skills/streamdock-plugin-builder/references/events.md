# 事件参考

所有通信都是 JSON 消息。两个方向：**收到的事件**（软件 → 插件/PI）和
**发送的事件**（插件/PI → 软件）。

---

## 一、插件后端收到的事件

后端用模板的 `Actions`/`Plugins` 接收（见 `sdk-api.md`），下面给出原始事件名与
payload 关键字段。所有事件公共字段：`event`、多数还有 `action`、`context`。

### 生命周期

| 事件 | 触发时机 | payload 关键字段 |
|------|----------|-----------------|
| `willAppear` | 动作实例出现在设备上 | `settings`、`coordinates {column,row}`、`controller` |
| `willDisappear` | 动作实例从设备上移除 | 同上 |
| `titleParametersDidChange` | 用户改了标题或标题样式 | `title`、`titleParameters` |

### 输入 — 普通按键

| 事件 | 触发时机 | payload 关键字段 |
|------|----------|-----------------|
| `keyDown` | 按下按键 | `settings`、`coordinates`、`state`、`userDesiredState` |
| `keyUp` | 松开按键（"点击"通常用这个） | 同上 |

### 输入 — 旋钮 / 触摸屏（Knob/Encoder）

| 事件 | 触发时机 | payload 关键字段 |
|------|----------|-----------------|
| `dialDown` | 按下旋钮 | `settings`、`controller` |
| `dialUp` | 松开旋钮 | 同上 |
| `dialRotate` | 旋转旋钮 | `ticks`（正=顺时针，负=逆时针）、`pressed`（旋转时是否按住） |
| `touchTap` | 点触旋钮上方小屏 | `tapPos [x,y]`、`hold`（是否长按） |

### 设置

| 事件 | 触发时机 | payload 关键字段 |
|------|----------|-----------------|
| `didReceiveSettings` | 该动作实例的 settings 变化后 | `settings`、`coordinates` |
| `didReceiveGlobalSettings` | 全局 settings 变化后 / 主动 `getGlobalSettings` 后 | `settings` |

### Property Inspector 相关

| 事件 | 触发时机 | payload |
|------|----------|---------|
| `propertyInspectorDidAppear` | 用户打开了某动作的配置页 | — |
| `propertyInspectorDidDisappear` | 配置页关闭 | — |
| `sendToPlugin` | PI 调用 `sendToPlugin` 发来数据 | 自定义 JSON |

### 设备 / 系统

| 事件 | 触发时机 | payload 关键字段 |
|------|----------|-----------------|
| `deviceDidConnect` | 接入设备 | `deviceInfo {name,type,size}` |
| `deviceDidDisconnect` | 移除设备 | — |
| `applicationDidLaunch` | 被监听的应用启动 | `payload.application` |
| `applicationDidTerminate` | 被监听的应用退出 | `payload.application` |
| `systemDidWakeUp` | 电脑唤醒 | — |

---

## 二、插件后端发送的事件

模板的 `Plugins` 实例已封装成方法（见 `sdk-api.md`），下面给出底层 JSON。

| 事件 | 作用 | JSON |
|------|------|------|
| `setTitle` | 改按键标题 | `{event,context,payload:{title,target,state}}` |
| `setImage` | 改按键图标 | `{event,context,payload:{image,target,state}}` |
| `setState` | 切换多状态动作的状态 | `{event,context,payload:{state}}` |
| `showAlert` | 按键上闪「⚠」 | `{event,context}` |
| `showOk` | 按键上闪「✓」 | `{event,context}` |
| `setSettings` | 持久化该动作实例的数据 | `{event,context,payload:{...}}` |
| `getSettings` | 请求该动作实例的数据 | `{event,context}` |
| `setGlobalSettings` | 持久化全局数据 | `{event,context,payload:{...}}` |
| `getGlobalSettings` | 请求全局数据 | `{event,context}` |
| `sendToPropertyInspector` | 给 PI 发数据 | `{event,action,context,payload:{...}}` |
| `openUrl` | 默认浏览器打开网址 | `{event,payload:{url}}` |
| `logMessage` | 写一条调试日志 | `{event,payload:{message}}` |

`target` 取值：`0`=软件+硬件，`1`=仅硬件，`2`=仅软件。`state` 为多状态动作的目标状态索引。

> **协议事件 ≠ 已封装方法。** 上表是 StreamDock 协议层的事件。模板的 `Plugins`
> 类把其中大部分封装成了同名方法（见 `sdk-api.md`），但**没有**封装
> `getSettings`/`logMessage`。`getSettings` 通常用不到——`willAppear` 已带
> `payload.settings`，之后变化走 `didReceiveSettings`。确实需要时自行发送：
> `plugin.ws.send(JSON.stringify({ event: 'getSettings', context }))`。

---

## 三、Property Inspector 收发的事件

**PI 收到**（在 `index.js` 的 `$propEvent` 里处理）：

| 事件 | 说明 |
|------|------|
| `didReceiveSettings` | 该动作实例的 settings |
| `didReceiveGlobalSettings` | 全局 settings |
| `sendToPropertyInspector` | 插件后端发来的数据 |

**PI 发送**（模板已封装到 `$websocket` / `$settings` 上）：

| 事件 | 作用 |
|------|------|
| `setSettings` | 持久化设置（给 `$settings.x` 赋值即自动触发，无需手动调用） |
| `setGlobalSettings` / `getGlobalSettings` | 全局设置 |
| `sendToPlugin` | 给插件后端发数据 |
| `setTitle` / `setImage` / `setState` | 直接改按键外观 |
| `openUrl` | 打开网址 |

---

## 图像格式说明

`setImage` 的 `image` 接受：

- Base64 dataURL：`data:image/png;base64,...`
- SVG dataURL：`` data:image/svg+xml;charset=utf8,${svg} `` （推荐，省去打包图片）

按键画布约 144×144 像素。
