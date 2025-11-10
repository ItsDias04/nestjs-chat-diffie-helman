# SQLMap PowerShell Testing Script для Windows
# ВНИМАНИЕ: Используйте только на своем API в тестовой среде!

# Конфигурация
$API_URL = "http://localhost:3000"
$SQLMAP_PATH = "python3"
$SQLMAP_SCRIPT = "$HOME/Рабочий стол/sqlmap/sqlmap/sqlmap.py"
$OUTPUT_DIR = "./sqlmap-results"
$TEST_EMAIL = "test@example.com"
$TEST_PASSWORD = "testPassword123"

Write-Host "=== SQLMap Security Test для NestJS Chat API ===" -ForegroundColor Green
Write-Host "API URL: $API_URL"
Write-Host "Output Directory: $OUTPUT_DIR"
Write-Host ""

# Создаем директорию для результатов
New-Item -ItemType Directory -Force -Path $OUTPUT_DIR | Out-Null

# Функция для получения JWT токена
function Get-JWTToken {
    Write-Host "[*] Получение JWT токена..." -ForegroundColor Yellow
    
    # Регистрация тестового пользователя (если еще не существует)
    try {
        $regBody = @{
            name = "Test User"
            email = $TEST_EMAIL
            password = $TEST_PASSWORD
        } | ConvertTo-Json
        
        Invoke-RestMethod -Uri "$API_URL/users/registration" `
            -Method Post `
            -ContentType "application/json" `
            -Body $regBody `
            -ErrorAction SilentlyContinue | Out-Null
    } catch {
        # Пользователь уже существует
    }
    
    # Логин
    $loginBody = @{
        email = $TEST_EMAIL
        password = $TEST_PASSWORD
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$API_URL/auth/login" `
            -Method Post `
            -ContentType "application/json" `
            -Body $loginBody
        
        $token = $response.access_token
        
        if ([string]::IsNullOrEmpty($token) -or $token -eq "null") {
            Write-Host "[!] Не удалось получить токен" -ForegroundColor Red
            return $null
        }
        
        Write-Host "[+] Токен получен: $($token.Substring(0, [Math]::Min(20, $token.Length)))..." -ForegroundColor Green
        return $token
    } catch {
        Write-Host "[!] Ошибка получения токена: $_" -ForegroundColor Red
        return $null
    }
}

# Получаем токен
$JWT_TOKEN = Get-JWTToken
if ($null -eq $JWT_TOKEN) {
    Write-Host "[!] Ошибка получения токена. Завершение." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Начало тестирования эндпоинтов ===" -ForegroundColor Green
Write-Host ""

# Test 1: Login endpoint (POST с JSON)
Write-Host "[TEST 1] Тестирование /auth/login (POST)" -ForegroundColor Yellow
& $SQLMAP_PATH $SQLMAP_SCRIPT -u "$API_URL/auth/login" `
    --data='{\"email\":\"test@example.com\",\"password\":\"test*\"}' `
    --method=POST `
    --headers="Content-Type: application/json" `
    --batch `
    --level=3 `
    --risk=2 `
    --technique=BEUST `
    --dbms=PostgreSQL `
    --random-agent `
    -o `
    --output-dir="$OUTPUT_DIR/test1-login" `
    2>&1 | Tee-Object -FilePath "$OUTPUT_DIR/test1-login.log"

# Test 2: Get User by ID (GET параметр с UUID)
Write-Host ""
Write-Host "[TEST 2] Тестирование /users/:id (GET с UUID)" -ForegroundColor Yellow
& $SQLMAP_PATH $SQLMAP_SCRIPT -u "$API_URL/users/550e8400-e29b-41d4-a716-446655440000*" `
    --headers="Authorization: Bearer $JWT_TOKEN" `
    --batch `
    --level=3 `
    --risk=2 `
    --dbms=PostgreSQL `
    --random-agent `
    --output-dir="$OUTPUT_DIR/test2-user-id" `
    2>&1 | Tee-Object -FilePath "$OUTPUT_DIR/test2-user-id.log"

# Test 3: User Registration (POST с JSON)
Write-Host ""
Write-Host "[TEST 3] Тестирование /users/registration (POST)" -ForegroundColor Yellow
& $SQLMAP_PATH $SQLMAP_SCRIPT -u "$API_URL/users/registration" `
    --data='{\"name\":\"SQLTest*\",\"email\":\"sqltest*@test.com\",\"password\":\"test123\"}' `
    --method=POST `
    --headers="Content-Type: application/json" `
    --batch `
    --level=3 `
    --risk=2 `
    --dbms=PostgreSQL `
    --random-agent `
    --output-dir="$OUTPUT_DIR/test3-registration" `
    2>&1 | Tee-Object -FilePath "$OUTPUT_DIR/test3-registration.log"

# Test 4: Fiat start endpoint
Write-Host ""
Write-Host "[TEST 4] Тестирование /auth/fiat/start (POST)" -ForegroundColor Yellow
& $SQLMAP_PATH $SQLMAP_SCRIPT -u "$API_URL/auth/fiat/start" `
    --data='{\"sid\":\"test-sid*\",\"t\":\"abc123*\"}' `
    --method=POST `
    --headers="Content-Type: application/json" `
    --batch `
    --level=3 `
    --risk=2 `
    --dbms=PostgreSQL `
    --random-agent `
    --output-dir="$OUTPUT_DIR/test4-fiat-start" `
    2>&1 | Tee-Object -FilePath "$OUTPUT_DIR/test4-fiat-start.log"

# Test 5: BMC start endpoint
Write-Host ""
Write-Host "[TEST 5] Тестирование /auth/bmc/start (POST)" -ForegroundColor Yellow
& $SQLMAP_PATH $SQLMAP_SCRIPT -u "$API_URL/auth/bmc/start" `
    --data='{\"sid\":\"test-sid*\",\"a\":\"abc123*\"}' `
    --method=POST `
    --headers="Content-Type: application/json" `
    --batch `
    --level=3 `
    --risk=2 `
    --dbms=PostgreSQL `
    --random-agent `
    --output-dir="$OUTPUT_DIR/test5-bmc-start" `
    2>&1 | Tee-Object -FilePath "$OUTPUT_DIR/test5-bmc-start.log"

# Test 6: Get all users
Write-Host ""
Write-Host "[TEST 6] Тестирование /users/all (GET)" -ForegroundColor Yellow
& $SQLMAP_PATH $SQLMAP_SCRIPT -u "$API_URL/users/all" `
    --headers="Authorization: Bearer $JWT_TOKEN" `
    --batch `
    --level=3 `
    --risk=2 `
    --dbms=PostgreSQL `
    --random-agent `
    --output-dir="$OUTPUT_DIR/test6-users-all" `
    2>&1 | Tee-Object -FilePath "$OUTPUT_DIR/test6-users-all.log"

# Test 7: Header injection
Write-Host ""
Write-Host "[TEST 7] Тестирование Header injection" -ForegroundColor Yellow
& $SQLMAP_PATH $SQLMAP_SCRIPT -u "$API_URL/users/me" `
    --headers="Authorization: Bearer $JWT_TOKEN`nX-Forwarded-For: 127.0.0.1*`nUser-Agent: SQLMap-Test*" `
    --batch `
    --level=4 `
    --risk=2 `
    --dbms=PostgreSQL `
    --output-dir="$OUTPUT_DIR/test7-headers" `
    2>&1 | Tee-Object -FilePath "$OUTPUT_DIR/test7-headers.log"

# Финальный отчет
Write-Host ""
Write-Host "=== Тестирование завершено ===" -ForegroundColor Green
Write-Host ""
Write-Host "Результаты сохранены в: $OUTPUT_DIR"
Write-Host ""
Write-Host "Анализ результатов:" -ForegroundColor Yellow
Write-Host "1. Проверьте логи на наличие уязвимостей (vulnerable)"
Write-Host "2. Ищите сообщения об успешных SQL инъекциях"
Write-Host "3. Обратите внимание на любые таймауты или ошибки БД"
Write-Host ""

# Подсчет найденных уязвимостей
$vulnerabilities = Select-String -Path "$OUTPUT_DIR/*.log" -Pattern "vulnerable" -AllMatches | Measure-Object | Select-Object -ExpandProperty Count

if ($vulnerabilities -gt 0) {
    Write-Host "[!] ВНИМАНИЕ: Обнаружено потенциальных уязвимостей: $vulnerabilities" -ForegroundColor Red
    Write-Host "[!] Требуется немедленное исправление!" -ForegroundColor Red
    Select-String -Path "$OUTPUT_DIR/*.log" -Pattern "vulnerable"
} else {
    Write-Host "[+] SQL инъекции не обнаружены в автоматических тестах" -ForegroundColor Green
    Write-Host "[!] Рекомендуется ручное тестирование и code review" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Для детального анализа используйте:"
Write-Host "  Select-String -Path '$OUTPUT_DIR/*.log' -Pattern 'vulnerable|injectable|error'"
