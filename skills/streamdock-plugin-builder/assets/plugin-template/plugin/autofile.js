// 自动化安装脚本：把当前 .sdPlugin 目录复制到 StreamDock 的插件目录
// 由 `npm run build` 在 ncc 打包后调用。
const path = require('path');
const os = require('os');
const fs = require('fs-extra');

console.log('开始执行自动化构建...');

const parentDir = path.resolve(__dirname, '..');   // .sdPlugin 目录
const PluginName = path.basename(parentDir);        // 文件夹名 = 插件 ID

// 插件安装目录（随操作系统不同）
const pluginsRoot = process.platform === 'darwin'
    ? path.join(os.homedir(), 'Library/Application Support/HotSpot/StreamDock/plugins')
    : path.join(process.env.APPDATA, 'HotSpot/StreamDock/plugins');
const PluginPath = path.join(pluginsRoot, PluginName);

// 复制时要排除的路径（开发态文件，不进入安装包）
const skip = [
    path.join('plugin', 'node_modules'),
    path.join('plugin', 'index.js'),
    path.join('plugin', 'package.json'),
    path.join('plugin', 'package-lock.json'),
    path.join('plugin', 'pnpm-lock.yaml'),
    path.join('plugin', 'yarn.lock'),
    path.join('plugin', 'build'),
    path.join('plugin', 'log'),
    '.git',
    '.vscode'
];

try {
    fs.removeSync(PluginPath);                      // 删除旧版本
    fs.ensureDirSync(path.dirname(PluginPath));

    // 复制整个 .sdPlugin 目录（排除开发态文件）
    fs.copySync(parentDir, PluginPath, {
        filter: (src) => {
            const rel = path.relative(parentDir, src);
            return !skip.some(s => rel === s || rel.startsWith(s + path.sep));
        }
    });

    // 把 ncc 打包后的 build/index.js 放到安装包的 plugin/ 目录
    fs.copySync(path.join(__dirname, 'build'), path.join(PluginPath, 'plugin'));

    console.log(`插件 "${PluginName}" 已安装到 "${PluginPath}"`);
    console.log('构建成功 -------------');
    console.log('');
    console.log('⚠  请重启 StreamDock 软件，插件才会被加载/刷新。');
} catch (err) {
    console.error(`复制出错 "${PluginName}":`, err);
}
