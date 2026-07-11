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
$ServerDistDir = Join-Path (Join-Path $ProjectRoot 'server') 'dist'

function Write-Step([string]$Message) {
    Write-Host ">> $Message" -ForegroundColor Cyan
}

function Test-CommandExists([string]$Name) {
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Invoke-RemoteCommand(
    [string] $HostName,
    [string] $UserName,
    [string] $KeyPath,
    [string] $Command,
    [switch] $IgnoreExitCode
) {
    $sshArgs = @('-i', $KeyPath, "$UserName@$HostName", $Command)
    & ssh @sshArgs
    $exitCode = $LASTEXITCODE
    if (-not $IgnoreExitCode -and $exitCode -ne 0) {
        throw "Remote command failed with exit code $exitCode: $Command"
    }
}

function Invoke-RemoteCapture(
    [string] $HostName,
    [string] $UserName,
    [string] $KeyPath,
    [string] $Command
) {
    $sshArgs = @('-i', $KeyPath, "$UserName@$HostName", $Command)
    $output = & ssh @sshArgs
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
        throw "Remote command failed with exit code $exitCode: $Command"
    }
    return ($output | Out-String).Trim()
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

if (-not (Test-CommandExists 'ssh')) {
    throw 'ssh not found. Install OpenSSH client or use WSL'
}
if (-not (Test-CommandExists 'scp')) {
    throw 'scp not found. Install OpenSSH client or use WSL'
}

$remoteBase = "$($server.user)@$($server.host):$remotePath/"
$remoteFrontStagePath = "$($server.user)@$($server.host):$remotePath/dist-staging/"
$remoteServerDistPath = "$($server.user)@$($server.host):$remotePath/server/dist/"
$apiPort = 3001
if ($null -ne $project.deploy.apiPort -and "$($project.deploy.apiPort)".Trim() -ne '') {
    $apiPort = [int]$project.deploy.apiPort
}
$serviceName = "$($project.deploy.service)"
$updateScript = "$($project.deploy.updateScript)"
$requireConfirm = $false
if ($null -ne $project.permissions -and $null -ne $project.permissions.requireConfirmBeforeDeploy) {
    $requireConfirm = [bool]$project.permissions.requireConfirmBeforeDeploy
}

Write-Step "Deploy $($project.name) -> $serverId ($($server.host))"
Write-Host "  Remote: $remoteBase"

if ($requireConfirm -and -not $DryRun) {
    $confirm = Read-Host "Continue deploy to $serverId? (y/N)"
    if ($confirm -notin @('y', 'Y', 'yes', 'YES')) {
        throw 'Deployment cancelled by user.'
    }
}

if (-not $SkipBuild) {
    Write-Step 'Build frontend + backend'
    if (-not (Test-CommandExists 'npm')) {
        throw 'npm not found'
    }
    if ($DryRun) {
        Write-Host '  [dry-run] npm run build' -ForegroundColor Yellow
        Write-Host '  [dry-run] npm run build:server' -ForegroundColor Yellow
    } else {
        Push-Location $ProjectRoot
        try {
            & npm run build
            if ($LASTEXITCODE -ne 0) { throw "Build failed with exit code $LASTEXITCODE" }
            & npm run build:server
            if ($LASTEXITCODE -ne 0) { throw "Server build failed with exit code $LASTEXITCODE" }
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
if (-not (Test-Path $ServerDistDir)) {
    throw "server/dist/ not found. Run build first or remove -SkipBuild"
}

Write-Step 'Prepare remote directories'
if ($DryRun) {
    Write-Host "  [dry-run] ssh -i $keyPath $($server.user)@$($server.host) mkdir -p '$remotePath/dist-staging' '$remotePath/server/dist'" -ForegroundColor Yellow
} else {
    Invoke-RemoteCommand -HostName $server.host -UserName $server.user -KeyPath $keyPath -Command "mkdir -p '$remotePath/dist-staging' '$remotePath/server/dist'"
    Invoke-RemoteCommand -HostName $server.host -UserName $server.user -KeyPath $keyPath -Command "rm -rf '$remotePath/dist-staging'/* '$remotePath/server/dist'/*"
}

Write-Step 'Upload frontend dist/ to server'
$frontScpArgs = @('-i', $keyPath, '-r', (Join-Path $DistDir '*'), $remoteFrontStagePath)
if ($DryRun) {
    Write-Host "  [dry-run] scp $($frontScpArgs -join ' ')" -ForegroundColor Yellow
} else {
    & scp @frontScpArgs
    if ($LASTEXITCODE -ne 0) { throw "Frontend upload failed with exit code $LASTEXITCODE" }
}

Write-Step 'Upload backend server/dist to server'
$serverScpArgs = @('-i', $keyPath, '-r', (Join-Path $ServerDistDir '*'), $remoteServerDistPath)
if ($DryRun) {
    Write-Host "  [dry-run] scp $($serverScpArgs -join ' ')" -ForegroundColor Yellow
} else {
    & scp @serverScpArgs
    if ($LASTEXITCODE -ne 0) { throw "Backend upload failed with exit code $LASTEXITCODE" }
}

if ($updateScript) {
    Write-Step 'Run remote update script'
    if ($DryRun) {
        Write-Host "  [dry-run] ssh -i $keyPath $($server.user)@$($server.host) ""cd '$remotePath' && $updateScript""" -ForegroundColor Yellow
    } else {
        Invoke-RemoteCommand -HostName $server.host -UserName $server.user -KeyPath $keyPath -Command "cd '$remotePath' && $updateScript"
    }
} elseif ($serviceName) {
    Write-Step "Restart service: $serviceName"
    if ($DryRun) {
        Write-Host "  [dry-run] ssh -i $keyPath $($server.user)@$($server.host) ""sudo systemctl restart $serviceName""" -ForegroundColor Yellow
    } else {
        Invoke-RemoteCommand -HostName $server.host -UserName $server.user -KeyPath $keyPath -Command "sudo systemctl restart '$serviceName'"
    }
}

Write-Step 'Smoke test API routes'
if ($DryRun) {
    Write-Host "  [dry-run] health: curl http://127.0.0.1:$apiPort/api/health" -ForegroundColor Yellow
    Write-Host "  [dry-run] import-target: POST /api/conquer-planet/import-target (expect 401/200)" -ForegroundColor Yellow
} else {
    $healthCode = Invoke-RemoteCapture -HostName $server.host -UserName $server.user -KeyPath $keyPath -Command "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:$apiPort/api/health"
    if ($healthCode -ne '200') {
        throw "Smoke test failed: /api/health returned $healthCode"
    }
    $importCode = Invoke-RemoteCapture -HostName $server.host -UserName $server.user -KeyPath $keyPath -Command "curl -s -o /dev/null -w '%{http_code}' -X POST http://127.0.0.1:$apiPort/api/conquer-planet/import-target -H 'Content-Type: application/json' -d '{""limit"":1,""familiarity"":2}'"
    if ($importCode -notin @('200', '401', '403')) {
        throw "Smoke test failed: /api/conquer-planet/import-target returned $importCode"
    }
    Write-Host "  health: $healthCode"
    Write-Host "  import-target: $importCode"
}

Write-Host ''
Write-Host 'Deploy complete.' -ForegroundColor Green
Write-Host "  Server: $($server.host)"
Write-Host "  Path:   $remotePath"
