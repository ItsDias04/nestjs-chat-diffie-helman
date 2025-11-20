import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder } from '@nestjs/swagger/dist/document-builder';
import { SwaggerModule } from '@nestjs/swagger/dist/swagger-module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './WebApi/Helpers/AllExceptionFilter';
import { GlobalWsExceptionFilter } from './WebApi/Helpers/GlobalWsExceptionFilter';
import helmet from 'helmet';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security: Helmet для защиты HTTP заголовков
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false, // Для WebSocket совместимости
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Chat Diffie-Hellman API')
    .setDescription(
      `
      API для чата с криптографической защитой.
      
      ## Возможности:
      - 🔐 Аутентификация JWT
      - 🔑 Протокол Fiat-Shamir идентификации
      - 🛡️ Протокол Brickell–McCurley идентификации  
      - 💬 Управление чатами и сообщениями
      - 🔒 Обмен ключами Diffie-Hellman для шифрования
      - 👥 Система приглашений
      
      ## Как начать:
      1. Зарегистрируйтесь через \`POST /users/registration\`
      2. Войдите через \`POST /auth/login\`
      3. Используйте полученный токен для авторизации (кнопка "Authorize" вверху)
      
      ## JSON документация доступна по адресу:
      - Swagger UI: \`/api\`
      - JSON схема: \`/api-json\`
      - YAML схема: \`/api-yaml\`
    `,
    )
    .setVersion('1.0.0')
    .setContact('API Support', '', 'support@example.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
        description: 'Введите JWT токен, полученный после авторизации',
      },
      'access-token', // идентификатор схемы — используйте его в @ApiBearerAuth()
    )
    .addTag(
      'auth',
      'Эндпоинты аутентификации и криптографической идентификации',
    )
    .addTag('users', 'Управление пользователями')
    .addTag('chats', 'Управление чатами')
    .addTag('messages', 'Управление сообщениями')
    .addTag('invites', 'Управление приглашениями в чаты')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Применяем авторизацию глобально — все операции получат замочек и будут
  // автоматически отправлять заголовок Authorization после авторизации в UI
  document.security = [{ 'access-token': [] }];

  // Сохраняем JSON документацию в файл
  const outputPath = path.join(__dirname, '..', 'swagger-spec.json');
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2), {
    encoding: 'utf8',
  });
  console.log(`📄 Swagger JSON документация сохранена в: ${outputPath}`);

  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // сохраняет токен при перезагрузке UI
      docExpansion: 'none', // Сворачивает все эндпоинты по умолчанию
      filter: true, // Включает поиск
      showRequestDuration: true, // Показывает время выполнения запросов
      // Опционально: заранее префиллить поле авторизации (удобно для dev)
      // замените значение на 'Bearer <токен>' если хотите автозаполнение
      authAction: {
        'access-token': {
          name: 'Authorization',
          schema: {
            type: 'apiKey',
            in: 'header',
            name: 'Authorization',
          },
          // value: 'Bearer <ВАШ_ТОКЕН>' // <- убрать коммент, чтобы подставлять по умолчанию
        },
      },
    },
  });

  app.enableCors({
    origin: 'http://localhost:4200', // разрешаем Angular
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });

  // Security: Усиленная валидация входных данных
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true, // Удаляет свойства, не описанные в DTO
      forbidNonWhitelisted: true, // Выбрасывает ошибку при лишних полях
      disableErrorMessages: process.env.NODE_ENV === 'production', // Скрывает детали в продакшене
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter()); // твой глобальный фильтр

  // --- Express-level error handler: ловит ошибки, которые выскочили в passport / middleware ---
  // Только если ты используешь Express (по умолчанию Nest uses Express). Если у тебя Fastify —
  // нужен другой подход.
  const server = app.getHttpAdapter().getInstance() as any; // express app
  // NOTE: этот middleware должен быть зарегистрирован **после** app.useGlobalFilters / init,
  // но до app.listen
  server.use((err: any, req: any, res: any, next: any) => {
    // Если заголовки уже отправлены — делегируем стандартной логике Express
    if (res.headersSent) {
      return next(err);
    }

    // Логируем
    console.error(
      'Express error middleware caught:',
      err && (err.stack || err),
    );

    const status =
      err && (err.status || err.statusCode)
        ? err.status || err.statusCode
        : 500;
    const message = err && err.message ? err.message : 'Internal server error';

    res.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: req?.originalUrl ?? req?.url,
      message,
      error: err && err.name ? err.name : 'Error',
    });
  });

  // process-level guards: логируем и предотвращаем мгновенный exit без логов
  process.on('uncaughtException', (err) => {
    console.error('uncaughtException (caught):', err && (err.stack || err));
    // Можно graceful shutdown / уведомить супервайзор (PM2/systemd) и перезапустить
  });

  process.on('unhandledRejection', (reason, p) => {
    console.error('unhandledRejection at promise', p, 'reason:', reason);
  });

  await app.listen(process.env.PORT ?? 3000);

  const port = process.env.PORT ?? 3000;
  console.log(`🚀 Приложение запущено на: http://localhost:${port}`);
  console.log(`📚 Swagger документация: http://localhost:${port}/api`);
  console.log(`📄 JSON спецификация: http://localhost:${port}/api-json`);
  console.log(`📄 YAML спецификация: http://localhost:${port}/api-yaml`);
}
bootstrap();
