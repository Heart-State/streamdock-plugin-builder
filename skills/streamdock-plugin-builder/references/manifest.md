# manifest.json 字段参考

`manifest.json` 位于 `.sdPlugin` 文件夹根目录，声明插件元信息与所有动作。

## 顶层字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `SDKVersion` | Integer | 是 | 固定 `1` |
| `Name` | String | 是 | 插件显示名 |
| `Description` | String | 是 | 插件描述 |
| `Author` | String | 是 | 作者 |
| `Version` | String | 是 | 语义化版本，如 `"1.0.0"` |
| `Icon` | String | 是 | 插件图标路径，128×128 png（不带扩展名也可） |
| `Category` | String | 否 | 动作在软件里的分组名，默认 `Custom` |
| `CategoryIcon` | String | 否 | 分组图标，48×48 |
| `CodePathWin` | String | 是* | Windows 下后端入口，如 `plugin/index.js` |
| `CodePathMac` | String | 是* | macOS 下后端入口 |
| `CodePath` | String | 是* | 跨平台统一入口（与上面二选一组方式） |
| `PropertyInspectorPath` | String | 否 | 全局默认 PI 路径（动作可各自覆盖） |
| `URL` | String | 否 | 插件主页 |
| `OS` | Array | 是 | 支持的平台，见下 |
| `Software` | Object | 是 | StreamDock 软件最低版本 |
| `Nodejs` | Object | 否 | 使用软件内置 Node 时声明，见下 |
| `ApplicationsToMonitor` | Object | 否 | 要监听启动/退出的应用，见下 |

\* `CodePathWin`+`CodePathMac` 或单独 `CodePath`，至少要有能覆盖目标平台的一种。

## Actions 数组

每个动作（一种按键类型）一个对象：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `UUID` | String | 是 | 动作唯一 ID，反向域名，如 `com.acme.streamdock.timer.start`。**最后一段决定后端属性名** |
| `Name` | String | 是 | 动作在动作列表里的名字 |
| `Icon` | String | 是 | 动作列表里的图标，40×40 |
| `Tooltip` | String | 否 | 鼠标悬停提示 |
| `States` | Array | 是 | 外观状态数组，见下；至少 1 个 |
| `Controllers` | Array | 否 | 支持的控制器类型，默认 `["Keypad"]`，见下 |
| `PropertyInspectorPath` | String | 否 | 该动作的配置页 HTML 路径 |
| `Settings` | Object | 否 | settings 初始值（也可在后端 `default` 里给） |
| `DisableAutomaticStates` | Boolean | 否 | `true` 时按键状态不随点击自动切换，由代码用 `setState` 控制 |
| `UserTitleEnabled` | Boolean | 否 | 是否允许用户自定义标题，默认 `true` |
| `SupportedInMultiActions` | Boolean | 否 | 是否能用于「多动作/操作流」，默认 `true` |
| `VisibleInActionsList` | Boolean | 否 | 是否显示在动作列表，默认 `true` |
| `OS` | Array | 否 | 该动作单独限定的平台 |

### Controllers 取值

| 值 | 含义 |
|----|------|
| `"Keypad"` | 普通按键（默认） |
| `"Knob"` 或 `"Encoder"` | 旋钮（可旋转/按下，部分设备带小屏） |
| `"Information"` | 只读展示，不响应点击 |
| `"SecondaryScreen"` | 副屏 |

旋钮动作要用 `dialDown / dialUp / dialRotate / touchTap` 事件（见 `events.md`）。

## States 数组

每个状态描述一种外观。普通动作 1 个状态；开/关型动作 2 个状态（用 `setState` 切换）。

| 字段 | 类型 | 说明 |
|------|------|------|
| `Image` | String | 该状态的背景图路径，72×72 png/svg |
| `Title` | String | 默认标题文字 |
| `ShowTitle` | Boolean | 是否显示标题，默认 `true` |
| `TitleColor` | String | 标题颜色，如 `"#ffffff"` |
| `TitleAlignment` | String | `"top"` / `"bottom"` / `"center"` |
| `FontFamily` | String | 字体 |
| `FontStyle` | String | `"Regular"` / `"Bold"` / `"Italic"` / `"Bold Italic"` |
| `FontSize` | String | 字号，如 `"12"` |
| `FontUnderline` | Boolean | 是否下划线，默认 `false` |

> 若动作用 `setImage` 自绘整张画面（动态数字/图形），`States` 的字体类字段
> （`FontSize/TitleColor/TitleAlignment`）基本无效，可保留默认值；同时建议把动作的
> `UserTitleEnabled` 设为 `false`，避免用户自定义标题盖在自绘内容上。

## OS 数组

```json
"OS": [
  { "Platform": "windows", "MinimumVersion": "10" },
  { "Platform": "mac", "MinimumVersion": "10.15" }
]
```

`Platform` 取 `"windows"` 或 `"mac"`。

## Software 对象

```json
"Software": { "MinimumVersion": "3.10.188.226" }
```

要用内置 Node，Windows 需 `3.10.188.226+`，macOS 需 `3.10.191.0421+`。

## Nodejs 对象

```json
"Nodejs": { "Version": "20", "Debug": "--inspect=127.0.0.1:3210" }
```

| 字段 | 说明 |
|------|------|
| `Version` | 目前仅支持 `"20"`（软件内置 Node 20.8.1） |
| `Debug` | 可选，调试参数，如 `--inspect=127.0.0.1:3210` |

声明 `Nodejs` 后，插件通过软件内置 Node 运行，无需自带 Node 运行时。
**但 `ws`/`log4js` 等 npm 依赖仍需用 `npm run build` 打包进去。**

## ApplicationsToMonitor 对象

```json
"ApplicationsToMonitor": {
  "windows": ["chrome.exe"],
  "mac": ["com.google.Chrome"]
}
```

声明后，这些应用启动/退出会触发 `applicationDidLaunch` / `applicationDidTerminate` 事件。

## 完整示例

见模板 `assets/plugin-template/manifest.json`（单个 Keypad 动作）。
