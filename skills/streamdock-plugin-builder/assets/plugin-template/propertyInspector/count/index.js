/// <reference path="../utils/common.js" />
/// <reference path="../utils/action.js" />

// $local：是否启用 PI 文本自动翻译（true 时需补全所有语言文件的 Localization）
// $back：是否自行决定界面回显时机（false = 收到 settings 后自动显示）
// $dom：静态 DOM 元素集中在此获取
const $local = false, $back = false, $dom = {
    main: $('.sdpi-wrapper'),
    step: $('#step'),
    count: $('#count'),
    reset: $('#reset')
};

// 软件 → PI 的事件回调
const $propEvent = {
    // 收到该按键的持久化设置：回显到界面
    didReceiveSettings({ settings }) {
        $dom.step.value = settings.step ?? 1;
        $dom.count.value = settings.count ?? 0;
    },
    didReceiveGlobalSettings({ settings }) { },
    // 收到插件后端通过 sendToPropertyInspector 发来的消息
    sendToPropertyInspector(data) { }
};

// 步长输入框 → 写入 settings。给 $settings 赋值会自动持久化(防抖)。
$dom.step.on('change', () => {
    $settings.step = Number($dom.step.value) || 1;
});

// 重置按钮 → 通知插件后端清零（后端在 sendToPlugin 中处理）
$dom.reset.on('click', () => {
    $websocket.sendToPlugin({ reset: true });
});
