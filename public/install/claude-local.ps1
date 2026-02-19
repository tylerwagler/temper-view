# claude-local.ps1 — Claude Code wrapper for local AI Stack inference
# All auth, key management, and inference go through a single portal URL.
#
# Usage:
#   .\claude-local.ps1                      # Start Claude Code
#   .\claude-local.ps1 -Login               # Login and get/create API key
#   .\claude-local.ps1 -SetKey <key>        # Set API key manually
#   .\claude-local.ps1 -SetUrl <url>        # Set portal URL
#   .\claude-local.ps1 -Config              # Show current config
#   .\claude-local.ps1 -Update              # Update this script
#   .\claude-local.ps1 -ResetConfig         # Delete configuration

param(
    [switch]$Login,
    [string]$SetKey,
    [string]$SetUrl,
    [switch]$Config,
    [switch]$Update,
    [switch]$ResetConfig,
    [switch]$Help,
    [switch]$Version,
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$ClaudeArgs
)

$ErrorActionPreference = "Stop"

$ScriptVersion = "1.0.2"

$ConfigDir = "$env:USERPROFILE\.config\claude-local"
$ConfigFile = "$ConfigDir\config.ps1"

# --- Config management ---
function Load-Config {
    $script:ApiKey = ""
    $script:PortalUrl = ""
    if (Test-Path $ConfigFile) {
        . $ConfigFile
        $script:ApiKey = $env:CLAUDE_LOCAL_API_KEY
        $script:PortalUrl = $env:CLAUDE_LOCAL_URL
        # Clean up env vars set by dotfile
        Remove-Item Env:\CLAUDE_LOCAL_API_KEY -ErrorAction SilentlyContinue
        Remove-Item Env:\CLAUDE_LOCAL_URL -ErrorAction SilentlyContinue
    }
}

function Save-Config {
    if (-not (Test-Path $ConfigDir)) {
        New-Item -ItemType Directory -Path $ConfigDir -Force | Out-Null
    }
    $lines = @()
    if ($script:ApiKey) {
        $lines += "`$env:CLAUDE_LOCAL_API_KEY = `"$($script:ApiKey)`""
    }
    if ($script:PortalUrl) {
        $lines += "`$env:CLAUDE_LOCAL_URL = `"$($script:PortalUrl)`""
    }
    $lines -join "`n" | Out-File -FilePath $ConfigFile -Encoding UTF8
}

# --- Auth ---
function Invoke-Login {
    param([string]$Url)

    Write-Host "Login to AI Stack" -ForegroundColor Cyan
    Write-Host ""

    $email = Read-Host "Email"
    if (-not $email) {
        Write-Host "Error: Email required" -ForegroundColor Red
        return $null
    }

    $secPassword = Read-Host "Password" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secPassword)
    $password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

    $body = @{ email = $email; password = $password } | ConvertTo-Json

    Write-Host "Authenticating..."
    try {
        $response = Invoke-RestMethod -Uri "$Url/api/v1/auth/login" `
            -Method Post `
            -Headers @{ "Content-Type" = "application/json" } `
            -Body $body `
            -ErrorAction Stop
    }
    catch {
        Write-Host "Authentication failed: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }

    if (-not $response.access_token) {
        Write-Host "Authentication failed." -ForegroundColor Red
        return $null
    }

    $accessToken = $response.access_token
    $keys = $response.api_keys

    if ($keys -and $keys.Count -gt 0) {
        Write-Host ""
        Write-Host "Found $($keys.Count) existing API key(s):" -ForegroundColor Cyan
        for ($i = 0; $i -lt $keys.Count; $i++) {
            $k = $keys[$i]
            $num = $i + 1
            $created = if ($k.created_at) { $k.created_at.ToString("yyyy-MM-dd") } else { "unknown" }
            Write-Host "  $num. $($k.name) (created: $created)"
        }

        Write-Host ""
        $selection = Read-Host "Select a key (1-$($keys.Count)), or press Enter to create a new one"

        if ($selection -match '^\d+$' -and [int]$selection -ge 1 -and [int]$selection -le $keys.Count) {
            Write-Host "Using existing API key." -ForegroundColor Green
            return $keys[[int]$selection - 1].api_key
        }
    }

    # Create new key
    Write-Host "Creating new API key..." -ForegroundColor Yellow
    $keyName = "claude-local-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    $createBody = @{ name = $keyName } | ConvertTo-Json

    try {
        $createResp = Invoke-RestMethod -Uri "$Url/api/v1/auth/keys" `
            -Method Post `
            -Headers @{
                "Authorization" = "Bearer $accessToken"
                "Content-Type" = "application/json"
            } `
            -Body $createBody `
            -ErrorAction Stop
    }
    catch {
        Write-Host "Failed to create API key: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }

    if ($createResp.api_key) {
        Write-Host "Created API key: $keyName" -ForegroundColor Green
        return $createResp.api_key
    }

    Write-Host "Failed to create API key." -ForegroundColor Red
    return $null
}

# --- Load config ---
Load-Config

# --- Handle commands ---
if ($Version) {
    Write-Host "claude-local $ScriptVersion"
    exit 0
}

if ($Help) {
    Write-Host "claude-local.ps1 $ScriptVersion - Claude Code with local AI inference" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\claude-local.ps1 [options] [claude args...]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Login           Login and get/create an API key"
    Write-Host "  -SetKey <key>    Set API key manually"
    Write-Host "  -SetUrl <url>    Set portal URL (e.g., https://ellie.elytrondefense.com)"
    Write-Host "  -Config          Show current configuration"
    Write-Host "  -Update          Update this script from the portal"
    Write-Host "  -ResetConfig     Delete saved configuration"
    Write-Host "  -Version         Show version"
    Write-Host "  -Help            Show this help"
    Write-Host ""
    Write-Host "All other arguments are passed to 'claude' directly."
    exit 0
}

if ($SetKey) {
    $script:ApiKey = $SetKey
    Save-Config
    Write-Host "API key saved." -ForegroundColor Green
    exit 0
}

if ($SetUrl) {
    $script:PortalUrl = $SetUrl
    Save-Config
    Write-Host "Portal URL saved." -ForegroundColor Green
    exit 0
}

if ($Config) {
    Write-Host "Configuration ($ConfigFile):" -ForegroundColor Cyan
    if ($script:ApiKey) {
        Write-Host "  API Key: $($script:ApiKey.Substring(0, [Math]::Min(10, $script:ApiKey.Length)))... (set)" -ForegroundColor Green
    } else {
        Write-Host "  API Key: (not set)" -ForegroundColor Yellow
    }
    Write-Host "  Portal URL: $(if ($script:PortalUrl) { $script:PortalUrl } else { '(not set)' })"
    exit 0
}

if ($ResetConfig) {
    if (Test-Path $ConfigFile) {
        Remove-Item $ConfigFile
        Write-Host "Configuration reset." -ForegroundColor Green
    } else {
        Write-Host "No configuration file found."
    }
    exit 0
}

if ($Update) {
    if (-not $script:PortalUrl) {
        Write-Host "Error: Portal URL not configured. Run: .\claude-local.ps1 -SetUrl <url>" -ForegroundColor Red
        exit 1
    }
    Write-Host "Updating claude-local.ps1 from $($script:PortalUrl)..."
    $scriptPath = $MyInvocation.MyCommand.Path
    Invoke-WebRequest -Uri "$($script:PortalUrl)/install/claude-local.ps1" -OutFile $scriptPath
    Write-Host "Updated successfully." -ForegroundColor Green
    exit 0
}

if ($Login) {
    if (-not $script:PortalUrl) {
        $script:PortalUrl = Read-Host "Portal URL [https://ellie.elytrondefense.com]"
        if (-not $script:PortalUrl) { $script:PortalUrl = "https://ellie.elytrondefense.com" }
    }

    $key = Invoke-Login -Url $script:PortalUrl
    if ($key) {
        $script:ApiKey = $key
        Save-Config
        Write-Host ""
        Write-Host "API key configured successfully!" -ForegroundColor Green
        Write-Host "Config saved to: $ConfigFile"
        Write-Host ""
        Write-Host "Run 'claude-local.ps1' to start Claude Code."
    } else {
        exit 1
    }
    exit 0
}

# --- Ensure URL is set ---
if (-not $script:PortalUrl) {
    $script:PortalUrl = Read-Host "Portal URL [https://ellie.elytrondefense.com]"
    if (-not $script:PortalUrl) { $script:PortalUrl = "https://ellie.elytrondefense.com" }
    Save-Config
}

# --- Check for updates (non-blocking) ---
try {
    $remoteVersion = (Invoke-WebRequest -Uri "$($script:PortalUrl)/install/version" `
        -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop).Content.Trim()
    if ($remoteVersion -and $remoteVersion -ne $ScriptVersion) {
        Write-Host "Update available: $ScriptVersion -> $remoteVersion" -ForegroundColor Yellow
        Write-Host "  Run 'claude-local.ps1 -Update' to update." -ForegroundColor Yellow
        Write-Host ""
    }
} catch {
    # Silently continue if offline
}

# --- Ensure API key is set ---
if (-not $script:ApiKey) {
    Write-Host "No API key configured." -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Would you like to log in now? (y/n)"

    if ($response -match '^[Yy]') {
        $key = Invoke-Login -Url $script:PortalUrl
        if ($key) {
            $script:ApiKey = $key
            Save-Config
            Write-Host ""
            Write-Host "API key configured! Starting Claude Code..." -ForegroundColor Green
            Write-Host ""
        } else {
            exit 1
        }
    } else {
        Write-Host ""
        Write-Host "Run '.\claude-local.ps1 -Login' or '.\claude-local.ps1 -SetKey <key>'" -ForegroundColor Yellow
        exit 1
    }
}

# --- Validate API key ---
Write-Host "Validating API key..." -ForegroundColor Cyan
try {
    $null = Invoke-WebRequest -Uri "$($script:PortalUrl)/api/v1/models" `
        -Headers @{ "Authorization" = "Bearer $($script:ApiKey)" } `
        -Method Get -UseBasicParsing -ErrorAction Stop
    Write-Host "API key valid." -ForegroundColor Green
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401 -or $statusCode -eq 403) {
        Write-Host "API key is invalid or expired." -ForegroundColor Red
        $response = Read-Host "Would you like to log in again? (y/n)"
        if ($response -match '^[Yy]') {
            $key = Invoke-Login -Url $script:PortalUrl
            if ($key) {
                $script:ApiKey = $key
                Save-Config
            } else {
                exit 1
            }
        } else {
            exit 1
        }
    } else {
        Write-Host "Warning: Could not validate API key (HTTP $statusCode). Continuing..." -ForegroundColor Yellow
    }
}

# --- Model selection ---
$hasModel = $false
foreach ($arg in $ClaudeArgs) {
    if ($arg -eq "--model" -or $arg -eq "--help" -or $arg -eq "-h" -or $arg -eq "--version" -or $arg -eq "-v") {
        $hasModel = $true
        break
    }
}

if (-not $hasModel) {
    try {
        # Fetch ready models from public endpoint (no auth needed)
        $modelsResp = Invoke-RestMethod -Uri "$($script:PortalUrl)/api/model/chat-models" `
            -Method Get -ErrorAction Stop

        if ($modelsResp -and $modelsResp.Count -gt 0) {
            if ($modelsResp.Count -eq 1) {
                $m = $modelsResp[0]
                $hostLabel = if ($m.is_local) { "Ellie" } else { "Sparky" }
                $displayName = if ($m.alias) { $m.alias } else { $m.id }
                Write-Host "Using model: $displayName ($hostLabel)" -ForegroundColor Green
                $ClaudeArgs = @("--model", $m.id) + $ClaudeArgs
            } else {
                Write-Host "Select a model:" -ForegroundColor Yellow
                for ($i = 0; $i -lt $modelsResp.Count; $i++) {
                    $m = $modelsResp[$i]
                    $hostLabel = if ($m.is_local) { "Ellie" } else { "Sparky" }
                    $displayName = if ($m.alias) { $m.alias } else { $m.id }
                    Write-Host "  $($i+1)) $displayName ($hostLabel)"
                }
                Write-Host ""
                $sel = Read-Host "Enter number"
                if ($sel -match '^\d+$' -and [int]$sel -ge 1 -and [int]$sel -le $modelsResp.Count) {
                    $selected = $modelsResp[[int]$sel - 1]
                    $ClaudeArgs = @("--model", $selected.id) + $ClaudeArgs
                }
            }
        }
    }
    catch {
        Write-Host "Warning: Could not fetch models list." -ForegroundColor Yellow
    }
}

# --- Launch Claude Code ---
$env:ANTHROPIC_BASE_URL = "$($script:PortalUrl)/api"
$env:ANTHROPIC_API_KEY = $script:ApiKey
$env:CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = "1"

& claude @ClaudeArgs
