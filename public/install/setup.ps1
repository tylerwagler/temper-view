# setup.ps1 — Install claude-local on Windows
# Usage: irm https://ellie.elytrondefense.com/install/setup.ps1 | iex
# Or:    irm https://ellie.elytrondefense.com/install/setup.ps1 -OutFile setup.ps1; .\setup.ps1

param(
    [string]$PortalUrl = $(if ($env:PORTAL_URL) { $env:PORTAL_URL } else { "https://ellie.elytrondefense.com" })
)

$ErrorActionPreference = "Stop"

$InstallDir = "$env:USERPROFILE\.local\bin"
$ScriptName = "claude-local.ps1"

Write-Host "=== Claude Local Installer ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Portal URL: $PortalUrl"
Write-Host "Install to: $InstallDir\$ScriptName"
Write-Host ""

# 1. Check if claude CLI is installed
$claudePath = Get-Command claude -ErrorAction SilentlyContinue
if (-not $claudePath) {
    Write-Host "Claude Code CLI not found. Installing..." -ForegroundColor Yellow
    # Windows install for Claude Code
    & npm install -g @anthropic-ai/claude-code
    Write-Host ""
}

# 2. Create install directory
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
}

# 3. Download claude-local.ps1 script
Write-Host "Downloading claude-local.ps1..."
Invoke-WebRequest -Uri "$PortalUrl/install/claude-local.ps1" -OutFile "$InstallDir\$ScriptName"

# 4. Write default config with portal URL
$ConfigDir = "$env:USERPROFILE\.config\claude-local"
$ConfigFile = "$ConfigDir\config.ps1"
if (-not (Test-Path $ConfigFile)) {
    if (-not (Test-Path $ConfigDir)) {
        New-Item -ItemType Directory -Path $ConfigDir -Force | Out-Null
    }
    @"
`$env:CLAUDE_LOCAL_URL = "$PortalUrl"
"@ | Out-File -FilePath $ConfigFile -Encoding UTF8
    Write-Host "Default config written to $ConfigFile"
}

# 5. Add to user PATH if needed
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$InstallDir*") {
    [Environment]::SetEnvironmentVariable("Path", "$InstallDir;$userPath", "User")
    $env:Path = "$InstallDir;$env:Path"
    Write-Host "Added $InstallDir to user PATH"
}

Write-Host ""
Write-Host "Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Get started:" -ForegroundColor Cyan
Write-Host "  claude-local.ps1 -Login    # Authenticate with your AI Stack account"
Write-Host "  claude-local.ps1            # Start Claude Code with local inference"
Write-Host ""
Write-Host "If 'claude-local.ps1' is not found, restart your terminal." -ForegroundColor Yellow
