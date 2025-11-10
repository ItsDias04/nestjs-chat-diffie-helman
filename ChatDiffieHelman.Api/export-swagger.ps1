# Экспорт Swagger документации в JSON
# Использование: .\export-swagger.ps1

$API_URL = "http://localhost:3000"
$OUTPUT_FILE = "swagger-spec.json"

Write-Host "🔍 Проверка доступности API..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "$API_URL/api-json" -Method GET -TimeoutSec 5
    
    if ($response.StatusCode -eq 200) {
        $response.Content | Out-File -FilePath $OUTPUT_FILE -Encoding UTF8
        Write-Host "✅ Swagger документация успешно экспортирована в $OUTPUT_FILE" -ForegroundColor Green
        
        # Показать информацию о файле
        $fileInfo = Get-Item $OUTPUT_FILE
        Write-Host ""
        Write-Host "📄 Информация о файле:" -ForegroundColor Yellow
        Write-Host "   Путь: $($fileInfo.FullName)"
        Write-Host "   Размер: $($fileInfo.Length) байт"
        Write-Host "   Дата: $($fileInfo.LastWriteTime)"
        
        # Попытка получить версию API из JSON
        $json = Get-Content $OUTPUT_FILE | ConvertFrom-Json
        if ($json.info) {
            Write-Host ""
            Write-Host "📊 Информация об API:" -ForegroundColor Yellow
            Write-Host "   Название: $($json.info.title)"
            Write-Host "   Версия: $($json.info.version)"
            Write-Host "   Описание: $($json.info.description -replace "`n.*", "...")"
        }
    }
} catch {
    Write-Host "❌ Ошибка: Не удалось подключиться к API" -ForegroundColor Red
    Write-Host ""
    Write-Host "Убедитесь, что:" -ForegroundColor Yellow
    Write-Host "  1. API запущено (npm run start:dev)" -ForegroundColor White
    Write-Host "  2. API доступно по адресу $API_URL" -ForegroundColor White
    Write-Host "  3. Порт 3000 не занят другим приложением" -ForegroundColor White
    Write-Host ""
    Write-Host "Детали ошибки: $($_.Exception.Message)" -ForegroundColor Gray
    exit 1
}
