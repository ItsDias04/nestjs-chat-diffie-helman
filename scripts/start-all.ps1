# Start API and WebClient in separate PowerShell windows for local development.
# Usage: run this script from repository root in PowerShell (may require execution policy changes):
#   .\scripts\start-all.ps1

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition

$apiPath = Join-Path $repoRoot 'ChatDiffieHelman.Api'
$webPath = Join-Path $repoRoot 'ChatDiffieHelman.WebClient'

Write-Host "Starting API in a new PowerShell window: $apiPath"
Start-Process -FilePath powershell -ArgumentList '-NoExit','-Command',"cd '$apiPath'; npm run start:dev"

Start-Sleep -Seconds 1

Write-Host "Starting WebClient in a new PowerShell window: $webPath"
Start-Process -FilePath powershell -ArgumentList '-NoExit','-Command',"cd '$webPath'; npm start"

# Optional: start NativeScript mobile client (uncomment and adjust path if needed)
# $mobilePath = Join-Path $repoRoot 'NativeScript\DiffieHelmanChatMobile'
# Start-Process -FilePath powershell -ArgumentList '-NoExit','-Command',"cd '$mobilePath'; npm install; ns run android"

Write-Host "All start commands have been issued. Two new windows should be open."
