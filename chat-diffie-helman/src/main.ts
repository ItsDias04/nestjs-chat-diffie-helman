import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder } from '@nestjs/swagger/dist/document-builder';
import { SwaggerModule } from '@nestjs/swagger/dist/swagger-module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './WebApi/Helpers/AllExceptionFilter';
import { GlobalWsExceptionFilter } from './WebApi/Helpers/GlobalWsExceptionFilter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
   const config = new DocumentBuilder()
    .setTitle('My API')
    .setDescription('API description')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'access-token' // идентификатор схемы — используйте его в @ApiBearerAuth()
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Применяем авторизацию глобально — все операции получат замочек и будут
  // автоматически отправлять заголовок Authorization после авторизации в UI
  document.security = [{ 'access-token': [] }];

  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // сохраняет токен при перезагрузке UI
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
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
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
    console.error('Express error middleware caught:', err && (err.stack || err));

    const status = err && (err.status || err.statusCode) ? (err.status || err.statusCode) : 500;
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
}
bootstrap();
