#Requires -Version 5.1
param(
    [switch] $SkipBuild,
    [switch] $DryRun
)

$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ProjectConfig = Join-Path $ProjectRoot '.jeemoo\project.json'
$ServersConfig = Join-Path $env:USERPROFILE '.jeemoo\servers.json'
$KeysDir = Join-Path $env:USERPROFILE '.jeemoo\keys'
$DistDir = Join-Path $ProjectRoot 'dist'

function Write-Step([string]$Message) {
    Write-Host ">> $Message" -ForegroundColor Cyan
}

function Test-CommandExists([string]$Name) {
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

if (-not (Test-Path $ProjectConfig)) {
    throw "Project config not found: $ProjectConfig"
}
if (-not (Test-Path $ServersConfig)) {
    throw "Servers config not found: $ServersConfig"
}

$project = Get-Content $ProjectConfig -Raw -Encoding UTF8 | ConvertFrom-Json
$serversFile = Get-Content $ServersConfig -Raw -Encoding UTF8 | ConvertFrom-Json

$serverId = $project.deploy.serverId
$remotePath = $project.deploy.remotePath
$server = $serversFile.servers | Where-Object { $_.id -eq $serverId } | Select-Object -First 1

if (-not $server) {
    throw "Server '$serverId' not found in $ServersConfig"
}

$keyPath = Join-Path $KeysDir $server.keyFile
if (-not (Test-Path $keyPath)) {
    throw "SSH key not found: $keyPath"
}

$remote = "$($server.user)@$($server.host):$remotePath/"

Write-Step "Deploy $($project.name) -> $serverId ($($server.host))"
Write-Host "  Remote: $remote"

if (-not $SkipBuild) {
    Write-Step 'Build project'
    if (-not (Test-CommandExists 'npm')) {
        throw 'npm not found'
    }
    if ($DryRun) {
        Write-Host '  [dry-run] npm run build' -ForegroundColor Yellow
    } else {
        Push-Location $ProjectRoot
        try {
            & npm run build
            if ($LASTEXITCODE -ne 0) { throw "Build failed with exit code $LASTEXITCODE" }
        } finally {
            Pop-Location
        }
    }
} else {
    Write-Host '  Skipped build (-SkipBuild)' -ForegroundColor Yellow
}

if (-not (Test-Path $DistDir)) {
    throw "dist/ not found. Run build first or remove -SkipBuild"
}

if (-not (Test-CommandExists 'scp')) {
    throw 'scp not found. Install OpenSSH client or use WSL'
}

Write-Step 'Upload dist/ to server'
$scpArgs = @('-i', $keyPath, '-r', (Join-Path $DistDir '*'), $remote)

if ($DryRun) {
    Write-Host "  [dry-run] scp $($scpArgs -join ' ')" -ForegroundColor Yellow
} else {
    & scp @scpArgs
    if ($LASTEXITCODE -ne 0) { throw "Upload failed with exit code $LASTEXITCODE" }
}

Write-Host ''
Write-Host 'Deploy complete.' -ForegroundColor Green
Write-Host "  Server: $($server.host)"
Write-Host "  Path:   $remotePath"

if ($project.deploy.updateScript) {
    Write-Host ''
    Write-Host "Tip: run update script on server: $($project.deploy.updateScript)" -ForegroundColor Yellow
}
