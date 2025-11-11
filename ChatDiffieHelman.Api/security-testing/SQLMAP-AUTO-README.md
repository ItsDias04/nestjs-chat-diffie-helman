# 🔐 SQLMap Автоматическое Тестирование

Автоматический скрипт для тестирования всех эндпоинтов API на SQL-инъекции с помощью sqlmap.

## 🎯 Особенности

✅ **Автоматическое чтение Swagger спецификации** (swagger-spec.json)  
✅ **Определение эндпоинтов, требующих JWT токен**  
✅ **Автоматическое добавление JWT в заголовки**  
✅ **Тестирование всех методов:** GET, POST, PUT, DELETE, PATCH  
✅ **Обработка параметров пути:** {id}, {userId}, {chatId}  
✅ **Цветной вывод в консоль**  
✅ **Генерация JSON отчетов**  
✅ **Сохранение логов для каждого эндпоинта**  

---

## 📋 Требования

### Ubuntu/Debian
```bash
# Установка sqlmap
sudo apt-get update
sudo apt-get install sqlmap

# Установка Python зависимостей
sudo apt-get install python3 python3-pip
pip3 install requests
```

### Проверка установки
```bash
sqlmap --version
python3 --version
```

---

## 🚀 Использование

### Быстрый запуск с автоматической регистрацией

```bash
# Перейти в директорию
cd security-testing

# Дать права на выполнение bash скрипту
chmod +x run-sqlmap-test.sh

# Запустить (автоматически зарегистрирует тестового пользователя)
./run-sqlmap-test.sh
```

### Базовое использование Python скрипта

```bash
# Автоматическая регистрация и получение токена
python3 sqlmap-auto-test.py

# Скрипт автоматически:
# 1. Зарегистрирует пользователя: test@example.com / testPassword123
# 2. Получит JWT токен
# 3. Протестирует все эндпоинты
```

### С существующим JWT токеном

```bash
# Использовать известный токен из БД
./run-sqlmap-test.sh --known-token

# Или указать свой токен
./run-sqlmap-test.sh --token "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Или в Python скрипте
python3 sqlmap-auto-test.py --token "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 📋 Тестовые данные

Скрипт использует следующие тестовые данные:

### Тестовый пользователь из БД
```json
{
  "id": "740623ae-7cbe-46f5-aa5e-c7e1eb97a0ab",
  "username": "test user",
  "email": "test@example.com",
  "password": "testPassword123",
  "jwt_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJzdWIiOiI3NDA2MjNhZS03Y2JlLTQ2ZjUtYWE1ZS1jN2UxZWI5N2EwYWIiLCJpYXQiOjE3NjI3Njk5NTh9.AA913lOFH0AtB_OwNOk3MlI-0plsazp3KEE3vapeeSk"
}
```

### Автоматическая подстановка данных

Для каждого эндпоинта скрипт автоматически подставляет соответствующие тестовые данные:

| Эндпоинт | Тестовые данные |
|----------|----------------|
| `/users/registration` | `{"username":"SQL Injection Test User","email":"sqltest@example.com","password":"testPassword123"}` |
| `/auth/login` | `{"email":"test@example.com","password":"testPassword123"}` |
| `/chats` | `{"name":"Test Chat Room"}` |
| `/messages/:chatId` | `{"content":"Test message","type":"text","chatId":"740623...","userId":"740623..."}` |
| `/invites/create` | `{"chatId":"740623...","userReceiverId":"740623..."}` |
| `/invites/respond` | `{"inviteId":"740623...","accept":true}` |
| `/auth/fiat/start` | `{"sid":"test-session-id","t":"123456789"}` |
| `/auth/fiat/enable/:userId` | `{"v":"1234567890","n":"9876543210"}` |
| `/auth/bmc/start` | `{"sid":"test-session-id","a":"123456789"}` |
| `/auth/bmc/enable/:userId` | `{"n":"1234567890","g":"9876543210","y":"5555555555"}` |

Все данные хранятся в файле: **`test-data.json`**

## 🔑 Работа с JWT токеном

### Автоматическое получение токена

Скрипт автоматически:
1. Регистрирует тестового пользователя (если не существует)
2. Выполняет login
3. Извлекает JWT токен
4. Использует токен для защищенных эндпоинтов

```bash
# Просто запустите - всё произойдёт автоматически
python3 sqlmap-auto-test.py
```

### Использование существующего токена

```bash
# Из БД (может быть устаревшим)
python3 sqlmap-auto-test.py --token "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJzdWIiOiI3NDA2MjNhZS03Y2JlLTQ2ZjUtYWE1ZS1jN2UxZWI5N2EwYWIiLCJpYXQiOjE3NjI3Njk5NTh9.AA913lOFH0AtB_OwNOk3MlI-0plsazp3KEE3vapeeSk"
```

### Базовое использование

```bash
# Перейти в директорию
cd security-testing

# Запустить тестирование
python3 sqlmap-auto-test.py
```

### С JWT токеном

```bash
# Указать токен явно
python3 sqlmap-auto-test.py --token "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### С другим URL API

```bash
# Указать другой URL
python3 sqlmap-auto-test.py --api-url http://192.168.1.100:3000
```

### Автоматическое получение токена

```bash
# Получить токен и сразу использовать
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' \
  | jq -r .access_token)

python3 sqlmap-auto-test.py --token "$TOKEN"
```

### Полная команда (одна строка)

```bash
python3 sqlmap-auto-test.py \
  --api-url http://localhost:3000 \
  --token $(curl -s -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test123"}' \
    | jq -r .access_token)
```

---

## 📊 Как это работает

### 1. Загрузка спецификации

Скрипт автоматически:
- Пытается загрузить `swagger-spec.json` из API (`/api-json`)
- Если не удается, ищет файл `swagger-spec.json` локально

### 2. Анализ эндпоинтов

Для каждого эндпоинта определяет:
```json
{
  "path": "/users/me",
  "method": "GET",
  "summary": "Получить текущего пользователя",
  "requires_jwt": true  // ← Автоматически определяется!
}
```

### 3. Определение JWT требований

Проверяет в Swagger спецификации:
```json
{
  "security": [
    {
      "access-token": []  // ← Если есть, значит требуется JWT
    }
  ]
}
```

### 4. Формирование команды sqlmap

**Для эндпоинта БЕЗ JWT:**
```bash
sqlmap -u http://localhost:3000/auth/login \
  --method POST \
  --batch \
  --level=2 \
  --risk=1
```

**Для эндпоинта С JWT:**
```bash
sqlmap -u http://localhost:3000/users/me \
  --method GET \
  --batch \
  --level=2 \
  --risk=1 \
  --header "Authorization: Bearer eyJhbGc..."  # ← JWT добавляется автоматически!
```

### 5. Сохранение результатов

```
sqlmap-results/
├── GET__users_me/
│   └── sqlmap_20251110_143025.log
├── POST__auth_login/
│   └── sqlmap_20251110_143145.log
├── GET__chats/
│   └── sqlmap_20251110_143230.log
└── report_20251110_143500.json
```

---

## 🎨 Вывод в консоль

Скрипт использует цветной вывод:

```
================================================================================
🔍 Тестирование: GET /users/me
   Описание: Получить информацию о текущем пользователе
   Требует JWT: ✅ Да
   💻 Команда: sqlmap -u http://localhost:3000/users/me ...
   ✅ Уязвимости не обнаружены
   ⏱️  Время выполнения: 12.34 сек
   📄 Лог сохранен: sqlmap-results/GET__users_me/sqlmap_20251110_143025.log
================================================================================
```

---

## 📈 Итоговый отчет

После завершения тестирования:

```
================================================================================
📊 ИТОГОВЫЙ ОТЧЕТ
================================================================================

Всего эндпоинтов: 29
Протестировано: 23
Пропущено: 6
Ошибок: 0

✅ УЯЗВИМОСТИ НЕ ОБНАРУЖЕНЫ

⚠️  Пропущенные эндпоинты:
   - GET /users/me (No JWT token)
   - GET /chats (No JWT token)
   ...

📁 Результаты сохранены в: /path/to/sqlmap-results
📄 JSON отчет: sqlmap-results/report_20251110_143500.json
```

### JSON отчет

```json
{
  "timestamp": "2025-11-10T14:35:00",
  "api_url": "http://localhost:3000",
  "total_endpoints": 29,
  "tested_endpoints": 23,
  "vulnerable_count": 0,
  "vulnerable_endpoints": [],
  "skipped_endpoints": [
    {
      "path": "/users/me",
      "method": "GET",
      "reason": "No JWT token"
    }
  ],
  "failed_tests": []
}
```

---

## 🔧 Параметры командной строки

```bash
python3 sqlmap-auto-test.py [OPTIONS]
```

| Параметр | Описание | По умолчанию |
|----------|----------|--------------|
| `--api-url URL` | URL API сервера | `http://localhost:3000` |
| `--token TOKEN` | JWT токен | Нет (попытка автополучения) |
| `--swagger-url URL` | URL Swagger спецификации | `{api-url}/api-json` |
| `--help` | Показать справку | - |

---

## 🎯 Примеры

### Пример 1: Базовый запуск с автоматической регистрацией

```bash
# Запустить API
cd ..
npm run start:dev

# В другом терминале
cd security-testing

# Запустить тестирование (автоматически зарегистрирует пользователя)
chmod +x run-sqlmap-test.sh
./run-sqlmap-test.sh

# Или напрямую Python скрипт
python3 sqlmap-auto-test.py
```

### Пример 2: С известным JWT токеном из БД

```bash
# Использовать токен из test-data.json
./run-sqlmap-test.sh --known-token

# Или указать токен напрямую
python3 sqlmap-auto-test.py --token "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJzdWIiOiI3NDA2MjNhZS03Y2JlLTQ2ZjUtYWE1ZS1jN2UxZWI5N2EwYWIiLCJpYXQiOjE3NjI3Njk5NTh9.AA913lOFH0AtB_OwNOk3MlI-0plsazp3KEE3vapeeSk"
```

### Пример 3: С ручным получением токена

```bash
# 1. Пользователь уже существует в БД, просто получим новый токен
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testPassword123"
  }' | jq .

# 2. Запустить тестирование с новым токеном
python3 sqlmap-auto-test.py --token "НОВЫЙ_ТОКЕН"
```

### Пример 2: С предварительным получением токена

```bash
# 1. Зарегистрировать пользователя
curl -X POST http://localhost:3000/users/registration \
  -H "Content-Type: application/json" \
  -d '{
    "username": "Test User",
    "email": "test@test.com",
    "password": "test12345"
  }'

# 2. Получить токен
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "test12345"
  }' | jq .

# 3. Запустить тестирование с токеном
python3 sqlmap-auto-test.py --token "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Пример 3: Тестирование удаленного сервера

```bash
python3 sqlmap-auto-test.py \
  --api-url https://api.example.com \
  --token "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Пример 4: Автоматизация в CI/CD

```bash
#!/bin/bash
# test-security.sh

# Запуск API в фоне
npm run start:dev &
API_PID=$!

# Ожидание запуска
sleep 5

# Регистрация тестового пользователя
curl -X POST http://localhost:3000/users/registration \
  -H "Content-Type: application/json" \
  -d '{"username":"CI User","email":"ci@test.com","password":"ci12345"}'

# Получение токена
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ci@test.com","password":"ci12345"}' \
  | jq -r .access_token)

# Запуск тестирования
cd security-testing
python3 sqlmap-auto-test.py --token "$TOKEN"

# Остановка API
kill $API_PID

# Проверка результатов
if [ -f "sqlmap-results/report_*.json" ]; then
  VULNERABILITIES=$(jq .vulnerable_count sqlmap-results/report_*.json | tail -1)
  if [ "$VULNERABILITIES" -gt 0 ]; then
    echo "❌ Обнаружены уязвимости!"
    exit 1
  else
    echo "✅ Уязвимости не обнаружены"
    exit 0
  fi
fi
```

---

## 🐛 Устранение проблем

### sqlmap не найден

```bash
# Проверить установку
which sqlmap

# Установить
sudo apt-get install sqlmap

# Проверить версию
sqlmap --version
```

### Не удается загрузить Swagger спецификацию

```bash
# Проверить, что API запущен
curl http://localhost:3000/api-json

# Или указать файл напрямую
cp ../swagger-spec.json .
python3 sqlmap-auto-test.py
```

### Ошибка подключения

```bash
# Проверить, что API запущен
curl http://localhost:3000/

# Проверить порт
netstat -tuln | grep 3000

# Указать правильный URL
python3 sqlmap-auto-test.py --api-url http://localhost:3000
```

### JWT токен не работает

```bash
# Проверить токен
echo "YOUR_TOKEN" | base64 -d

# Получить новый токен
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' \
  | jq .access_token
```

---

## 📚 Что тестируется

### Типы SQL-инъекций

Скрипт использует sqlmap для обнаружения:

1. **Boolean-based blind** - булева слепая инъекция
2. **Error-based** - инъекция через ошибки
3. **Union query-based** - UNION инъекция
4. **Stacked queries** - множественные запросы
5. **Time-based blind** - временная слепая инъекция
6. **Inline queries** - встроенные запросы

### Параметры sqlmap

По умолчанию:
- `--level=2` - средний уровень тестирования
- `--risk=1` - низкий риск (безопасно для production)
- `--batch` - автоматические ответы
- `--threads=5` - 5 параллельных потоков

Можно изменить в коде для более агрессивного тестирования:
```python
"--level=5",  # Максимальный уровень
"--risk=3",   # Максимальный риск (может навредить БД!)
```

---

## ⚠️ Предупреждения

1. **НЕ запускайте на production** без разрешения!
2. **Создайте резервную копию БД** перед тестированием
3. **Используйте тестовые данные**, не реальные
4. **Тестирование может занять много времени** (несколько часов для 29 эндпоинтов)
5. **Не используйте высокие уровни risk** на production БД

---

## 📖 Дополнительные ресурсы

- [SQLMap Wiki](https://github.com/sqlmapproject/sqlmap/wiki)
- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [NestJS Security](https://docs.nestjs.com/security/encryption-and-hashing)

---

## 🤝 Интеграция с другими инструментами

### С Postman

```bash
# Экспорт результатов для Postman
jq '.vulnerable_endpoints' sqlmap-results/report_*.json
```

### С GitHub Actions

```yaml
name: Security Testing

on: [push, pull_request]

jobs:
  sqlmap-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install dependencies
        run: |
          sudo apt-get install sqlmap
          pip3 install requests
      
      - name: Start API
        run: |
          npm install
          npm run start:dev &
          sleep 10
      
      - name: Run SQLMap tests
        run: |
          cd security-testing
          python3 sqlmap-auto-test.py
      
      - name: Upload results
        uses: actions/upload-artifact@v2
        with:
          name: sqlmap-results
          path: security-testing/sqlmap-results/
```

---

**Автор:** Security Testing Script  
**Версия:** 1.0.0  
**Дата:** Ноябрь 2025
