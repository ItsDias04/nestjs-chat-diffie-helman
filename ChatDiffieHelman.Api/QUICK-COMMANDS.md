# 🚀 Быстрые команды для работы с API

## Запуск и документация

```powershell
# Запустить API в режиме разработки
npm run start:dev

# Открыть Swagger UI в браузере
Start-Process "http://localhost:3000/api"

# Экспортировать JSON документацию
.\export-swagger.ps1

# Или вручную:
Invoke-WebRequest -Uri http://localhost:3000/api-json -OutFile swagger-spec.json
```

---

## Работа с Postman

```powershell
# 1. Экспортировать спецификацию
Invoke-WebRequest -Uri http://localhost:3000/api-json -OutFile swagger-spec.json

# 2. В Postman: File → Import → Upload Files → swagger-spec.json
```

---

## Генерация клиентского кода

### TypeScript / Axios
```powershell
npx @openapitools/openapi-generator-cli generate `
  -i http://localhost:3000/api-json `
  -g typescript-axios `
  -o ./generated-client
```

### TypeScript / Fetch
```powershell
npx @openapitools/openapi-generator-cli generate `
  -i http://localhost:3000/api-json `
  -g typescript-fetch `
  -o ./generated-client-fetch
```

### C# / .NET
```powershell
npx @openapitools/openapi-generator-cli generate `
  -i http://localhost:3000/api-json `
  -g csharp `
  -o ./generated-client-csharp
```

### Python
```powershell
npx @openapitools/openapi-generator-cli generate `
  -i http://localhost:3000/api-json `
  -g python `
  -o ./generated-client-python
```

### Java
```powershell
npx @openapitools/openapi-generator-cli generate `
  -i http://localhost:3000/api-json `
  -g java `
  -o ./generated-client-java
```

---

## Тестирование через cURL (PowerShell)

### Регистрация
```powershell
$body = @{
    username = "Иван Петров"
    email = "ivan@test.com"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/users/registration" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Вход
```powershell
$body = @{
    email = "ivan@test.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body

$token = $response.access_token
Write-Host "Token: $token"
```

### Получить текущего пользователя
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3000/users/me" `
  -Method GET `
  -Headers $headers
```

### Получить всех пользователей
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/users/all" `
  -Method GET `
  -Headers $headers
```

### Создать чат
```powershell
$body = @{
    name = "Мой новый чат"
} | ConvertTo-Json

$chat = Invoke-RestMethod -Uri "http://localhost:3000/chats" `
  -Method POST `
  -ContentType "application/json" `
  -Headers $headers `
  -Body $body

Write-Host "Chat ID: $($chat.id)"
```

### Получить мои чаты
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/chats" `
  -Method GET `
  -Headers $headers
```

### Отправить сообщение в чат
```powershell
$chatId = "ваш-chat-id-здесь"
$userId = "ваш-user-id-здесь"

$body = @{
    content = "Привет всем!"
    type = "text"
    chatId = $chatId
    userId = $userId
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/messages/$chatId" `
  -Method POST `
  -ContentType "application/json" `
  -Headers $headers `
  -Body $body
```

### Получить сообщения из чата
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/messages/$chatId" `
  -Method GET `
  -Headers $headers
```

### Создать приглашение в чат
```powershell
$body = @{
    chatId = "chat-id"
    userReceiverId = "receiver-user-id"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/invites/create" `
  -Method POST `
  -ContentType "application/json" `
  -Headers $headers `
  -Body $body
```

### Получить мои приглашения
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/invites" `
  -Method GET `
  -Headers $headers
```

### Принять/отклонить приглашение
```powershell
$body = @{
    inviteId = "invite-id"
    accept = $true  # или $false для отклонения
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/invites/respond" `
  -Method POST `
  -ContentType "application/json" `
  -Headers $headers `
  -Body $body
```

---

## Полезные скрипты

### Сохранить токен в переменную окружения
```powershell
# После логина
$env:API_TOKEN = $token

# Использование
$headers = @{ Authorization = "Bearer $env:API_TOKEN" }
```

### Красивый вывод JSON
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/users/all" `
  -Method GET `
  -Headers $headers | ConvertTo-Json -Depth 10
```

### Проверка статуса API
```powershell
try {
    Invoke-WebRequest -Uri "http://localhost:3000/api-json" -Method GET -TimeoutSec 5
    Write-Host "✅ API доступно" -ForegroundColor Green
} catch {
    Write-Host "❌ API недоступно" -ForegroundColor Red
}
```

### Мониторинг API
```powershell
while ($true) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api-json" -Method GET -TimeoutSec 2
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ✅ API работает (Status: $($response.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ❌ API недоступно" -ForegroundColor Red
    }
    Start-Sleep -Seconds 5
}
```

---

## Docker команды (если используется)

```powershell
# Собрать образ
docker build -t chat-api .

# Запустить контейнер
docker run -p 3000:3000 chat-api

# Остановить все контейнеры
docker stop $(docker ps -aq)

# Удалить все контейнеры
docker rm $(docker ps -aq)
```

---

## Отладка

### Просмотр логов
```powershell
# В режиме разработки логи выводятся в консоль
npm run start:dev

# Перенаправление логов в файл
npm run start:dev > logs.txt 2>&1
```

### Проверка переменных окружения
```powershell
Get-Content .env
```

### Проверка порта
```powershell
# Проверить, занят ли порт 3000
Get-NetTCPConnection -LocalPort 3000 -State Listen
```

---

## Быстрый старт (всё в одном)

```powershell
# 1. Установить зависимости
npm install

# 2. Запустить API
Start-Process powershell -ArgumentList "npm run start:dev"

# 3. Подождать 5 секунд
Start-Sleep -Seconds 5

# 4. Открыть Swagger
Start-Process "http://localhost:3000/api"

# 5. Экспортировать документацию
Start-Sleep -Seconds 2
Invoke-WebRequest -Uri http://localhost:3000/api-json -OutFile swagger-spec.json

Write-Host "✅ Всё готово!" -ForegroundColor Green
Write-Host "Swagger UI: http://localhost:3000/api"
Write-Host "JSON сохранён в: swagger-spec.json"
```

---

## Ссылки

- **Swagger UI:** http://localhost:3000/api
- **JSON спецификация:** http://localhost:3000/api-json
- **YAML спецификация:** http://localhost:3000/api-yaml
- **Health Check:** http://localhost:3000/ (если настроен)
