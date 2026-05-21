# 需求 → 能力 决策表

把用户的文字需求翻译成具体的 manifest 配置和后端代码选择。

## 1. 这是什么硬件交互？

| 用户描述里出现 | Controllers | 主要事件 |
|----------------|-------------|----------|
| 「按一下」「点击按钮」 | `["Keypad"]` | `keyUp`（或 `keyDown`） |
| 「旋钮」「转动」「调节」「音量旋钮」 | `["Knob"]` | `dialRotate` `dialDown` `dialUp` |
| 「旋钮上的小屏」「触摸屏」 | `["Knob"]` | `touchTap` + 上面那些 |
| 「只显示信息，不用按」 | `["Information"]` | 仅 `_willAppear` + 定时刷新 |

## 2. 按下后做什么？

| 需求 | 实现 |
|------|------|
| 打开一个网页 | `plugin.openUrl(url)` |
| 运行程序 / 执行命令行 | `require('child_process').exec(...)`（Node 子进程，可用任意 Node 能力） |
| 模拟按键 / 快捷键 | 调系统命令或第三方库（如 Windows 用 `nircmd`、PowerShell） |
| 调用 HTTP 接口 | `fetch`（Node 20 内置）或前端打包好的 `axios` |
| 控制系统音量 / 亮度 | 调系统命令（平台相关），在 `keyUp` 里 `exec` |
| 多状态开/关切换 | `manifest` 配 2 个 `States` + `plugin.setState(context, 0/1)` |
| 计数 / 累加 | 存进 `settings`，`setSettings` 持久化 |

> 后端是完整的 Node.js 环境，文件系统、网络、子进程都能用。复杂能力优先用
> `child_process` 调系统命令或现成 CLI 工具。

## 3. 按键上要显示什么？

| 需求 | 实现 |
|------|------|
| 固定图标 | `manifest` 的 `States[].Image` 指向 `static/` 里的图 |
| 一句简单纯文字（且不在意排版/颜色） | `plugin.setTitle(context, text)` |
| 数字、时间、带颜色或排版的内容、图形 | 生成 SVG → `plugin.setImage(context, 'data:image/svg+xml;charset=utf8,'+svg)` |
| 实时刷新（每秒更新） | `_willAppear` 里 `setInterval`，`_willDisappear` 里 `clearInterval` |
| 不同状态不同图 | 多 `States` + `setState`，或直接 `setImage` 换图 |

**setTitle vs setImage 如何选：**

- `setTitle` 最省事，但样式受 `manifest` 里 `States[].FontSize/TitleColor/`
  `TitleAlignment` 限制，且会和「用户自定义标题」冲突。仅适合一句简单文字。
- 想完全掌控外观（颜色、字号、布局、图形、进度条）就用 `setImage` + SVG。
  **本 skill 推荐：除最简单的纯文字外，动态显示一律用 SVG dataURL**——免打包
  图片，画布约 144×144。
- 用 `setImage` 自绘画面时，建议 `manifest` 里该动作设 `UserTitleEnabled: false`，
  避免用户标题盖在你画的内容上；`States[].FontSize` 等字段此时无效，可保留默认。
- SVG 里**不要用 `#` 十六进制颜色**（`#` 会被 data URL 当片段分隔符截断），
  改用 `rgb(...)` 或颜色名。
- StreamDock 的 SVG 渲染器只支持 **SVG Tiny 1.2 子集**：不支持 `<style>`/CSS、
  滤镜、阴影、`paint-order` 等。完整可用/禁用清单见 `recipes.md` 的「SVG 渲染限制」。

## 4. 用户要配置什么？→ Property Inspector

把用户描述里「可调的参数」列出来，每个参数 = PI 里一个表单控件 + 一个
`settings` 字段：

| 参数性质 | 控件 |
|----------|------|
| 文本（URL、路径、消息） | `<input type="text">` |
| 数字（间隔、阈值、音量） | `<input type="num">` |
| 开关 | `<input type="checkbox">` |
| 多选一（模式、设备） | `<select>` |
| 选文件 | `<input type="file">` |
| 多行文本 | `<textarea>` |

没有任何可配置参数 → 不做 PI（删 `PropertyInspectorPath`）。

## 5. 需要几个 action？

- 用户描述里有**几种不同行为的按键** = 几个 action。
  例：「一个开始按钮、一个停止按钮、一个显示用时的按钮」= 3 个 action。
- 行为相同、只是参数不同（如「打开不同网址」）= **1 个 action**，用 PI 配参数。

## 6. 要不要定时 / 轮询？

| 需求 | 实现 |
|------|------|
| 按键显示需周期刷新（时钟、监控） | `_willAppear` 里 `setInterval`，按 `context` 存定时器，`_willDisappear` 清除 |
| 周期性拉取远程数据 | 同上，回调里 `fetch` 后 `setImage/setTitle` |

**务必在 `_willDisappear` 清掉定时器**，否则按键移除后仍在跑、内存泄漏。

## 7. 多语言？

- 用户明确要多语言 → 见 `property-inspector.md` 的 `$local` 一节，补全 `<lang>.json`。
- 没提 → 单语言，PI 设 `$local=false`，语言文件用英文兜底即可。

## 信息不足时

如果用户描述里**影响实现的关键点**缺失（硬件类型、按下的具体行为、要显示什么），
且无法合理默认，再向用户提问。能默认的（图标用占位图、vendor 用 `com.example`、
单语言）就默认并在交付时说明。
