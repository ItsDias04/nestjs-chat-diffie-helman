# ChatDiffieHelman.Api

NestJS API для чата с криптографической защитой.

## 📚 Документация API

### Swagger (OpenAPI)

После запуска приложения доступна интерактивная документация:

**Swagger UI:** http://localhost:3001/api  
**JSON спецификация:** http://localhost:3001/api-json  
**YAML спецификация:** http://localhost:3001/api-yaml

**Автоматически создаваемый файл:** `swagger-spec.json` (в корне проекта)

### Подробные руководства

📖 **[SWAGGER-GUIDE-RU.md](./SWAGGER-GUIDE-RU.md)** - Полное руководство на русском языке  
📄 **[API-DOCUMENTATION.md](./API-DOCUMENTATION.md)** - Подробная документация всех эндпоинтов  
🔐 **[JWT-AUTHENTICATION-GUIDE.md](./JWT-AUTHENTICATION-GUIDE.md)** - Руководство по JWT аутентификации

---

## 🚀 Требования

- Node.js (v18+)
- npm или yarn
- PostgreSQL (для базы данных)

## 📦 Установка

```bash
cd ChatDiffieHelman.Api
npm install
```

## 🏃 Запуск

### Режим разработки (с автоперезагрузкой)

```bash
npm run start:dev
```

### Продакшн режим

```bash
npm run build
npm run start:prod
```

### Отладка

```bash
npm run start:debug
```

После запуска:

- **API:** http://localhost:3001
- **Swagger:** http://localhost:3001/api

---

## 📝 Доступные скрипты

| Команда               | Описание                       |
| --------------------- | ------------------------------ |
| `npm run build`       | Компиляция проекта             |
| `npm run format`      | Форматирование кода (Prettier) |
| `npm start`           | Запуск продакшн сервера        |
| `npm run start:dev`   | Запуск в режиме разработки     |
| `npm run start:debug` | Запуск в режиме отладки        |
| `npm run start:prod`  | Запуск скомпилированной версии |
| `npm run lint`        | Проверка и автофикс ESLint     |
| `npm test`            | Запуск тестов                  |
| `npm run test:e2e`    | Запуск e2e тестов              |

---

## 🔧 Конфигурация

### Переменные окружения

Создайте файл `.env` в корне проекта:

```env
PORT=3002
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=chat_db
JWT_SECRET=your_jwt_secret

# UniAuth SSO
UNI_AUTH_API_BASE=http://localhost:3001/api/v1
UNI_AUTH_WEB_BASE=http://localhost:4200
UNI_AUTH_APPLICATION_ID=your-application-id
UNI_AUTH_OWNER_ACCESS_TOKEN=owner-jwt-token-in-uniauth
UNI_AUTH_CALLBACK_PATH=/auth/uniauth/callback
UNI_AUTH_HTTP_TIMEOUT_MS=7000

# Redirect в web client после callback
UNI_AUTH_EXTERNAL_WEB_BASE=http://localhost:4400
UNI_AUTH_SUCCESS_REDIRECT_PATH=/chats
```

Готовый шаблон переменных: `.env.example`.

### База данных

Настройте подключение к PostgreSQL в `app.module.ts` или через переменные окружения.

---

## 🎯 Возможности API

### 🔐 Аутентификация

- JWT токены
- Протокол Fiat-Shamir идентификации
- Протокол Brickell–McCurley идентификации

### 💬 Функционал

- Управление пользователями
- Создание и управление чатами
- Отправка и получение сообщений
- Система приглашений
- Обмен ключами Diffie-Hellman

### 🛡️ Безопасность

- Helmet для защиты HTTP заголовков
- Валидация входных данных (class-validator)
- CORS настройка
- Throttling (защита от DDoS)

---

## 📊 Структура проекта

```
src/
├── BL/                      # Бизнес-логика
│   ├── Services/           # Сервисы
│   └── Abstractions/       # Интерфейсы
├── Data/                    # Слой данных
│   └── Entities/           # TypeORM сущности
├── DTO/                     # Data Transfer Objects
├── WebApi/                  # Веб-слой
│   ├── Controllers/        # REST контроллеры
│   ├── GateWays/           # WebSocket шлюзы
│   └── Helpers/            # Вспомогательные классы
└── main.ts                  # Точка входа
```

---

## 🧪 Тестирование

### Unit тесты

```bash
npm test
```

### E2E тесты

```bash
npm run test:e2e
```

### Покрытие кода

```bash
npm run test:cov
```

---

## 🔍 Отладка

### Логи разработки

При запуске в dev режиме автоматически выводятся:

- Адрес приложения
- Ссылка на Swagger документацию
- Ссылки на JSON/YAML спецификации

### VS Code Debug

Создайте `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug NestJS",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "start:debug"],
      "port": 9229,
      "restart": true,
      "console": "integratedTerminal"
    }
  ]
}
```

---

## 📚 Дополнительная документация

- **Security Testing:** [security-testing/](./security-testing/) - Документация по безопасности
- **API Docs:** [API-DOCUMENTATION.md](./API-DOCUMENTATION.md) - Полная документация API
- **Swagger Guide:** [SWAGGER-GUIDE-RU.md](./SWAGGER-GUIDE-RU.md) - Руководство по Swagger

---

## 🤝 Разработка

### Добавление нового эндпоинта

1. Создайте DTO с `@ApiProperty` декораторами
2. Создайте метод в сервисе
3. Добавьте метод в контроллер с декораторами:
   - `@ApiOperation`
   - `@ApiOkResponse`
   - `@ApiResponse` (для ошибок)
4. Swagger документация обновится автоматически!

### Пример

```typescript
@ApiOperation({ summary: 'Создать пользователя' })
@ApiBody({ type: CreateUserDto })
@ApiOkResponse({ type: UserDto })
@ApiResponse({ status: 400, description: 'Некорректные данные' })
@Post()
async create(@Body() dto: CreateUserDto): Promise<UserDto> {
  return this.userService.create(dto);
}
```

---

## 🐛 Известные проблемы

- WebSocket эндпоинты не отображаются в Swagger (используйте отдельные инструменты для тестирования)
- При первом запуске может потребоваться создание базы данных

---

## 📝 Заметки

- По умолчанию сервер запускается на порту 3001
- CORS настроен для `http://localhost:4200` (Angular frontend)
- JWT токены имеют ограниченный срок действия
- Для WebSocket соединений используйте Socket.IO клиент

---

Requirements

- Node.js and npm (or yarn)

Install

cd ChatDiffieHelman.Api
npm install

Available scripts (from package.json)

- npm run build — compile the project (nest build)
- npm run format — run Prettier to format source files
- npm start — run production server (nest start)
- npm run start:dev — run in development mode with watch (nest start --watch)
- npm run start:debug — run in debug mode with watch
- npm run start:prod — run compiled production build (node dist/main)
- npm run lint — run ESLint and autofix
- npm test — run Jest tests
- npm run test:e2e — run e2e Jest tests (test/jest-e2e.json)

Running locally (development)

1. Make sure your environment variables are set (see repository `.env.example`).
2. Start the API in dev mode:

cd ChatDiffieHelman.Api
npm run start:dev

By default the NestJS server typically listens on port 3001. Check `src/main.ts` to confirm or change this.

Tests

npm test
npm run test:e2e

Notes

- If you use a database, ensure your DB connection environment variables are set and migrations are applied or TypeORM is configured appropriately.
- Configure CORS or WebSocket origins if the frontend is served from a different host/port.
<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
