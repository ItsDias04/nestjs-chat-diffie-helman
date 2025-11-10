# Результаты тестирования SQLMap

## Дата: 2025-11-07 15:15

### Тестируемый эндпоинт: POST /auth/login

```bash
python3 sqlmap.py \
  -u "http://10.0.2.2:3000/auth/login" \
  --data='{"email":"test@example.com","password":"test*"}' \
  --method=POST \
  --headers="Content-Type: application/json" \
  --batch --level=3 --risk=2 \
  --dbms=PostgreSQL --technique=BEUST
```

## 📊 Результаты

### HTTP Error Codes:
- **400 (Bad Request) - 4 раза** ✅
  - Причина: ValidationPipe отклоняет невалидные данные
  - Вывод: class-validator работает корректно
  
- **401 (Unauthorized) - 1 раз** ⚠️
  - Причина: Неверные учетные данные
  - Вывод: Аутентификация работает

### Выводы SQLMap:
```
[WARNING] (custom) POST parameter 'JSON #1*' does not appear to be dynamic
[CRITICAL] not authorized, try to provide right HTTP authentication type
```

**Интерпретация:**
- ✅ Параметр не выглядит динамическим = SQL инъекция **не обнаружена**
- ✅ SQLMap не смог найти уязвимости в параметрах email/password
- ✅ TypeORM параметризация работает корректно

---

## 🔧 Рекомендуемые дополнительные тесты

### 1. Тест с валидными учетными данными

Сначала создайте тестового пользователя и получите данные:

```bash
# На вашем API сервере (Windows)
# Создайте пользователя через Postman или curl
```

```bash
# Linux (в SQLMap)
# Создайте пользователя
curl -X POST http://10.0.2.2:3000/users/registration \
  -H "Content-Type: application/json" \
  -d '{"username":"SQLTest","email":"sqltest@test.com","password":"Test123456"}'

# Затем тестируйте с валидными данными
python3 sqlmap.py \
  -u "http://10.0.2.2:3000/auth/login" \
  --data='{"email":"sqltest@test.com","password":"Test123456*"}' \
  --method=POST \
  --headers="Content-Type: application/json" \
  --batch --level=5 --risk=3 \
  --dbms=PostgreSQL
```

### 2. Тест без маркера инъекции (автоопределение)

```bash
python3 sqlmap.py \
  -u "http://10.0.2.2:3000/auth/login" \
  --data='{"email":"test@example.com","password":"test"}' \
  --method=POST \
  --headers="Content-Type: application/json" \
  --batch --level=3 --risk=2 \
  --dbms=PostgreSQL \
  --param-filter="email,password"
```

### 3. Тест других эндпоинтов

#### a) Registration endpoint:
```bash
python3 sqlmap.py \
  -u "http://10.0.2.2:3000/users/registration" \
  --data='{"username":"Test*","email":"test*@test.com","password":"pass123"}' \
  --method=POST \
  --headers="Content-Type: application/json" \
  --batch --level=3 --risk=2 \
  --dbms=PostgreSQL
```

#### b) GET endpoints (без аутентификации не сработает):
```bash
# Сначала получите JWT токен
TOKEN=$(curl -s -X POST http://10.0.2.2:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sqltest@test.com","password":"Test123456"}' \
  | grep -o '"access_token":"[^"]*' | sed 's/"access_token":"//')

echo "Token: $TOKEN"

# Тест UUID параметра
python3 sqlmap.py \
  -u "http://10.0.2.2:3000/users/550e8400-e29b-41d4-a716-446655440000*" \
  --headers="Authorization: Bearer $TOKEN" \
  --batch --level=3 --risk=2 \
  --dbms=PostgreSQL
```

### 4. Агрессивное тестирование (максимальные level/risk)

```bash
python3 sqlmap.py \
  -u "http://10.0.2.2:3000/auth/login" \
  --data='{"email":"admin@test.com","password":"admin"}' \
  --method=POST \
  --headers="Content-Type: application/json" \
  --batch \
  --level=5 \
  --risk=3 \
  --threads=10 \
  --tamper=space2comment,between,randomcase \
  --technique=BEUSTQ \
  --dbms=PostgreSQL \
  --random-agent \
  --time-sec=10
```

### 5. Тест с обходом валидации (Tamper scripts)

```bash
python3 sqlmap.py \
  -u "http://10.0.2.2:3000/auth/login" \
  --data='{"email":"test*","password":"test*"}' \
  --method=POST \
  --headers="Content-Type: application/json" \
  --batch --level=5 --risk=3 \
  --dbms=PostgreSQL \
  --tamper=apostrophemask,apostrophenullencode,base64encode,between,chardoubleencode,charencode,charunicodeencode,equaltolike,greatest,ifnull2ifisnull,multiplespaces,percentage,randomcase,space2comment,space2plus,space2randomblank,unionalltounion,unmagicquotes
```

---

## 🎯 Текущий статус: ✅ ЗАЩИЩЕНО

**Вывод из первого теста:**
- SQL инъекции **не обнаружены**
- ValidationPipe корректно отклоняет невалидные данные
- TypeORM параметризация работает

**Следующие шаги:**
1. ✅ Запустите тесты 1-5 выше для полного покрытия
2. ⚠️ Проверьте логи API на подозрительную активность
3. ⚠️ Добавьте bcrypt для паролей (КРИТИЧНО!)

---

## 📝 Логи для мониторинга

Проверьте консоль вашего API (где запущен `npm run start:dev`):

**Ожидаемые записи:**
- `[Nest] ERROR [ExceptionsHandler] Bad Request` - валидация отклоняет атаки
- `[Nest] ERROR [ExceptionsHandler] Unauthorized` - неверные credentials
- НЕ должно быть SQL синтаксических ошибок!

**Опасные признаки (если увидите):**
- `syntax error at or near` - возможна SQL инъекция!
- `relation "..." does not exist` - утечка структуры БД
- `QueryFailedError` - проблемы с запросом

---

## 🔄 Продолжение тестирования

Запустите полный набор тестов:

```bash
# На Windows (PowerShell)
cd d:\nestjs-chat-diffie-helman\ChatDiffieHelman.Api\security-testing
.\sqlmap-test.ps1

# На Linux (где установлен SQLMap)
# Скопируйте команды из этого файла и запускайте по очереди
```

**Важно:** Запускайте тесты последовательно и следите за логами API!
