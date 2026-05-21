# 命名、构建、安装、调试

## 一、命名规则

| 对象 | 规则 | 例 |
|------|------|----|
| 插件文件夹 | `com.<vendor>.streamdock.<name>.sdPlugin`，全小写 | `com.acme.streamdock.timer.sdPlugin` |
| 插件 ID 前缀 | 文件夹名去掉 `.sdPlugin` | `com.acme.streamdock.timer` |
| action UUID | 在插件 ID 后再加一段 | `com.acme.streamdock.timer.start` |

## 二、从模板改名清单（耦合点，漏一个都会出问题）

复制 `assets/plugin-template/` 后，假设新插件 ID 为
`com.acme.streamdock.timer`、动作 UUID 为 `com.acme.streamdock.timer.start`：

- [ ] 文件夹改名为 `com.acme.streamdock.timer.sdPlugin`
- [ ] `manifest.json`：`Name / Description / Category / Author / URL`
- [ ] `manifest.json`：动作的 `UUID` → `com.acme.streamdock.timer.start`
- [ ] `manifest.json`：动作的 `Name / Tooltip`
- [ ] `manifest.json`：动作的 `PropertyInspectorPath` → `propertyInspector/start/index.html`
- [ ] `plugin/index.js`：`plugin.count` → `plugin.start`（= UUID 最后一段）
- [ ] `plugin/package.json`：`name / author / description`（不改也能跑，仅为整洁）
- [ ] PI 文件夹 `propertyInspector/count/` → `propertyInspector/start/`
- [ ] 所有 `<lang>.json`：键 `com.example.streamdock.counter.count` → 新 UUID
- [ ] 所有 `<lang>.json`：`Name / Description / Category`
- [ ] 替换图标 `static/App-logo.svg`（128×128 png；可沿用占位图先跑通）

> 多个动作时，每个动作都要有自己的 UUID、`plugin.<x>`、PI 文件夹、语言键。

## 三、安装依赖与构建

软件内置的 Node 没有 `ws / log4js`，**发布前必须打包**。

```bash
cd <插件文件夹>/plugin
npm install        # 装 fs-extra log4js ws + 构建工具 @vercel/ncc
npm run build      # = npx ncc 打包成单文件 + node autofile.js 自动安装
```

`npm run build` 做两件事：
1. `ncc` 把 `index.js` 和所有依赖打包成单个 `build/index.js`；
2. `autofile.js` 把整个 `.sdPlugin` 文件夹（用打包结果替换 `plugin/`）复制到
   StreamDock 的插件目录。

> 国内网络装不上 ncc 时，可改用 `npm install --registry=https://registry.npmmirror.com`。

## 四、插件安装目录

| 系统 | 路径 |
|------|------|
| Windows | `%APPDATA%\HotSpot\StreamDock\plugins\` |
| macOS | `~/Library/Application Support/HotSpot/StreamDock/plugins/` |

`autofile.js` 已按系统自动选择。也可手动把 `.sdPlugin` 文件夹整个拷进去。

**不构建的开发模式**：在 `plugin/` 里 `npm install` 后，把整个 `.sdPlugin`
文件夹（含 `plugin/node_modules`）手动拷到上面的目录——这样无需打包也能跑，
但体积大，仅适合本机调试。

## 五、让软件识别插件

**每次构建 / 更新插件后，都要重启 StreamDock 软件**，它才会加载或刷新插件。
（仅改了 Property Inspector 时不必重启，重开配置面板即可——见第六节。）

`npm run build` 结束时 `autofile.js` 也会打印「请重启 StreamDock」提示。
重启后插件出现在动作列表的 `Category` 分组下，拖到按键上即可使用。

> 交付时务必把「重启 StreamDock」这一步明确写给用户，否则用户会以为插件没装上。

## 六、调试

| 对象 | 方法 |
|------|------|
| 后端 `plugin/index.js` | 看日志文件 `plugin/log/<日期>.log`（`log.info/error` 输出）。也可在 `manifest.Nodejs.Debug` 填 `--inspect=127.0.0.1:3210` 后用 Chrome `chrome://inspect` 连 |
| Property Inspector | 浏览器打开 `http://localhost:23519/`，里面能看到 PI 页面并用 DevTools 调试 |

改动后：
- 改了**后端**代码 → 重新 `npm run build`，并重启软件（或重新加载插件）。
- 改了**PI** 代码 → 重新打开按键的配置面板即可，无需重启。

## 七、常见报错排查

| 现象 | 原因 / 排查 |
|------|------|
| 插件不出现在动作列表 | 文件夹名不符 `com.*.sdPlugin`；`manifest.json` 语法错；没重启软件 |
| 动作能拖上去但毫无反应 | `plugin.<x>` 名字 ≠ UUID 最后一段；后端进程崩了，看 `log/` |
| 后端启动即退出 | 没 `npm run build`，内置 Node 找不到 `ws/log4js`；看 `log/` 的 Uncaught Exception |
| 按键空白 | `setImage` 路径/格式错；SVG 用了 `#` 颜色或 SVG Tiny 1.2 不支持的特性（见 `recipes.md`）；`States[].Image` 指向不存在的文件 |
| 构建后插件没出现/没更新 | 没重启 StreamDock 软件 |
| PI 一片空白或显示 "undefined" | `$local=true` 但语言文件缺 key；JS 报错（开 `localhost:23519` 看 Console） |
| 改了代码没生效 | 后端忘了重新 build；插件目录里是旧副本 |
