# 📖 Руководство по работе с Swagger документацией

## 🚀 Быстрый старт

### 1. Запустите приложение
```bash
npm run start:dev
```

### 2. Откройте Swagger UI
Перейдите в браузере:
```
http://localhost:3001/api
```

### 3. Получите JSON документацию

**В браузере:**
```
http://localhost:3001/api-json
```

**Через PowerShell:**
```powershell
Invoke-WebRequest -Uri http://localhost:3001/api-json -OutFile swagger-spec.json
```

**Автоматически:**
При запуске приложения файл `swagger-spec.json` автоматически создается в корне проекта!

---

## 📚 Что добавлено

### ✅ Все DTO имеют полные @ApiProperty декораторы

#### UserDto
```typescript
@ApiProperty({ example: 'John Doe', description: 'Имя пользователя' })
name: string;

@ApiProperty({ example: 'john@example.com', description: 'Email пользователя' })
email: string;

@ApiProperty({ example: true, description: 'Включена ли функция Fiat' })
fiat_enabled: boolean;
```

#### MessageDto
```typescript
@ApiProperty({ example: 'Hello!', description: 'Содержимое сообщения' })
content: string;

@ApiProperty({ enum: ['text', 'diffie-hellman-key', 'system'] })
type: string;
```

#### InviteDto, ChatDto, LoginDto, RegisterDto, DiffieHellmanMessageDto
Все имеют полную документацию!

### ✅ Все контроллеры задокументированы

Каждый эндпоинт имеет:
- `@ApiOperation` - описание операции
- `@ApiOkResponse` - схема успешного ответа
- `@ApiResponse` - коды ошибок
- `@ApiParam` - параметры пути
- `@ApiBody` - схема тела запроса

Пример:
```typescript
@ApiOperation({ summary: 'Получить всех пользователей' })
@ApiOkResponse({ type: UserDto, isArray: true })
@Get('all')
async getAllUsers(): Promise<UserDto[]> {
  return this.userService.getAllUsers();
}
```

### ✅ Улучшенная конфигурация Swagger

- **Описание API** с эмодзи для наглядности
- **Теги для группировки** эндпоинтов
- **Bearer аутентификация** настроена
- **Автосохранение токена** при перезагрузке
- **Фильтр и поиск** включены
- **Автоматический экспорт** JSON при старте

---

## 🎯 Как использовать

### Тестирование эндпоинтов в Swagger UI

1. **Регистрация пользователя**
   - Откройте секцию `users`
   - Найдите `POST /users/registration`
   - Нажмите "Try it out"
   - Заполните JSON:
   ```json
   {
     "username": "Иван Петров",
     "email": "ivan@example.com",
     "password": "password123"
   }
   ```
   - Нажмите "Execute"

2. **Вход в систему**
   - Откройте секцию `auth`
   - Найдите `POST /auth/login`
   - Нажмите "Try it out"
   - Введите email и пароль
   - Скопируйте `access_token` из ответа

3. **Авторизация в Swagger**
   - Нажмите кнопку **"Authorize"** вверху страницы (🔓 иконка замка)
   - Вставьте токен (без слова "Bearer")
   - Нажмите "Authorize"
   - Иконка замка станет закрытой 🔒
   - Теперь все защищенные эндпоинты (✅) доступны!
   
   > **Важно:** После авторизации в Swagger, токен автоматически добавляется ко всем запросам, которые требуют JWT.

4. **Создание чата** (требует JWT ✅)
   - Откройте секцию `chats`
   - Найдите `POST /chats`
   - Нажмите "Try it out"
   - Введите название:
   ```json
   {
     "name": "Мой первый чат"
   }
   ```

---

## 📊 Структура документации

### Сводная таблица эндпоинтов

| Группа | Метод | Путь | JWT токен | Описание |
|--------|-------|------|-----------|----------|
| **Auth** | POST | `/auth/login` | ❌ | Вход в систему |
| Auth | POST | `/auth/fiat/start` | ❌ | Начало Fiat-Shamir |
| Auth | POST | `/auth/fiat/finish` | ❌ | Завершение Fiat-Shamir |
| Auth | POST | `/auth/fiat/enable/:userId` | ✅ | Включить Fiat-Shamir |
| Auth | POST | `/auth/fiat/disable/:userId` | ✅ | Отключить Fiat-Shamir |
| Auth | POST | `/auth/bmc/start` | ❌ | Начало BMC |
| Auth | POST | `/auth/bmc/finish` | ❌ | Завершение BMC |
| Auth | POST | `/auth/bmc/enable/:userId` | ✅ | Включить BMC |
| Auth | POST | `/auth/bmc/disable/:userId` | ✅ | Отключить BMC |
| **Users** | POST | `/users/registration` | ❌ | Регистрация |
| Users | GET | `/users/me` | ✅ | Мои данные |
| Users | GET | `/users/all` | ✅ | Все пользователи |
| Users | GET | `/users/:id` | ✅ | Данные пользователя |
| **Chats** | GET | `/chats` | ✅ | Мои чаты |
| Chats | POST | `/chats` | ✅ | Создать чат |
| Chats | GET | `/chats/:chatId` | ✅ | Информация о чате |
| Chats | GET | `/chats/:chatId/users` | ✅ | Участники чата |
| **Messages** | GET | `/messages/:chatId` | ✅ | Получить сообщения |
| Messages | POST | `/messages/:chatId` | ✅ | Отправить сообщение |
| **Invites** | GET | `/invites` | ✅ | Мои приглашения |
| Invites | POST | `/invites/create` | ✅ | Создать приглашение |
| Invites | POST | `/invites/respond` | ✅ | Ответить на приглашение |

**Легенда:**
- ✅ **Требуется JWT токен** - добавьте заголовок `Authorization: Bearer <ваш_токен>`
- ❌ **Токен не требуется** - публичный эндпоинт

---

## 📊 Структура документации (детально)

### Группы (Tags)

| Тег | Описание | Требует JWT |
|-----|----------|-------------|
| **auth** | Аутентификация (login, Fiat-Shamir, BMC) | Частично ⚠️ |
| **users** | Управление пользователями | Да ✅ |
| **chats** | Управление чатами | Да ✅ |
| **messages** | Отправка и получение сообщений | Да ✅ |
| **invites** | Приглашения в чаты | Да ✅ |

### Модели (Schemas)

В разделе "Schemas" внизу страницы можно посмотреть структуру всех DTO:
- UserDto
- ChatDto
- MessageDto
- InviteDto
- LoginDto
- RegisterDto
- DiffieHellmanMessageDto

---

## 🔐 Работа с аутентификацией

### Базовый вход
```
POST /auth/login
{
  "email": "user@example.com",
  "password": "password"
}
```

**Ответ без дополнительной идентификации:**
```json
{
  "access_token": "eyJhbGc...",
  "fiat_required": false,
  "fiat_session_id": null
}
```

### Вход с Fiat-Shamir

**Если fiat_required: true:**

1. Получите session_id из ответа login
2. Вызовите `POST /auth/fiat/start` с параметрами
3. Получите challenge (вызов)
4. Вызовите `POST /auth/fiat/finish` с ответом
5. Получите access_token

---

## 💾 Экспорт и использование

### Сохранить JSON спецификацию

**PowerShell:**
```powershell
Invoke-WebRequest -Uri http://localhost:3001/api-json -OutFile swagger-spec.json
```

**Или найдите автоматически созданный файл:**
```
ChatDiffieHelman.Api/swagger-spec.json
```

### Импорт в Postman

1. Откройте Postman
2. File → Import
3. Выберите `swagger-spec.json`
4. Все эндпоинты импортируются автоматически!

### Генерация клиентского кода

```bash
# TypeScript клиент
npx @openapitools/openapi-generator-cli generate `
  -i http://localhost:3001/api-json `
  -g typescript-axios `
  -o ./generated-client

# C# клиент
npx @openapitools/openapi-generator-cli generate `
  -i http://localhost:3001/api-json `
  -g csharp `
  -o ./generated-client-csharp
```

---

## 🛠️ Полезные функции Swagger UI

### Фильтрация
Используйте поле поиска вверху для быстрого нахождения эндпоинтов:
```
Введите: "chat" → показывает все эндпоинты с чатами
```

### Схемы запросов
Каждый эндпоинт показывает:
- **Example Value** - пример JSON
- **Schema** - описание полей с типами

### Try it out
Кнопка позволяет:
- Редактировать запрос прямо в браузере
- Видеть curl команду
- Получать реальные ответы от сервера

### Response
После выполнения показывает:
- Код ответа (200, 400, 401 и т.д.)
- Headers
- Body (JSON ответ)
- Время выполнения

---

## 📋 Примеры запросов

### Публичные эндпоинты (без JWT токена ❌)

#### Регистрация
```bash
curl -X POST "http://localhost:3001/users/registration" `
  -H "Content-Type: application/json" `
  -d "{\"username\":\"John Doe\",\"email\":\"john@test.com\",\"password\":\"pass12345\"}"
```

#### Вход
```bash
curl -X POST "http://localhost:3001/auth/login" `
  -H "Content-Type: application/json" `
  -d "{\"email\":\"john@test.com\",\"password\":\"pass12345\"}"
```

### Защищенные эндпоинты (требуют JWT токен ✅)

> **Важно:** Замените `YOUR_TOKEN` на реальный токен, полученный после логина!

##### Получить всех пользователей (требует JWT ✅)
```bash
curl -X GET "http://localhost:3001/users/all" `
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Создать чат (требует JWT ✅)
```bash
curl -X POST "http://localhost:3001/chats" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -d "{\"name\":\"Новый чат\"}"
```

### Отправить сообщение (требует JWT ✅)
```bash
curl -X POST "http://localhost:3001/messages/CHAT_ID" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -d "{\"content\":\"Привет!\",\"type\":\"text\",\"chatId\":\"CHAT_ID\",\"userId\":\"USER_ID\"}"
```

---

## 🔍 Отладка

### Просмотр схемы ответа
1. Откройте эндпоинт
2. Раскройте секцию "Responses"
3. Посмотрите "Schema" для каждого кода

### Коды ответов

| Код | Значение | Что делать |
|-----|----------|-----------|
| 200 | OK | Запрос успешен |
| 201 | Created | Ресурс создан |
| 400 | Bad Request | Проверьте формат JSON |
| 401 | Unauthorized | **Добавьте JWT токен или обновите его** |
| 403 | Forbidden | Недостаточно прав или токен неверный |
| 404 | Not Found | Неверный ID |
| 500 | Server Error | Смотрите логи сервера |

### Распространенные ошибки с JWT

**❌ 401 Unauthorized**
- Токен не добавлен в заголовок
- Токен истек (обычно через 1 час)
- Неправильный формат: должно быть `Bearer <token>`

**Решение:**
```bash
# Проверьте формат заголовка
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Получите новый токен через login
curl -X POST http://localhost:3001/auth/login ...
```

**❌ 403 Forbidden**
- Токен валиден, но у пользователя нет прав
- Попытка доступа к чужим ресурсам

**Решение:**
- Убедитесь, что используете правильный userId
- Проверьте, что пользователь является участником чата

### Проверка валидации
Если получаете 400:
- Проверьте все обязательные поля
- Убедитесь в правильности типов
- Проверьте форматы (email, UUID)

---

## 💡 Советы

1. **Используйте "Authorize"** один раз в Swagger UI, чтобы не вставлять токен в каждый запрос
2. **JWT токен истекает** - если получаете 401, войдите заново
3. **Копируйте curl команды** из Swagger для использования в скриптах
4. **Смотрите Schema** для понимания структуры данных
5. **Сохраните swagger-spec.json** для документирования проекта
6. **Используйте фильтр** для быстрого поиска эндпоинтов
7. **Проверяйте иконку замка** 🔒 в Swagger - если открыт 🔓, токен не добавлен
8. **Храните токен безопасно** - не коммитьте в Git, используйте переменные окружения

### Быстрая проверка JWT токена

В Swagger UI:
- 🔓 **Открытый замок** = токен НЕ установлен
- 🔒 **Закрытый замок** = токен установлен, можно использовать защищенные эндпоинты (✅)

В curl:
```bash
# Правильно ✅
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Неправильно ❌
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Нет "Bearer"
Authorization: Bearer Bearer eyJhbG...                   # Двойной "Bearer"
```

---

## 📦 Что входит в документацию

### Автоматически документируются:

✅ Все HTTP методы (GET, POST, PUT, DELETE)  
✅ Параметры пути (:id, :chatId)  
✅ Query параметры  
✅ Тело запроса (Body)  
✅ Ответы с примерами  
✅ Коды ошибок  
✅ JWT аутентификация  
✅ Валидация данных  
✅ Типы данных и форматы  

### НЕ документируются:

❌ WebSocket соединения (используйте отдельные инструменты)  
❌ SSE (Server-Sent Events)  
❌ Загрузка файлов (если не добавлена специальная поддержка)  

---

## 🎓 Дополнительные материалы

- **Swagger Editor:** https://editor.swagger.io/
- **OpenAPI Spec:** https://swagger.io/specification/
- **NestJS Docs:** https://docs.nestjs.com/openapi/introduction

---

## ✨ Что нового

### Версия 1.0.0
- ✅ Добавлены @ApiProperty ко всем DTO
- ✅ Добавлены @ApiOperation ко всем эндпоинтам
- ✅ Описаны все коды ответов
- ✅ Автоматический экспорт JSON при старте
- ✅ Улучшенное описание API
- ✅ Добавлены теги для группировки
- ✅ Настроена Bearer аутентификация
- ✅ Добавлен фильтр и поиск

---

**Приятной работы с API!** 🚀

Если возникли вопросы - проверьте консоль браузера и логи сервера.
