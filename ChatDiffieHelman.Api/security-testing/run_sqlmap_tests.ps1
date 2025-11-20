# SQLMap Automation Script для Windows PowerShell
# Этот скрипт запускает тестирование на Windows с использованием WSL (Windows Subsystem for Linux)

Write-Host "=================================================="
Write-Host "SQLMap Automation для Chat Diffie-Hellman API"
Write-Host "=================================================="
Write-Host ""

# Проверка наличия WSL
$wslInstalled = Get-Command wsl -ErrorAction SilentlyContinue

if (-not $wslInstalled) {
    Write-Host "Ошибка: WSL не установлен" -ForegroundColor Red
    Write-Host ""
    Write-Host "SQLMap лучше всего работает на Linux. Варианты:" -ForegroundColor Yellow
    Write-Host "1. Установите WSL: wsl --install" -ForegroundColor Yellow
    Write-Host "2. Используйте Docker: docker run -it python:3.9 /bin/bash" -ForegroundColor Yellow
    Write-Host "3. Используйте виртуальную машину Ubuntu" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Проверка наличия Python в WSL
$pythonCheck = wsl python3 --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Установка Python в WSL..." -ForegroundColor Yellow
    wsl sudo apt-get update
    wsl sudo apt-get install -y python3 python3-pip
}

# Проверка наличия SQLMap в WSL
$sqlmapCheck = wsl sqlmap --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Установка SQLMap в WSL..." -ForegroundColor Yellow
    wsl sudo apt-get install -y sqlmap
}

# Параметры (можно изменить)
$API_BASE_URL = $env:API_BASE_URL
if (-not $API_BASE_URL) {
    $API_BASE_URL = "http://localhost:3000"
}

$JWT_TOKEN = $env:JWT_TOKEN
if (-not $JWT_TOKEN) {
    $JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJzdWIiOiI3NDA2MjNhZS03Y2JlLTQ2ZjUtYWE1ZS1jN2UxZWI5N2EwYWIiLCJpYXQiOjE3NjI3Njk5NTh9.AA913lOFH0AtB_OwNOk3MlI-0plsazp3KEE3vapeeSk"
}

Write-Host "Конфигурация:" -ForegroundColor Green
Write-Host "API URL: $API_BASE_URL"
Write-Host "JWT Token: $($JWT_TOKEN.Substring(0, 50))..."
Write-Host ""

# Проверка доступности API
Write-Host "Проверка доступности API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$API_BASE_URL/users/all" `
        -Method GET `
        -Headers @{"Authorization" = "Bearer $JWT_TOKEN"} `
        -UseBasicParsing `
        -TimeoutSec 5 `
        -ErrorAction Stop
    Write-Host "✓ API доступен" -ForegroundColor Green
} catch {
    Write-Host "✗ API недоступен. Убедитесь, что сервер запущен" -ForegroundColor Red
    Write-Host "  Запустите API: npm run start:dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Запуск тестирования через WSL..." -ForegroundColor Green
Write-Host ""

# Конвертация Windows путей в WSL пути
$currentPath = (Get-Location).Path
$wslPath = wsl wslpath -a "'$currentPath'"

# Установка переменных окружения и запуск
$env:API_BASE_URL = $API_BASE_URL
$env:JWT_TOKEN = $JWT_TOKEN

# Запуск через WSL
wsl bash -c "cd '$wslPath' && export API_BASE_URL='$API_BASE_URL' && export JWT_TOKEN='$JWT_TOKEN' && python3 sqlmap_automation.py"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Тестирование завершено успешно!" -ForegroundColor Green
    Write-Host "Результаты сохранены в: sqlmap_results/" -ForegroundColor Yellow
    Write-Host "Логи доступны в: sqlmap_automation.log" -ForegroundColor Yellow
    Write-Host ""
    
    # Генерация HTML отчета
    Write-Host "Генерация HTML отчета..." -ForegroundColor Yellow
    $reportFiles = Get-ChildItem -Path "sqlmap_results" -Filter "final_report_*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    
    if ($reportFiles) {
        wsl bash -c "cd '$wslPath' && python3 generate_report.py '$($reportFiles.FullName)'"
        $htmlReport = $reportFiles.FullName -replace '\.json$', '.html'
        if (Test-Path $htmlReport) {
            Write-Host "HTML отчет сохранен: $htmlReport" -ForegroundColor Green
            Write-Host "Открыть отчет? (Y/N)" -ForegroundColor Yellow
            $openReport = Read-Host
            if ($openReport -eq "Y" -or $openReport -eq "y") {
                Start-Process $htmlReport
            }
        }
    }
} else {
    Write-Host ""
    Write-Host "✗ Ошибка при выполнении тестирования" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=================================================="
Write-Host "Тестирование завершено!"
Write-Host "=================================================="
