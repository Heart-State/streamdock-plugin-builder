# 把 streamdock-plugin-builder skill 安装到 Codex 的 skills 目录。
# 用法：irm <raw-url>/scripts/install-codex.ps1 | iex
$ErrorActionPreference = "Stop"

$Repo  = "https://github.com/Heart-State/streamdock-plugin-builder.git"
$Skill = "streamdock-plugin-builder"
$Dest  = "$env:USERPROFILE\.codex\skills\$Skill"
$Tmp   = Join-Path $env:TEMP ("sdpb-" + [guid]::NewGuid().ToString())

try {
    Write-Host "Cloning $Repo ..."
    git clone --depth 1 $Repo $Tmp

    New-Item -ItemType Directory -Force "$env:USERPROFILE\.codex\skills" | Out-Null
    if (Test-Path $Dest) { Remove-Item -Recurse -Force $Dest }
    Copy-Item -Recurse "$Tmp\skills\$Skill" $Dest

    Write-Host "✅ 已安装到 $Dest"
    Write-Host "重启 Codex 或新开会话即可使用。"
} finally {
    if (Test-Path $Tmp) { Remove-Item -Recurse -Force $Tmp }
}
