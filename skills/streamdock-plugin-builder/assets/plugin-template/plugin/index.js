// ============================================================
//  插件后端入口 —— 以 Node.js 子进程方式被 StreamDock 启动
//  这是一个"点击计数器"示例。改造步骤见 SKILL.md。
// ============================================================
const { Plugins, Actions, log } = require('./utils/plugin');

// 创建插件实例（单例）。构造函数不接受参数。
const plugin = new Plugins();

// ───────────────── 插件级事件（可选） ─────────────────
// 收到全局设置（所有 action 实例共享、跨设备持久化的数据）
plugin.didReceiveGlobalSettings = ({ payload: { settings } }) => {
    log.info('didReceiveGlobalSettings', settings);
};

// ───────────────── 工具函数 ─────────────────
// 把数字渲染成一张 SVG 图片，用作按键背景（无需打包图片资源）。
// 注意：SVG 里不要用 # 十六进制颜色（# 会被 data URL 当作片段分隔符截断），
// 用 rgb(...) 或颜色名（white/black 等）。
const renderCount = (n) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144">
        <rect width="144" height="144" fill="rgb(30,30,46)"/>
        <text x="72" y="92" font-family="Arial" font-size="64" font-weight="bold"
              fill="rgb(255,255,255)" text-anchor="middle">${n}</text>
    </svg>`;
    return `data:image/svg+xml;charset=utf8,${svg}`;
};

// ───────────────── Action：计数器 ─────────────────
// 关键约定：属性名（这里是 count）必须等于 action UUID 的最后一段。
// action UUID = com.example.streamdock.counter.count  →  plugin.count
plugin.count = new Actions({
    // settings 的默认值；按键首次出现时与持久化数据合并存入 this.data[context]
    default: { count: 0, step: 1 },

    // 按键出现在设备上：用当前计数初始化显示
    _willAppear({ context }) {
        const { count } = this.data[context];
        plugin.setImage(context, renderCount(count));
    },

    // 按下并松开按键：计数 +step → 持久化 → 刷新显示
    keyUp({ context }) {
        const settings = this.data[context];
        settings.count += settings.step;
        plugin.setSettings(context, settings);                // 持久化
        plugin.setImage(context, renderCount(settings.count));
        plugin.showOk(context);                               // 按键上闪一个对勾
    },

    // 属性检查器(PI)通过 sendToPlugin 发来的消息（这里用于"重置"按钮）
    sendToPlugin({ context, payload }) {
        if (payload && payload.reset) {
            const settings = this.data[context];
            settings.count = 0;
            plugin.setSettings(context, settings);
            plugin.setImage(context, renderCount(0));
        }
    },

    // PI 修改 settings 后回传 didReceiveSettings：刷新显示
    _didReceiveSettings({ context }) {
        const { count } = this.data[context];
        plugin.setImage(context, renderCount(count));
    },

    // 按键从设备移除：在这里清理定时器等资源
    _willDisappear({ context }) {
    }
});
