# Chat Diffie-Hellman (NestJS + Angular + NativeScript)

English / Русский

## About

This repository contains a multi-platform chat application demonstrating secure message exchange using the Diffie–Hellman key agreement algorithm. The project includes:

- ChatDiffieHelman.Api — a NestJS backend (REST + WebSocket gateways).
- ChatDiffieHelman.WebClient — an Angular web client.
- NativeScript/DiffieHelmanChatMobile — a NativeScript mobile client (Android/iOS).

The goal is to showcase an end-to-end chat flow with cryptographically-inspired secure key exchange for private messaging between users.

## Contents / Содержание

- ChatDiffieHelman.Api/: NestJS API and WebSocket gateways.
- ChatDiffieHelman.WebClient/: Angular single-page application.
- NativeScript/: Mobile application using NativeScript (optional, platform-specific).

## Quick start (recommended order) / Быстрый старт (рекомендуемый порядок)

1. API (server)

   - Open a terminal and go to the API folder:

     cd ChatDiffieHelman.Api

   - Install dependencies and start in development mode (assumes npm/yarn is available):

     npm install
     npm run start:dev

   - The server typically listens on port 3000 by default (verify `src/main.ts` or `package.json` scripts).

2. Web client (Angular)

   - In a new terminal, go to the web client folder:

     cd ChatDiffieHelman.WebClient

   - Install dependencies and run the dev server:

     npm install
     npm start

   - Open the app in a browser (usually at http://localhost:4200). Adjust ports if the NestJS server uses different defaults.

3. Mobile client (optional)

   - The NativeScript mobile client is located under `NativeScript/DiffieHelmanChatMobile`.
   - Follow NativeScript docs for setting up Android/iOS builds and run using NativeScript CLI.

## Features / Возможности

- User registration, login, and profile management.
- Real-time chat using WebSockets (GateWays folder in the API).
- Diffie–Hellman key exchange flow for private message keys (implemented in DTOs and GateWays).
- Basic invite/room management and message persistence.

## Project structure (high level) / Структура проекта (вкратце)

- src/BL — business logic services (AuthService, ChatService, MessageService, etc.).
- src/Data/Entities — TypeORM/Entity classes (Chat, Message, User, Invite).
- src/DTO — Data transfer objects used by controllers and gateways.
- src/WebApi/Controllers — REST controllers for API endpoints.
- src/WebApi/GateWays — WebSocket gateways for real-time events.

## Environment & configuration / Окружение и конфигурация

- Check `package.json` scripts in each subproject for available commands.
- Common environment variables (may vary by subproject):
  - NODE_ENV
  - DATABASE_URL or connection settings inside Api project
  - JWT_SECRET (for auth)

Provide sensible defaults or a `.env.example` file if not present.

## Development notes / Примечания для разработки

- Follow NestJS best practices for adding modules, services and controllers.
- The WebClient is a standard Angular app — add components and services in `src/app`.
- Mobile client uses NativeScript with TypeScript — platform-specific code lives under `NativeScript/DiffieHelmanChatMobile/src`.

Edge cases and considerations / Краевые случаи и соображения

- When running across different ports or hosts, configure CORS in the NestJS API and the WebSocket client endpoints.
- Database migrations / sync: check how entities are synchronized — in production use migrations rather than `synchronize: true`.

## Tests / Тесты

- The API contains Jest e2e tests in `src/test` (example: `app.e2e-spec.ts`).
- Run tests from the API directory:

  npm test

## Contributing / Как внести вклад

- Fork the repo, create a feature branch, and open a pull request with a clear description.
- Add or update tests for new functionality.

## Assumptions made while writing this README / Предположения, сделанные при написании README

- I inferred typical npm scripts (`start`, `start:dev`, `test`, etc.) based on common NestJS/Angular setups. If your scripts differ, use the actual commands from `package.json` in each subproject.
- Exact port numbers, environment variable names, and build commands may vary. Check each subproject's `package.json` and `src/main.ts` (or equivalent) for precise values.

## License / Лицензия

Specify the license for the repository (e.g., MIT) or add a `LICENSE` file in the repo root.

---

If you want, I can:

- Update subproject READMEs (`ChatDiffieHelman.Api/README.md`, `ChatDiffieHelman.WebClient/README.md`) with specific commands from their `package.json` files.
- Add a `.env.example` with the commonly used environment variables (I will infer reasonable defaults).
- Create quick run scripts or tasks for Windows PowerShell if you prefer one-step startup.

Если хотите, могу:
