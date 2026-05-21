# StreamDock Plugin Builder Skill

**English** | [中文](README.zh-CN.md)

A cross-platform **Agent Skill** that lets AI agents (Claude Code / Codex) turn
a user's **plain-text request** into a complete, installable **StreamDock**
(Mirabox Stream Dock — an Elgato Stream Deck-compatible device) plugin, starting
from a bundled template.

- Covers the whole flow: `manifest.json`, the Node.js backend, the Property
  Inspector, building and installing
- Bundles a complete working plugin template + 9 reference docs + common-scenario
  code snippets
- Standard `SKILL.md` format — **works with both Claude Code and Codex**

## Installation

### Claude Code (plugin marketplace)

Run these in Claude Code, in order:

```
/plugin marketplace add Heart-State/streamdock-plugin-builder
/plugin install streamdock-plugin-builder@streamdock-marketplace
```

The first line registers this repo as a plugin marketplace; the second installs
the plugin from it. It takes effect in a new session.

### Codex (skill-installer)

Run this in Codex:

```
$skill-installer install https://github.com/Heart-State/streamdock-plugin-builder/tree/main/skills/streamdock-plugin-builder
```

Codex calls its official script to install the skill into `~/.codex/skills/`.
**Restart Codex** afterward for it to take effect.

### Manual install (any agent)

Copy the repo's `skills/streamdock-plugin-builder/` folder as a whole into the
matching directory:

- Claude Code: `~/.claude/skills/streamdock-plugin-builder/`
- Codex: `~/.codex/skills/streamdock-plugin-builder/`

## Usage

After installing, just describe what you want in natural language, for example:

> Make me a StreamDock plugin: pressing the key mutes / unmutes, and the key
> shows the current state.

The agent loads this skill automatically and follows the workflow: clarify the
requirements → generate from the template → implement the logic → build and
install to StreamDock.

## Repository layout

```
streamdock-plugin-builder/
├── .claude-plugin/
│   ├── marketplace.json      # Claude Code plugin marketplace manifest
│   └── plugin.json           # Claude Code plugin manifest
├── .codex-plugin/
│   └── plugin.json           # Codex plugin manifest
└── skills/
    └── streamdock-plugin-builder/
        ├── SKILL.md          # the skill's main file (agent entry point)
        ├── references/       # 9 reference docs
        └── assets/
            └── plugin-template/   # a complete, working plugin template
```

Both agents share `skills/streamdock-plugin-builder/`; `.claude-plugin/` and
`.codex-plugin/` are just the per-agent manifest files and do not affect each
other.

## License

MIT
