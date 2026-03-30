# SQLMap Penetration Testing Guide
## Руководство по тестированию безопасности NestJS Chat API

---

## 📋 Содержание
1. [Подготовка к тестированию](#подготовка)
2. [Автоматизированное тестирование](#автоматизированное-тестирование)
3. [Ручное тестирование](#ручное-тестирование)
4. [Анализ результатов](#анализ-результатов)
5. [Рекомендации по устранению](#рекомендации)

---

## 🔧 Подготовка

### 1. Установка SQLMap

```bash
# Клонирование репозитория
cd ~/Рабочий\ стол
git clone --depth 1 https://github.com/sqlmapproject/sqlmap.git sqlmap-dev

# Проверка установки
python3 sqlmap-dev/sqlmap.py --version
```

### 2. Запуск тестового окружения

```powershell
# В директории проекта
cd d:\nestjs-chat-diffie-helman\ChatDiffieHelman.Api

# Установка зависимостей (если не установлены)
npm install

# Запуск в режиме разработки
npm run start:dev

# API должно быть доступно на http://localhost:3001
```

### 3. Создание тестовых данных

```powershell
# Регистрация тестового пользователя
curl -X POST http://localhost:3001/users/registration `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"testPassword123\"}'

# Получение JWT токена
$response = Invoke-RestMethod -Uri http://localhost:3001/auth/login `
  -Method Post `
  -ContentType "application/json" `
  -Body '{\"email\":\"test@example.com\",\"password\":\"testPassword123\"}'

$TOKEN = $response.access_token
Write-Host "JWT Token: $TOKEN"
```

---

## 🤖 Автоматизированное тестирование

### Использование готовых скриптов

#### Windows (PowerShell):
```powershell
cd d:\nestjs-chat-diffie-helman\ChatDiffieHelman.Api\security-testing
.\sqlmap-test.ps1
```

#### Linux/Mac (Bash):
```bash
cd ~/path/to/ChatDiffieHelman.Api/security-testing
chmod +x sqlmap-test.sh
./sqlmap-test.sh
```

### Что тестируют скрипты:

1. **Login Endpoint** - Проверка POST запросов с JSON
2. **User by ID** - UUID параметры в URL
3. **Registration** - Создание пользователей
4. **Fiat Auth** - Специфические эндпоинты аутентификации
5. **BMC Auth** - Протокол Brickell-McCurley
6. **Cookie Injection** - Инъекции через cookies
7. **Header Injection** - Инъекции через HTTP заголовки

---

## 🔍 Ручное тестирование

### Test 1: Базовое тестирование Login

```bash
python3 ~/Рабочий\ стол/sqlmap/sqlmap/sqlmap.py \
  -u "http://localhost:3001/auth/login" \
  --data='{"email":"test@example.com","password":"test*"}' \
  --method=POST \
  --headers="Content-Type: application/json" \
  --batch \
  --level=3 \
  --risk=2 \
  --dbms=PostgreSQL \
  --technique=BEUST
```

**Что проверяется:**
- SQL инъекции в поле `email`
- SQL инъекции в поле `password`
- Техники: Boolean-based, Error-based, Union-based, Stacked queries, Time-based

### Test 2: UUID параметры

```bash
python3 ~/Рабочий\ стол/sqlmap/sqlmap/sqlmap.py \
  -u "http://localhost:3001/users/550e8400-e29b-41d4-a716-446655440000*" \
  --headers="Authorization: Bearer YOUR_JWT_TOKEN" \
  --batch \
  --level=3 \
  --risk=2 \
  --dbms=PostgreSQL
```

**Что проверяется:**
- Инъекции в UUID параметре пути
- Обход валидации ParseUUIDPipe

### Test 3: Глубокое тестирование с перебором

```bash
python3 ~/Рабочий\ стол/sqlmap/sqlmap/sqlmap.py \
  -u "http://localhost:3001/users/registration" \
  --data='{"name":"Test*","email":"test*@test.com","password":"pass*"}' \
  --method=POST \
  --headers="Content-Type: application/json" \
  --batch \
  --level=5 \
  --risk=3 \
  --threads=10 \
  --dbms=PostgreSQL \
  --tamper=space2comment,between
```

**Параметры:**
- `--level=5` - максимальный уровень тестирования (больше payload'ов)
- `--risk=3` - максимальный риск (включая OR-based инъекции)
- `--threads=10` - параллельные потоки для ускорения
- `--tamper` - обход WAF/фильтров

### Test 4: Извлечение данных БД (если найдена уязвимость)

```bash
# Получить список БД
python3 ~/Рабочий\ стол/sqlmap/sqlmap/sqlmap.py \
  -u "http://localhost:3001/auth/login" \
  --data='{"email":"test@example.com","password":"test"}' \
  --method=POST \
  --headers="Content-Type: application/json" \
  --dbs \
  --batch

# Получить таблицы конкретной БД
python3 ~/Рабочий\ стол/sqlmap/sqlmap/sqlmap.py \
  -u "http://localhost:3001/auth/login" \
  --data='{"email":"test@example.com","password":"test"}' \
  --method=POST \
  --headers="Content-Type: application/json" \
  -D chat_db \
  --tables \
  --batch

# Дамп таблицы users
python3 ~/Рабочий\ стол/sqlmap/sqlmap/sqlmap.py \
  -u "http://localhost:3001/auth/login" \
  --data='{"email":"test@example.com","password":"test"}' \
  --method=POST \
  --headers="Content-Type: application/json" \
  -D chat_db \
  -T user \
  --dump \
  --batch
```

### Test 5: WebSocket тестирование

```bash
# SQLMap не поддерживает WebSocket напрямую, используйте wscat + ручные инъекции
npm install -g wscat

# Подключение к WebSocket
wscat -c ws://localhost:3001/diffie-hellman \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Ручная отправка с инъекциями
{"chatId":"test' OR '1'='1","fromClientId":"user1","toClientId":"user2","publicKey":"test"}
```

---

## 📊 Анализ результатов

### Интерпретация вывода SQLMap

#### ✅ Безопасно (No injection found):
```
[INFO] testing 'PostgreSQL > 8.1 stacked queries (comment)'
[WARNING] time-based comparison requires larger statistical model
[INFO] GET parameter 'id' does not seem to be injectable
```

#### ⚠️ Потенциальная уязвимость:
```
[INFO] testing 'PostgreSQL > 8.1 AND time-based blind'
[INFO] GET parameter 'id' appears to be 'PostgreSQL > 8.1 AND time-based blind' injectable
```

#### 🔴 КРИТИЧЕСКАЯ уязвимость:
```
[INFO] the back-end DBMS is PostgreSQL
web application technology: Express
back-end DBMS: PostgreSQL 14
[INFO] fetching database names
available databases [3]:
[*] chat_db
[*] postgres
[*] template1
```

### Проверка логов

```powershell
# Поиск всех уязвимостей
Select-String -Path ".\sqlmap-results\*.log" -Pattern "vulnerable|injectable"

# Поиск критических ошибок
Select-String -Path ".\sqlmap-results\*.log" -Pattern "error|exception|syntax error"

# Проверка успешных инъекций
Select-String -Path ".\sqlmap-results\*.log" -Pattern "retrieved:|available databases"
```

---

## 🛡️ Рекомендации по устранению

### 1. Валидация входных данных

Ваш проект уже использует TypeORM, что защищает от SQL-инъекций, но нужно усилить:

#### Добавьте DTO валидацию везде:

```typescript
// src/DTO/LoginDto.ts
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;
}
```

#### Включите глобальную валидацию:

```typescript
// src/main.ts
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Удаляет неопределенные поля
      forbidNonWhitelisted: true, // Выбрасывает ошибку при лишних полях
      transform: true, // Автоматическая трансформация типов
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
  );
  
  await app.listen(3001);
}
```

### 2. Rate Limiting

```bash
npm install @nestjs/throttler
```

```typescript
// src/app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000, // 60 секунд
      limit: 10,  // 10 запросов
    }]),
    // ...другие импорты
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

### 3. Helmet для защиты заголовков

```bash
npm install helmet
```

```typescript
// src/main.ts
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  // ...
}
```

### 4. SQL Query Logging (для мониторинга)

```typescript
// src/app.module.ts
TypeOrmModule.forRoot({
  type: 'postgres',
  // ...
  logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  logger: 'advanced-console',
}),
```

### 5. Prepared Statements (уже используются)

Убедитесь, что все запросы используют параметризацию:

```typescript
// ✅ БЕЗОПАСНО (уже используется)
this.userRepository.findOne({ where: { email: loginDto.email } });

// ❌ ОПАСНО (никогда не используйте)
this.userRepository.query(`SELECT * FROM user WHERE email = '${email}'`);
```

### 6. Content Security Policy

```typescript
// src/main.ts
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  }),
);
```

---

## 🎯 Чек-лист безопасности

- [ ] Все DTO имеют валидацию с class-validator
- [ ] Включен глобальный ValidationPipe
- [ ] Настроен Rate Limiting
- [ ] Установлен Helmet
- [ ] Используются только параметризованные запросы
- [ ] JWT токены имеют срок истечения
- [ ] Пароли хешируются (bcrypt/argon2)
- [ ] CORS настроен правильно (не `*`)
- [ ] HTTPS в продакшене
- [ ] Логирование подозрительной активности
- [ ] Регулярные обновления зависимостей

---

## 📚 Дополнительные ресурсы

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [SQLMap Documentation](https://github.com/sqlmapproject/sqlmap/wiki)
- [NestJS Security](https://docs.nestjs.com/security/helmet)
- [TypeORM Query Builder Security](https://typeorm.io/select-query-builder)

---

## ⚠️ DISCLAIMER

Эти инструменты предназначены **ТОЛЬКО** для тестирования вашего собственного API. 
Несанкционированное тестирование чужих систем является **НЕЗАКОННЫМ** и преследуется по закону.

**Используйте только:**
- На своих серверах
- В изолированной тестовой среде
- С письменного разрешения владельца системы
