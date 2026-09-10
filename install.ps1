#Requires -Version 5.1
[CmdletBinding()]
param(
    [Alias("v")]
    [string]$Version = $env:VERSION,
    [switch]$NoModifyPath,
    [switch]$Help
)

$ErrorActionPreference = "Stop"
$Repo = "and2049/tacocode"

if ($Help) {
    Write-Host @"
Taco Code Installer

Usage: install.ps1 [-Version <version>] [-NoModifyPath] [-Help]

Environment:
    VERSION                Release version (defaults to latest)
    TACOCODE_INSTALL_DIR   Destination (defaults to ~/.redsun/bin)

Examples:
    irm https://github.com/$Repo/releases/latest/download/install.ps1 | iex
    & ([scriptblock]::Create((irm https://github.com/$Repo/releases/latest/download/install.ps1))) -Version 0.1.0

Taco Code requires redsun on PATH, or an explicit --server URL.
"@
    return
}

if ($env:OS -ne "Windows_NT") { throw "Use the Bash installer on Linux and macOS." }
$Architecture = $env:PROCESSOR_ARCHITEW6432
if (-not $Architecture) { $Architecture = $env:PROCESSOR_ARCHITECTURE }
$Arch = switch ($Architecture) {
    "AMD64" { "x64" }
    "ARM64" { "arm64" }
    default { throw "Unsupported architecture: $Architecture. Expected x64 or arm64." }
}
if (-not (Get-Command tar.exe -ErrorAction SilentlyContinue)) { throw "tar.exe is required (included in current Windows releases)." }
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

# Pin both downloads to the same release, even if latest changes during installation.
if (-not $Version) {
    $Release = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/latest"
    $Version = $Release.tag_name
    if (-not $Version) { throw "Could not determine the latest release." }
}
$Version = $Version -creplace '^v', ''
if ($Version -cnotmatch '^[0-9][0-9A-Za-z.+-]*$') { throw "Invalid release version: $Version" }
$Filename = "tacocode-windows-$Arch.tar.gz"
$Url = "https://github.com/$Repo/releases/download/v$Version"
$InstallDir = $env:TACOCODE_INSTALL_DIR
if (-not $InstallDir) { $InstallDir = Join-Path $env:USERPROFILE ".redsun\bin" }
if (-not [IO.Path]::IsPathRooted($InstallDir)) { throw "TACOCODE_INSTALL_DIR must be an absolute path." }
$InstallDir = [IO.Path]::GetFullPath($InstallDir)
$TmpDir = Join-Path ([IO.Path]::GetTempPath()) ("tacocode-install-" + [Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $TmpDir | Out-Null

try {
    Write-Host "Installing Taco Code v$Version (windows-$Arch)"
    $Archive = Join-Path $TmpDir $Filename
    $Checksum = Join-Path $TmpDir "checksum"
    Invoke-WebRequest -Uri "$Url/$Filename" -OutFile $Archive -UseBasicParsing
    Invoke-WebRequest -Uri "$Url/$Filename.sha256" -OutFile $Checksum -UseBasicParsing
    $Entry = (Get-Content -LiteralPath $Checksum -Raw).Trim()
    if ($Entry -notmatch ('^([0-9a-fA-F]{64})  ' + [regex]::Escape($Filename) + '$')) {
        throw "Invalid checksum file."
    }
    $ExpectedHash = $Matches[1]
    if ((Get-FileHash -LiteralPath $Archive -Algorithm SHA256).Hash -ne $ExpectedHash) {
        throw "Archive checksum verification failed."
    }
    & tar.exe -xzf $Archive -C $TmpDir
    if ($LASTEXITCODE -ne 0) { throw "Archive extraction failed." }
    $Binary = Join-Path $TmpDir "tacocode.exe"
    if (-not (Test-Path -LiteralPath $Binary -PathType Leaf)) { throw "Archive does not contain tacocode.exe." }
    & $Binary --version
    if ($LASTEXITCODE -ne 0) { throw "Executable check failed." }
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    Copy-Item -LiteralPath $Binary -Destination (Join-Path $InstallDir "tacocode.exe") -Force
} finally {
    Remove-Item -LiteralPath $TmpDir -Recurse -Force
}

if (-not $NoModifyPath) {
    $UserPath = [Environment]::GetEnvironmentVariable("PATH", "User")
    if (($UserPath -split ';') -notcontains $InstallDir) {
        [Environment]::SetEnvironmentVariable("PATH", "$InstallDir;$UserPath", "User")
        Write-Host "Added Taco Code to user PATH."
    }
    if (($env:PATH -split ';') -notcontains $InstallDir) { $env:PATH = "$InstallDir;$env:PATH" }
}
if ($env:GITHUB_ACTIONS -eq "true" -and $env:GITHUB_PATH) {
    Add-Content -LiteralPath $env:GITHUB_PATH -Value $InstallDir -Encoding utf8
}
Write-Host "`nInstalled $(Join-Path $InstallDir 'tacocode.exe')"
if ($NoModifyPath) { Write-Host "Add $InstallDir to PATH if needed." }
$Redsun = if ($env:REDSUN_BIN) { $env:REDSUN_BIN } else { "redsun" }
if (-not (Get-Command $Redsun -ErrorAction SilentlyContinue)) {
    Write-Host "`nFor local sessions, install redsun first:"
    Write-Host "  irm https://github.com/and2049/redsun/releases/latest/download/install.ps1 | iex"
}
Write-Host "`nRun: tacocode [project-directory]"
