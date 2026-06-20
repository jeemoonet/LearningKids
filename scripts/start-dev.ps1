#Requires -Version 5.1
<#
.SYNOPSIS
  Start local dev environment: API server + Vite frontend.

.EXAMPLE
  .\scripts\start-dev.ps1

.EXAMPLE
  .\scripts\start-dev.ps1 -NoBrowser -SkipPortCleanup
#>
param(
    [switch] $SkipPortCleanup,
    [switch] $NoBrowser,
    [int] $ApiPort = 3001,
    [int] $WebPort = 5173
)

$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent $PSScriptRoot

function Write-Step([string]$Message) {
    Write-Host ">> $Message" -ForegroundColor Cyan
}

function Test-CommandExists([string]$Name) {
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Stop-PortListener([int]$Port) {
    if (-not (Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue)) {
        Write-Host '  Skip port cleanup: Get-NetTCPConnection unavailable' -ForegroundColor Yellow
        return
    }

    $connections = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
    if ($connections.Count -eq 0) {
        Write-Host "  Port $Port is free" -ForegroundColor DarkGray
        return
    }

    $processIds = $connections.OwningProcess | Sort-Object -Unique
    foreach ($processId in $processIds) {
        if ($processId -le 0) { continue }
        try {
            $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
            $name = if ($proc) { $proc.ProcessName } else { 'unknown' }
            Write-Host "  Stop process on port ${Port}: PID $processId ($name)" -ForegroundColor Yellow
            Stop-Process -Id $processId -Force -ErrorAction Stop
        } catch {
            Write-Host "  Failed to stop PID ${processId}: $_" -ForegroundColor Red
        }
    }
}

if (-not (Test-CommandExists 'npm')) {
    throw 'npm not found. Please install Node.js first.'
}

Push-Location $ProjectRoot
try {
    if (-not (Test-Path 'node_modules')) {
        Write-Step 'First run: npm install'
        npm install
        if ($LASTEXITCODE -ne 0) { throw "npm install failed with exit code $LASTEXITCODE" }
    }

    if (-not $SkipPortCleanup) {
        Write-Step "Check API port $ApiPort"
        Stop-PortListener -Port $ApiPort
    }

    Write-Step 'Start backend: npm run dev:server'
    $backendCmd = "Set-Location '$ProjectRoot'; Write-Host '[backend] npm run dev:server' -ForegroundColor Cyan; npm run dev:server"
    Start-Process powershell -WorkingDirectory $ProjectRoot -ArgumentList @(
        '-NoExit',
        '-Command',
        $backendCmd
    ) | Out-Null

    Start-Sleep -Seconds 2

    Write-Step 'Start frontend: npm run dev'
    $frontendCmd = "Set-Location '$ProjectRoot'; Write-Host '[frontend] npm run dev' -ForegroundColor Cyan; npm run dev"
    Start-Process powershell -WorkingDirectory $ProjectRoot -ArgumentList @(
        '-NoExit',
        '-Command',
        $frontendCmd
    ) | Out-Null

    $frontendUrl = "http://localhost:$WebPort"
    $apiUrl = "http://localhost:$ApiPort"

    Write-Host ''
    Write-Host 'Dev environment started.' -ForegroundColor Green
    Write-Host "  Frontend: $frontendUrl"
    Write-Host "  API:      $apiUrl"
    Write-Host ''
    Write-Host 'Close the two PowerShell windows to stop services.' -ForegroundColor Yellow
    Write-Host 'Tip: use -SkipPortCleanup to keep an existing process on the API port.' -ForegroundColor DarkGray

    if (-not $NoBrowser) {
        Start-Sleep -Seconds 2
        Start-Process $frontendUrl
    }
} finally {
    Pop-Location
}
