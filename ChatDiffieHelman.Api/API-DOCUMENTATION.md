# 📚 API Документация

## Обзор

Этот проект предоставляет REST API для чата с криптографической защитой, включающий:
- 🔐 JWT аутентификацию
- 🔑 Протокол идентификации Fiat-Shamir
- 🛡️ Протокол идентификации Brickell–McCurley
- 💬 Управление чатами и сообщениями
- 🔒 Обмен ключами Diffie-Hellman для шифрования
- 👥 Систему приглашений

---

## 🚀 Как получить документацию

### 1. Swagger UI (Интерактивная документация)
После запуска приложения откройте в браузере:
```
http://localhost:3000/api
```

Здесь вы можете:
- Просматривать все эндпоинты
- Тестировать запросы прямо из браузера
- Видеть схемы запросов и ответов
- Использовать авторизацию JWT

### 2. JSON спецификация (OpenAPI)
Получите полную JSON схему API:
```
http://localhost:3000/api-json
```

Или используйте сохраненный файл:
```
swagger-spec.json
```

### 3. YAML спецификация
```
http://localhost:3000/api-yaml
```

---

## 📝 Структура API

### Auth (`/auth`)
Аутентификация и криптографическая идентификация

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| POST | `/auth/login` | Вход пользователя |
| POST | `/auth/fiat/start` | Начало идентификации Fiat-Shamir |
| POST | `/auth/fiat/finish` | Завершение идентификации Fiat-Shamir |
| POST | `/auth/fiat/enable/:userId` | Включить Fiat-Shamir |
| POST | `/auth/fiat/disable/:userId` | Отключить Fiat-Shamir |
| POST | `/auth/bmc/start` | Начало идентификации BMC |
| POST | `/auth/bmc/finish` | Завершение идентификации BMC |
| POST | `/auth/bmc/enable/:userId` | Включить BMC |
| POST | `/auth/bmc/disable/:userId` | Отключить BMC |

### Users (`/users`)
Управление пользователями

| Метод | Эндпоинт | Описание | Требует авторизации |
|-------|----------|----------|---------------------|
| POST | `/users/registration` | Регистрация | ❌ |
| GET | `/users/me` | Текущий пользователь | ✅ |
| GET | `/users/all` | Все пользователи | ✅ |
| GET | `/users/:id` | Пользователь по ID | ✅ |

### Chats (`/chats`)
Управление чатами

| Метод | Эндпоинт | Описание | Требует авторизации |
|-------|----------|----------|---------------------|
| GET | `/chats` | Мои чаты | ✅ |
| POST | `/chats` | Создать чат | ✅ |
| GET | `/chats/:chatId` | Получить чат | ✅ |
| GET | `/chats/:chatId/users` | Участники чата | ✅ |

### Messages (`/messages`)
Управление сообщениями

| Метод | Эндпоинт | Описание | Требует авторизации |
|-------|----------|----------|---------------------|
| GET | `/messages/:chatId` | Сообщения в чате | ✅ |
| POST | `/messages/:chatId` | Отправить сообщение | ✅ |

### Invites (`/invites`)
Управление приглашениями

| Метод | Эндпоинт | Описание | Требует авторизации |
|-------|----------|----------|---------------------|
| GET | `/invites` | Мои приглашения | ✅ |
| POST | `/invites/create` | Создать приглашение | ✅ |
| POST | `/invites/respond` | Ответить на приглашение | ✅ |

---

## 🔑 Аутентификация

### Базовая аутентификация

1. **Регистрация**
```bash
POST /users/registration
Content-Type: application/json

{
  "username": "John Doe",
  "email": "john@example.com",
  "password": "strongPassword123"
}
```

2. **Вход**
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "strongPassword123"
}
```

Ответ:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "fiat_required": false,
  "fiat_session_id": null
}
```

3. **Использование токена**

В Swagger UI:
- Нажмите кнопку "Authorize" вверху страницы
- Введите токен в формате: `Bearer <ваш_токен>`
- Нажмите "Authorize"

В HTTP запросах:
```bash
GET /users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Расширенная аутентификация (Fiat-Shamir)

Если у пользователя включена Fiat-Shamir идентификация:

1. Вход вернет `fiat_required: true` и `fiat_session_id`
2. Выполните протокол Fiat-Shamir:
   - `POST /auth/fiat/start` с обязательством
   - `POST /auth/fiat/finish` с ответом
3. Получите `access_token`

---

## 📊 DTO (Data Transfer Objects)

### UserDto
```typescript
{
  id: string;              // UUID
  name: string;            // Имя пользователя
  email: string;           // Email
  fiat_enabled: boolean;   // Включен ли Fiat-Shamir
  bmc_enabled: boolean;    // Включен ли BMC
}
```

### ChatDto
```typescript
{
  id: string;    // UUID
  name: string;  // Название чата
}
```

### MessageDto
```typescript
{
  id: string;                // UUID
  chatId: string;            // UUID чата
  userId: string;            // UUID отправителя
  content: string;           // Текст сообщения
  timestamp: Date;           // Временная метка
  reviewed: boolean;         // Прочитано
  type: string;              // Тип сообщения
  encryptionKeyIndex?: number; // Индекс ключа шифрования
}
```

### InviteDto
```typescript
{
  id: string;            // UUID
  chatId: string;        // UUID чата
  userSenderId: string;  // UUID отправителя
  userReceiverId: string;// UUID получателя
  status: string;        // 'pending' | 'accepted' | 'declined'
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🛠️ Использование с инструментами

### Postman / Insomnia

1. Импортируйте OpenAPI спецификацию:
   - Скачайте `swagger-spec.json`
   - В Postman: File → Import → Upload Files
   - В Insomnia: Create → Import from File

2. Настройте переменную окружения `baseUrl`: `http://localhost:3000`

3. После логина добавьте переменную `token` и используйте:
   ```
   Authorization: Bearer {{token}}
   ```

### cURL

```bash
# Регистрация
curl -X POST http://localhost:3000/users/registration \
  -H "Content-Type: application/json" \
  -d '{"username":"John","email":"john@test.com","password":"pass12345"}'

# Логин
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"pass12345"}'

# Получить свои чаты (с токеном)
curl -X GET http://localhost:3000/chats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Swagger Codegen

Генерация клиентского кода:

```bash
# Установка
npm install -g @openapitools/openapi-generator-cli

# Генерация TypeScript клиента
openapi-generator-cli generate \
  -i http://localhost:3000/api-json \
  -g typescript-axios \
  -o ./generated-client

# Генерация Python клиента
openapi-generator-cli generate \
  -i http://localhost:3000/api-json \
  -g python \
  -o ./generated-client-py
```

---

## 🔍 Примеры использования

### Создание чата и отправка сообщения

```typescript
// 1. Создать чат
const createChatResponse = await fetch('http://localhost:3000/chats', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ name: 'My New Chat' })
});
const chat = await createChatResponse.json();

// 2. Пригласить пользователя
await fetch('http://localhost:3000/invites/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    chatId: chat.id,
    userReceiverId: 'user-uuid-here'
  })
});

// 3. Отправить сообщение
await fetch(`http://localhost:3000/messages/${chat.id}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    content: 'Hello, World!',
    type: 'text',
    chatId: chat.id,
    userId: 'my-user-id'
  })
});
```

---

## 📦 Экспорт документации

### Сохранить JSON локально

При старте приложения автоматически создается файл `swagger-spec.json` в корне проекта.

### Через команду

```bash
# Windows PowerShell
Invoke-WebRequest -Uri http://localhost:3000/api-json -OutFile swagger-spec.json

# Linux/Mac
curl http://localhost:3000/api-json > swagger-spec.json
```

---

## 🐛 Отладка

### Просмотр схем ответов

В Swagger UI каждый эндпоинт показывает:
- **Request body schema** - структура запроса
- **Responses** - возможные ответы с примерами
- **Try it out** - интерактивное тестирование

### Коды ответов

| Код | Значение |
|-----|----------|
| 200 | OK - успешный запрос |
| 201 | Created - ресурс создан |
| 400 | Bad Request - некорректные данные |
| 401 | Unauthorized - требуется авторизация |
| 403 | Forbidden - доступ запрещен |
| 404 | Not Found - ресурс не найден |
| 409 | Conflict - конфликт (например, email уже существует) |
| 500 | Internal Server Error - ошибка сервера |

---

## 📚 Дополнительные ресурсы

- [NestJS Swagger Documentation](https://docs.nestjs.com/openapi/introduction)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger Editor](https://editor.swagger.io/) - редактор спецификаций

---

## 💡 Советы

1. **Используйте фильтр** в Swagger UI для быстрого поиска эндпоинтов
2. **Авторизация сохраняется** при перезагрузке страницы Swagger
3. **Схемы автоматически валидируются** благодаря `class-validator`
4. **JWT токены истекают** - проверяйте срок действия
5. **WebSocket** эндпоинты не отображаются в Swagger (используйте отдельный клиент)

---

## 🤝 Поддержка

Если у вас возникли вопросы:
1. Проверьте консоль браузера на ошибки
2. Убедитесь, что токен не истек
3. Проверьте формат запроса в Swagger UI
4. Посмотрите логи сервера

---

**Версия:** 1.0.0  
**Последнее обновление:** Ноябрь 2025
