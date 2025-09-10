import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder } from '@nestjs/swagger/dist/document-builder';
import { SwaggerModule } from '@nestjs/swagger/dist/swagger-module';
import { ValidationPipe } from '@nestjs/common';

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
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
