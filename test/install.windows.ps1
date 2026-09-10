# Exercise the installer with the actual Windows release archive and local downloads.
param([Parameter(Mandatory = $true)][string]$Target)
$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$Filename = "tacocode-$Target.tar.gz"
$Archive = Join-Path $Root "dist/release/$Filename"
$Sandbox = Join-Path ([IO.Path]::GetTempPath()) ("tacocode-installer-test-" + [Guid]::NewGuid().ToString("N"))
$Destination = Join-Path $Sandbox "Taco's bin"
$Saved = @{}
foreach ($Name in @("TACOCODE_INSTALL_DIR", "VERSION", "GITHUB_ACTIONS", "TEMP", "TMP")) {
    $Saved[$Name] = [Environment]::GetEnvironmentVariable($Name, "Process")
}
$OriginalPath = $env:PATH
$OriginalUserPath = [Environment]::GetEnvironmentVariable("PATH", "User")
$script:Requests = @()
$script:BadChecksum = $false

function Invoke-RestMethod {
    param([string]$Uri)
    if ($Uri -ne "https://api.github.com/repos/and2049/tacocode/releases/latest") { throw "Unexpected URL: $Uri" }
    $script:Requests += $Uri
    return @{ tag_name = "v0.1.0" }
}

function Invoke-WebRequest {
    param([string]$Uri, [string]$OutFile, [switch]$UseBasicParsing)
    $script:Requests += $Uri
    $Base = "https://github.com/and2049/tacocode/releases/download/v0.1.0/$Filename"
    if ($Uri -eq $Base) {
        Copy-Item -LiteralPath $Archive -Destination $OutFile
    } elseif ($Uri -eq "$Base.sha256") {
        if ($script:BadChecksum) {
            Set-Content -LiteralPath $OutFile -Value (("0" * 64) + "  $Filename") -Encoding ascii
        } else {
            Copy-Item -LiteralPath "$Archive.sha256" -Destination $OutFile
        }
    } else { throw "Unexpected URL: $Uri" }
}

try {
    New-Item -ItemType Directory -Path $Sandbox | Out-Null
    $env:TACOCODE_INSTALL_DIR = $Destination
    $env:VERSION = ""
    $env:GITHUB_ACTIONS = "false"
    $env:TEMP = $Sandbox
    $env:TMP = $Sandbox
    & (Join-Path $Root "install.ps1") -NoModifyPath
    $Binary = Join-Path $Destination "tacocode.exe"
    if (-not (Test-Path -LiteralPath $Binary)) { throw "Executable was not installed." }
    $Hash = (Get-FileHash -LiteralPath $Binary).Hash
    if ($script:Requests.Count -ne 3) { throw "Expected latest lookup, archive, and checksum downloads." }
    $script:Requests = @()
    & (Join-Path $Root "install.ps1") -Version "v0.1.0" -NoModifyPath
    if ($script:Requests.Count -ne 2) { throw "Pinned install should skip latest lookup." }

    $script:BadChecksum = $true
    $Rejected = $false
    try {
        & (Join-Path $Root "install.ps1") -Version "0.1.0" -NoModifyPath
    } catch {
        if ($_.Exception.Message -notlike "*checksum verification failed*") { throw }
        $Rejected = $true
    }
    if (-not $Rejected) { throw "Installer accepted a bad checksum." }
    if ((Get-FileHash -LiteralPath $Binary).Hash -ne $Hash) { throw "Failed install changed the existing executable." }
    if ($env:PATH -ne $OriginalPath -or [Environment]::GetEnvironmentVariable("PATH", "User") -ne $OriginalUserPath) {
        throw "NoModifyPath changed PATH."
    }
    if (Get-ChildItem -LiteralPath $Sandbox -Filter "tacocode-install-*") { throw "Installer left temporary files." }
    Write-Host "Windows installer integration checks passed."
} finally {
    foreach ($Name in $Saved.Keys) { [Environment]::SetEnvironmentVariable($Name, $Saved[$Name], "Process") }
    Remove-Item -LiteralPath $Sandbox -Recurse -Force
}
