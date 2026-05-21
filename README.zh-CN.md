# StreamDock Plugin Builder Skill

[English](README.md) | **中文**

一个跨平台 **Agent Skill**：让 AI 智能体（Claude Code / Codex）根据用户的
**文字需求**，从内置模板出发，开发一个完整、可安装的 **StreamDock**
（Mirabox Stream Dock，Elgato Stream Deck 的兼容设备）插件。

- 覆盖 `manifest.json`、Node.js 后端、Property Inspector、构建安装全流程
- 内置完整可用的插件模板 + 9 份参考文档 + 常见场景代码片段
- 标准 `SKILL.md` 格式，**Claude Code 与 Codex 通用**

## 安装

### Claude Code（插件市场）

在 Claude Code 里依次执行：

```
/plugin marketplace add Heart-State/streamdock-plugin-builder
/plugin install streamdock-plugin-builder@streamdock-marketplace
```

第一行把本仓库登记为插件市场，第二行从该市场安装插件。新开会话即生效。

### Codex（skill-installer）

在 Codex 里执行：

```
$skill-installer install https://github.com/Heart-State/streamdock-plugin-builder/tree/main/skills/streamdock-plugin-builder
```

Codex 会调用官方脚本把 skill 装进 `~/.codex/skills/`。装完**重启 Codex**生效。

### 手动安装（任意智能体）

把本仓库 `skills/streamdock-plugin-builder/` 文件夹整个复制到对应目录：

- Claude Code：`~/.claude/skills/streamdock-plugin-builder/`
- Codex：`~/.codex/skills/streamdock-plugin-builder/`

## 用法

安装后，直接用自然语言描述需求即可，例如：

> 帮我做一个 StreamDock 插件：按一下按键静音 / 取消静音，按键上显示当前状态。

智能体会自动加载本技能，按流程执行：厘清需求 → 从模板生成 → 实现逻辑 →
构建并安装到 StreamDock。

## 仓库结构

```
streamdock-plugin-builder/
├── .claude-plugin/
│   ├── marketplace.json      # Claude Code 插件市场清单
│   └── plugin.json           # Claude Code 插件清单
├── .codex-plugin/
│   └── plugin.json           # Codex 插件清单
└── skills/
    └── streamdock-plugin-builder/
        ├── SKILL.md          # 技能主文件（智能体入口）
        ├── references/       # 9 份参考文档
        └── assets/
            └── plugin-template/   # 完整可用的插件模板
```

两个智能体共用 `skills/streamdock-plugin-builder/`；`.claude-plugin/` 与
`.codex-plugin/` 只是各自的清单文件，互不影响。

## License

MIT
