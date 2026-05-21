# 常见场景代码片段

下面每段都是 `plugin/index.js` 里某个 `plugin.<x> = new Actions({...})` 的内容。
`<x>` 为 action UUID 的最后一段。需要 PI 的同时给出 PI 片段。

公共头部：

```js
const { Plugins, Actions, log } = require('./utils/plugin');
const plugin = new Plugins();
```

---

## SVG 渲染限制（用 setImage 画 SVG 前必读）

StreamDock 的 SVG 渲染模块**只实现了 SVG Tiny 1.2 子集**，桌面浏览器能渲染的
不少高级特性它不支持。SVG 写错了通常表现为**按键空白**。请遵守：

**可以用：**
- 基本图形：`rect` `circle` `ellipse` `line` `polyline` `polygon` `path`
- 文本：`text` `tspan`（用通用字体名；复杂排版靠手动设 `x`/`y` 坐标）
- 分组与变换：`g`、`transform`（`translate`/`scale`/`rotate`）
- 纯色 `fill`/`stroke`、`opacity`/`fill-opacity`/`stroke-*`
- `linearGradient` / `radialGradient` 渐变、内嵌 `<image>`

**不要用（不渲染或行为不可靠）：**
- `<style>` 标签、CSS 选择器、`class` —— 样式一律写成**元素属性**
- 滤镜 `<filter>`（高斯模糊、`drop-shadow` 阴影等）、`filter` 属性
- `<mask>`、`<clipPath>`、`mix-blend-mode`
- `<foreignObject>`、HTML 内容、`<script>`、CSS/SMIL 动画
- `paint-order` 等 SVG 2 新特性、Web 字体、外部资源引用

**颜色**：用 `rgb(...)` 或颜色名（`white`/`black`…），**不要用 `#` 十六进制**——
`#` 会被 data URL 当作片段分隔符，把整段 SVG 截断。

需要复杂视觉效果时，改在 Node 端用库生成 PNG（转 base64 dataURL 传给 `setImage`），
不要依赖 SVG 滤镜。

---

## 1. 按一下打开网页

PI 让用户填网址，存进 `settings.url`。

```js
plugin.open = new Actions({
    default: { url: 'https://example.com' },
    keyUp({ context }) {
        plugin.openUrl(this.data[context].url);
    }
});
```

PI `index.js`：

```js
const $local = false, $back = false, $dom = { main: $('.sdpi-wrapper'), url: $('#url') };
const $propEvent = {
    didReceiveSettings({ settings }) { $dom.url.value = settings.url ?? ''; },
    didReceiveGlobalSettings() {}, sendToPropertyInspector() {}
};
$dom.url.on('change', () => { $settings.url = $dom.url.value; });
```

---

## 2. 按一下运行命令 / 程序

```js
const { exec } = require('child_process');

plugin.run = new Actions({
    default: { cmd: '' },
    keyUp({ context }) {
        exec(this.data[context].cmd, (err) => {
            if (err) { log.error('exec failed', err); plugin.showAlert(context); }
            else plugin.showOk(context);
        });
    }
});
```

---

## 3. 多状态开关（开/关切换）

`manifest` 里该动作配 2 个 `States`（`States[0]`=关，`States[1]`=开）。

```js
plugin.toggle = new Actions({
    default: { on: false },
    _willAppear({ context }) {
        plugin.setState(context, this.data[context].on ? 1 : 0);
    },
    keyUp({ context }) {
        const s = this.data[context];
        s.on = !s.on;
        plugin.setSettings(context, s);
        plugin.setState(context, s.on ? 1 : 0);
        // 这里执行开/关对应的实际操作
    }
});
```

---

## 4. 实时时钟（定时刷新 + SVG）

```js
const timers = {};
// SVG 里别用 # 十六进制颜色（# 会被 data URL 截断），用 rgb(...) 或颜色名。
const clockSvg = (t) => `data:image/svg+xml;charset=utf8,` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144">` +
    `<rect width="144" height="144" fill="black"/>` +
    `<text x="72" y="85" font-size="30" fill="rgb(0,255,0)" text-anchor="middle">${t}</text></svg>`;

plugin.clock = new Actions({
    _willAppear({ context }) {
        const tick = () => plugin.setImage(context,
            clockSvg(new Date().toLocaleTimeString()));
        tick();
        timers[context] = setInterval(tick, 1000);
    },
    _willDisappear({ context }) {           // 必须清定时器
        clearInterval(timers[context]);
        delete timers[context];
    }
});
```

---

## 5. 旋钮调音量

`manifest` 里该动作 `Controllers: ["Knob"]`。

```js
plugin.volume = new Actions({
    default: { value: 50 },
    _willAppear({ context }) {
        plugin.setTitle(context, this.data[context].value + '%');
    },
    dialRotate({ context, payload }) {
        const s = this.data[context];
        s.value = Math.max(0, Math.min(100, s.value + payload.ticks)); // ticks 正负=方向
        plugin.setSettings(context, s);
        plugin.setTitle(context, s.value + '%');
        // 这里把 s.value 应用到实际音量
    },
    dialDown({ context }) {                 // 按下旋钮：静音之类
        plugin.setTitle(context, 'Mute');
    }
});
```

---

## 6. 定时拉取 HTTP 数据并显示

```js
const timers = {};
plugin.weather = new Actions({
    default: { city: 'Beijing' },
    _willAppear({ context }) {
        const refresh = async () => {
            try {
                const res = await fetch('https://api.example.com/...');
                const data = await res.json();
                plugin.setTitle(context, String(data.temp) + '°');
            } catch (e) { log.error(e); plugin.showAlert(context); }
        };
        refresh();
        timers[context] = setInterval(refresh, 60000);
    },
    _willDisappear({ context }) {
        clearInterval(timers[context]); delete timers[context];
    }
});
```

`fetch` 是 Node 20 内置，无需依赖。

---

## 7. 后端 ↔ PI 互发消息

PI 点按钮通知后端：

```js
// PI index.js
$dom.btn.on('click', () => $websocket.sendToPlugin({ cmd: 'refresh' }));
```

```js
// 后端
plugin.x = new Actions({
    sendToPlugin({ context, payload }) {
        if (payload.cmd === 'refresh') { /* ... */ }
    }
});
```

后端推数据给 PI：

```js
plugin.sendToPropertyInspector({ status: 'ok' });   // 发给当前打开的 PI
```

```js
// PI index.js 的 $propEvent
sendToPropertyInspector(payload) { console.log(payload.status); }
```

---

## 8. 按一下开始 / 再按停止 + 实时刷新（计时器式）

最常见的复合模式：按键既切换「运行/停止」，运行时还实时刷新显示。
**运行态（剩余秒数、定时器句柄）放模块级 map，不要放进 settings**——否则收到
`didReceiveSettings` 时会被覆盖。

```js
const timers = {};                        // context -> setInterval 句柄
const remain = {};                        // context -> 剩余秒数

const mmss = (s) => {
    const m = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `data:image/svg+xml;charset=utf8,` +
        `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144">` +
        `<rect width="144" height="144" fill="rgb(20,20,30)"/>` +
        `<text x="72" y="88" font-size="40" fill="white" text-anchor="middle">${m}:${ss}</text></svg>`;
};

plugin.timer = new Actions({
    default: { minutes: 25 },             // 只有用户配置项进 settings
    _willAppear({ context }) {
        remain[context] = this.data[context].minutes * 60;
        plugin.setImage(context, mmss(remain[context]));
    },
    keyUp({ context }) {
        if (timers[context]) {            // 正在跑 → 停止并归零
            clearInterval(timers[context]);
            delete timers[context];
            remain[context] = this.data[context].minutes * 60;
            plugin.setImage(context, mmss(remain[context]));
        } else {                          // 没在跑 → 开始倒计时
            timers[context] = setInterval(() => {
                remain[context]--;
                plugin.setImage(context, mmss(Math.max(0, remain[context])));
                if (remain[context] <= 0) {       // 倒计时结束
                    clearInterval(timers[context]);
                    delete timers[context];
                    plugin.showOk(context);       // 也可换图/提示
                }
            }, 1000);
        }
    },
    _didReceiveSettings({ context }) {    // PI 改了分钟数：未运行时刷新显示
        if (!timers[context]) {
            remain[context] = this.data[context].minutes * 60;
            plugin.setImage(context, mmss(remain[context]));
        }
    },
    _willDisappear({ context }) {         // 必须清理，按 context 独立
        clearInterval(timers[context]);
        delete timers[context];
        delete remain[context];
    }
});
```

---

## 要点回顾

- 每个 `Actions` 的属性名 = UUID 最后一段。
- 操作具体按键时第一个参数永远是 `context`。
- 用 `setInterval` 一定在 `_willDisappear` 里 `clearInterval`；定时器按 `context` 存。
- 动态画面优先用 SVG dataURL；SVG 里用 `rgb(...)`/颜色名，**别用 `#` 十六进制**。
- `settings` 只放用户配置；运行态（计时、剩余值）放模块级变量，别放 `settings`。
- 改了 settings 要 `setSettings` 才会持久化。
