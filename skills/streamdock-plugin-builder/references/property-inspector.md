# Property Inspector（PI）开发

PI 是用户点「编辑某个按键」时弹出的设置面板。它是一个独立 HTML 页，
位于 `propertyInspector/<action>/index.html`，由 `manifest` 里动作的
`PropertyInspectorPath` 指向。

**如果一个动作没有任何可配置项，就不要 PI**：删掉该动作的
`PropertyInspectorPath` 和对应 `propertyInspector/<action>/` 文件夹即可。

## 结构

每个动作一个子文件夹：

```
propertyInspector/
├── <action>/
│   ├── index.html      # 表单结构
│   └── index.js        # 逻辑：回显 + 持久化
└── utils/              # 共用，所有动作的 PI 共享，勿改
    ├── common.js  action.js  axios.js
    ├── bootstrap.min.css  bootstrap-icons.css
    └── fonts/
```

## index.html 写法

- 内容必须放在 `<div class="sdpi-wrapper">` 里。
- 末尾按固定顺序引入脚本：`common.js → action.js → axios.js → index.js`。
- 样式用内置的 Bootstrap 5（`form-control`、`form-select`、`btn`、`mb-3` 等）。
- 暗色背景，body 样式照模板。

```html
<div class="sdpi-wrapper p-3">
  <div class="mb-3">
    <label class="form-label">Volume</label>
    <input type="num" id="volume" class="form-control" value="50">
  </div>
  <div class="mb-3">
    <label class="form-label">Mode</label>
    <select class="form-select" id="mode">
      <option value="a">A</option>
      <option value="b">B</option>
    </select>
  </div>
</div>
```

常用控件：`input`（text/num/checkbox/file）、`select`、`textarea`、`button`。
`type="num"` 会被自动限制为数字。

## index.js 写法

四件事：定义 `$local/$back/$dom`、定义 `$propEvent` 回显、绑定控件写回
`$settings`、（可选）和后端互发消息。

```js
/// <reference path="../utils/common.js" />
/// <reference path="../utils/action.js" />

const $local = false, $back = false, $dom = {
    main:   $('.sdpi-wrapper'),
    volume: $('#volume'),
    mode:   $('#mode')
};

// 软件 → PI：把持久化的设置回显到表单
const $propEvent = {
    didReceiveSettings({ settings }) {
        $dom.volume.value = settings.volume ?? 50;
        $dom.mode.value   = settings.mode ?? 'a';
    },
    didReceiveGlobalSettings({ settings }) {},
    sendToPropertyInspector(payload) {}
};

// 表单 → 设置：给 $settings 赋值即自动持久化
$dom.volume.on('change', () => { $settings.volume = Number($dom.volume.value); });
$dom.mode.on('change',   () => { $settings.mode = $dom.mode.value; });

// 需要时主动通知后端
// $websocket.sendToPlugin({ action: 'refresh' });
```

### `$local` 与 `$back`

| 变量 | 作用 |
|------|------|
| `$local` | `true` 时启用「PI 文字自动翻译」，见下。单语言插件设 `false` |
| `$back`  | `false` 时收到 `didReceiveSettings` 后自动显示界面；`true` 时由你自己控制 `$dom.main.style.display` |

### `$settings` 自动持久化

`$settings` 是 Proxy，**任何属性赋值都会防抖后自动 `setSettings`**。
不要手动拼 `setSettings` 消息。`$settings` 在首次 `didReceiveSettings` 后才存在，
所以读写它的代码应放在用户交互回调里（那时一定已就绪）。

## PI 文字国际化（`$local`）

开启 `$local = true` 后，`action.js` 会遍历 `sdpi-wrapper` 内所有**文本节点**和
`input/textarea` 的 `placeholder`，用 `<当前语言>.json` 的 `Localization` 表替换。

**坑：** 如果某个文本在某语言文件的 `Localization` 里没有对应 key，会被替换成
字符串 `"undefined"`。

两种安全做法，二选一：

1. **单语言插件**：`$local = false`，直接在 HTML 里写目标语言文字（模板默认）。
2. **多语言插件**：`$local = true`，并保证 HTML 里出现的**每一句**文字，在
   **每一个** `<lang>.json` 的 `Localization` 里都有 key（值可先填英文兜底）。

## 文件选择器

```html
<input type="file" id="bgimg">
```

```js
$emit.on('File-bgimg', (data) => {
    // 用户选完文件，data 是软件返回的文件信息
});
```

`$emit` 的事件名是 `File-` 加上 `<input>` 的 `id`。

## 调试 PI

PI 跑在嵌入式浏览器里，可在 `localhost:23519`（默认）打开 DevTools 调试。
改完 PI 文件后重新打开配置面板即可生效，不必重启软件。详见 `build-and-debug.md`。
