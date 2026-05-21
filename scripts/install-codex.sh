#!/usr/bin/env bash
# 把 streamdock-plugin-builder skill 安装到 Codex 的 skills 目录。
# 用法：curl -fsSL <raw-url>/scripts/install-codex.sh | bash
set -euo pipefail

REPO="https://github.com/Heart-State/streamdock-plugin-builder.git"
SKILL="streamdock-plugin-builder"
DEST="$HOME/.codex/skills/$SKILL"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Cloning $REPO ..."
git clone --depth 1 "$REPO" "$TMP"

mkdir -p "$HOME/.codex/skills"
rm -rf "$DEST"
cp -r "$TMP/skills/$SKILL" "$DEST"

echo "✅ 已安装到 $DEST"
echo "重启 Codex 或新开会话即可使用。"
