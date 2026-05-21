# 交付前自查清单

完成插件后逐项核对。

## 命名与结构

- [ ] 插件文件夹名为 `com.<vendor>.streamdock.<name>.sdPlugin`，全小写
- [ ] `manifest.json` 是合法 JSON（无多余逗号、引号配对）
- [ ] 每个 action 的 `UUID` 唯一，且以插件 ID 为前缀
- [ ] 每个 `plugin.<x>` 的 `<x>` = 对应 action UUID 的最后一段
- [ ] 每个有 PI 的 action：`PropertyInspectorPath` 指向真实存在的 HTML
- [ ] PI 文件夹名与 UUID 最后一段一致
- [ ] `static/` 里的图标文件真实存在，`manifest` 路径都能对上

## manifest

- [ ] `CodePathWin` / `CodePathMac`（或 `CodePath`）指向 `plugin/index.js`
- [ ] `OS` 覆盖目标平台
- [ ] `Software.MinimumVersion` 已设（用内置 Node 时 Windows ≥ 3.10.188.226）
- [ ] 用内置 Node 则有 `Nodejs: { "Version": "20" }`
- [ ] 每个 action 至少 1 个 `States`

## 后端 plugin/index.js

- [ ] 生命周期事件用 `_` 前缀（`_willAppear` 等），输入事件用原名（`keyUp` 等）
- [ ] 用了 `setInterval` 的都在 `_willDisappear` 里清掉
- [ ] 操作按键的 API 第一个参数是 `context`
- [ ] 改了 `settings` 的地方调用了 `setSettings` 持久化
- [ ] 异常有 `try/catch` 或错误回调，失败时 `showAlert`
- [ ] 用 SVG 时只用 SVG Tiny 1.2 支持的特性；颜色用 `rgb()`/颜色名，不用 `#`

## Property Inspector

- [ ] 内容在 `<div class="sdpi-wrapper">` 内
- [ ] 脚本顺序：`common.js → action.js → axios.js → index.js`
- [ ] `$propEvent.didReceiveSettings` 把设置回显到了表单
- [ ] 表单控件变化时写回了 `$settings`
- [ ] `$local=true` 时所有语言文件 `Localization` 补全；否则设 `$local=false`

## 语言文件

- [ ] 11 个 `<lang>.json` 都在（缺失会导致对应语言系统下 PI 异常）
- [ ] 每个语言文件里的 action key = 真实 action UUID
- [ ] `en.json` 至少填好兜底文本

## 构建与运行

- [ ] `plugin/` 下 `npm install` 成功
- [ ] `npm run build` 成功，生成了 `build/index.js`
- [ ] 已重启 StreamDock 软件
- [ ] 插件已出现在 StreamDock 软件的动作列表里
- [ ] 拖到按键上，核心功能按需求工作
- [ ] `plugin/log/` 里没有未处理异常

## 交付物

- [ ] 告知用户插件文件夹位置
- [ ] **明确提醒用户：装好/更新插件后要重启 StreamDock 软件**
- [ ] 若未能在本机构建/安装，附上 `build-and-debug.md` 的安装步骤（含 Win/Mac 路径）
- [ ] 说明做了哪些默认假设（vendor 名、占位图标、单语言等）
