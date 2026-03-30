import { Body, Get, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { UserDto } from 'src/DTO/UserDto';
import { Controller } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthService } from 'src/BL/Services/AuthService';
import { LoginDto } from 'src/DTO/LoginDto';
import { FiatService } from 'src/BL/Services/FiatService';
import { BmcService } from 'src/BL/Services/BmcService';
import { UniAuthSsoService } from 'src/BL/Services/UniAuthSsoService';
import { JwtAuthGuard } from '../Helpers/JwtAuthGuard';
import { UserData } from '../Helpers/UserData';
import { CurrentUser } from '../Helpers/CurrentUser';
import { Response } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly fiatService: FiatService,
    private readonly bmcService: BmcService,
    private readonly uniAuthSsoService: UniAuthSsoService,
  ) {}
  @Post('login')
  @ApiOperation({
    summary: 'Вход пользователя',
    description:
      'Аутентификация пользователя с email и паролем. Может потребовать дополнительную идентификацию (Fiat-Shamir или BMC).',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Успешный вход или требуется дополнительная идентификация',
    schema: {
      properties: {
        access_token: {
          type: 'string',
          nullable: true,
          description:
            'JWT токен (null если требуется дополнительная идентификация)',
        },
        fiat_required: {
          type: 'boolean',
          description: 'Требуется ли идентификация Fiat-Shamir',
        },
        fiat_session_id: {
          type: 'string',
          nullable: true,
          description: 'ID сессии Fiat-Shamir',
        },
        bmc_required: {
          type: 'boolean',
          description: 'Требуется ли идентификация Brickell–McCurley',
        },
        bmc_session_id: {
          type: 'string',
          nullable: true,
          description: 'ID сессии BMC',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Неверные учетные данные' })
  async login(@Body() data: LoginDto): Promise<{
    access_token: string | null;
    fiat_required: boolean;
    fiat_session_id: string | null;
    bmc_required?: boolean;
    bmc_session_id?: string | null;
  }> {
    return this.authService.login(data);
  }

  @Post('uniauth/start')
  @ApiOperation({
    summary: 'Начать вход через UniAuth',
    description:
      'Получает Token 1 в UniAuth и возвращает redirectUrl на bridge страницу UniAuth.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  })
  @ApiOkResponse({
    description: 'Ссылка для перехода на UniAuth bridge',
    schema: {
      properties: {
        redirectUrl: {
          type: 'string',
          example: 'http://localhost:4200/oauth2/external-redirect/<token1>',
        },
      },
    },
  })
  async startUniAuth(): Promise<{ redirectUrl: string }> {
    return this.uniAuthSsoService.start();
  }

  @Get('uniauth/callback')
  @ApiOperation({
    summary: 'Callback входа через UniAuth',
    description:
      'Принимает token3, валидирует его через UniAuth и редиректит пользователя обратно во внешний frontend.',
  })
  @ApiQuery({
    name: 'token3',
    required: false,
    description: 'Одноразовый Token 3 от UniAuth bridge',
  })
  @ApiResponse({
    status: 302,
    description: 'Редирект на login страницу web-клиента с результатом входа',
  })
  @ApiResponse({
    status: 502,
    description: 'Fallback HTML-страница при ошибке redirect или сети',
  })
  async uniAuthCallback(
    @Query('token3') token3: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    if (!token3) {
      this.redirectToLoginWithError(res, 'В callback отсутствует token3.');
      return;
    }

    const callbackResult = await this.uniAuthSsoService.handleCallback(token3);

    if (callbackResult.status === 'OK') {
      this.redirectToLoginWithToken(res, callbackResult.accessToken);
      return;
    }

    this.redirectToLoginWithError(res, callbackResult.reason);
  }

  @Post('fiat/start')
  @ApiOperation({
    summary: 'Начать идентификацию Fiat-Shamir',
    description: 'Первый шаг протокола идентификации Fiat-Shamir',
  })
  @ApiBody({
    schema: {
      properties: {
        sid: { type: 'string', description: 'ID сессии' },
        t: {
          type: 'string',
          description: 'Обязательство (commitment) t = r² mod n',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Возвращает вызов (challenge)',
    schema: {
      properties: {
        c: { type: 'number', description: 'Случайный вызов (0 или 1)' },
      },
    },
  })
  async fiatStart(
    @Body() body: { sid: string; t: string },
  ): Promise<{ c: number }> {
    return this.fiatService.start(body.sid, body.t);
  }

  @Post('fiat/finish')
  @ApiOperation({
    summary: 'Завершить идентификацию Fiat-Shamir',
    description: 'Второй шаг протокола идентификации Fiat-Shamir',
  })
  @ApiBody({
    schema: {
      properties: {
        sid: { type: 'string', description: 'ID сессии' },
        r: { type: 'string', description: 'Ответ r = x·c + y mod n' },
      },
    },
  })
  @ApiOkResponse({
    description: 'JWT токен при успешной идентификации',
    schema: {
      properties: {
        access_token: {
          type: 'string',
          nullable: true,
          description: 'JWT токен доступа',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Идентификация не пройдена' })
  async fiatFinish(
    @Body() body: { sid: string; r: string },
  ): Promise<{ access_token: string | null }> {
    return this.fiatService.finish(body.sid, body.r);
  }

  // Brickell–McCurley identification
  @Post('bmc/start')
  @ApiOperation({
    summary: 'Начать идентификацию Brickell–McCurley',
    description: 'Первый шаг протокола идентификации Brickell–McCurley',
  })
  @ApiBody({
    schema: {
      properties: {
        sid: { type: 'string', description: 'ID сессии' },
        a: { type: 'string', description: 'Обязательство a = g^k mod n' },
      },
    },
  })
  @ApiOkResponse({
    description: 'Возвращает случайный вызов',
    schema: {
      properties: {
        r: { type: 'number', description: 'Случайное число вызова' },
      },
    },
  })
  async bmcStart(
    @Body() body: { sid: string; a: string },
  ): Promise<{ r: number }> {
    return this.bmcService.start(body.sid, body.a);
  }

  @Post('bmc/finish')
  @ApiOperation({
    summary: 'Завершить идентификацию Brickell–McCurley',
    description: 'Второй шаг протокола идентификации Brickell–McCurley',
  })
  @ApiBody({
    schema: {
      properties: {
        sid: { type: 'string', description: 'ID сессии' },
        e: { type: 'string', description: 'Ответ e = k + r·x mod (n-1)' },
      },
    },
  })
  @ApiOkResponse({
    description: 'JWT токен при успешной идентификации',
    schema: {
      properties: {
        access_token: {
          type: 'string',
          nullable: true,
          description: 'JWT токен доступа',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Идентификация не пройдена' })
  async bmcFinish(
    @Body() body: { sid: string; e: string },
  ): Promise<{ access_token: string | null }> {
    return this.bmcService.finish(body.sid, body.e);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('fiat/enable/:userId')
  @ApiOperation({
    summary: 'Включить Fiat-Shamir для пользователя',
    description: 'Активация протокола Fiat-Shamir идентификации',
  })
  @ApiBody({
    schema: {
      properties: {
        v: { type: 'string', description: 'Публичный ключ v = s² mod n' },
        n: {
          type: 'string',
          description: 'Модуль n (произведение двух простых чисел)',
        },
      },
    },
  })
  @ApiOkResponse({ type: String, description: 'Сообщение об успехе' })
  async enableFiatForUser(
    @Param('userId') userId: string,

    @Body('v') v: string,
    @Body('n') n: string,
  ): Promise<string> {
    return this.authService.enableFiatForUser(userId, v, n);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('fiat/disable/:userId')
  @ApiOperation({
    summary: 'Отключить Fiat-Shamir для пользователя',
    description: 'Деактивация протокола Fiat-Shamir идентификации',
  })
  @ApiOkResponse({
    type: UserDto,
    description: 'Обновленные данные пользователя',
  })
  async disableFiatForUser(
    @CurrentUser() user: UserData,
    @Param('userId') userId: string,
  ): Promise<UserDto> {
    return this.authService.disableFiatForUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('bmc/enable/:userId')
  @ApiOperation({
    summary: 'Включить Brickell–McCurley для пользователя',
    description: 'Активация протокола Brickell–McCurley идентификации',
  })
  @ApiBody({
    schema: {
      properties: {
        n: { type: 'string', description: 'Модуль n' },
        g: { type: 'string', description: 'Генератор g' },
        y: { type: 'string', description: 'Публичный ключ y = g^x mod n' },
      },
    },
  })
  @ApiOkResponse({
    type: UserDto,
    description: 'Обновленные данные пользователя',
  })
  async enableBmcForUser(
    @Param('userId') userId: string,
    @Body('n') n: string,
    @Body('g') g: string,
    @Body('y') y: string,
  ): Promise<UserDto> {
    return this.authService.enableBmcForUser(userId, n, g, y) as any;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('bmc/disable/:userId')
  @ApiOperation({
    summary: 'Отключить Brickell–McCurley для пользователя',
    description: 'Деактивация протокола Brickell–McCurley идентификации',
  })
  @ApiOkResponse({
    type: UserDto,
    description: 'Обновленные данные пользователя',
  })
  async disableBmcForUser(@Param('userId') userId: string): Promise<UserDto> {
    return this.authService.disableBmcForUser(userId) as any;
  }

  private redirectToLoginWithToken(res: Response, accessToken: string): void {
    const loginUrl = this.buildFrontendLoginUrl({
      uniauthToken: accessToken,
      returnUrl: this.getSuccessPath(),
    });

    if (loginUrl) {
      res.redirect(loginUrl);
      return;
    }

    res
      .status(500)
      .send(
        this.renderFallbackPage(
          'Вход через UniAuth выполнен, но не удалось сделать redirect в web-клиент.',
        ),
      );
  }

  private redirectToLoginWithError(res: Response, message: string): void {
    const safeMessage = this.normalizeErrorMessage(message);
    const loginUrl = this.buildFrontendLoginUrl({
      uniauthError: safeMessage,
    });

    if (loginUrl) {
      res.redirect(loginUrl);
      return;
    }

    res.status(502).send(this.renderFallbackPage(safeMessage));
  }

  private buildFrontendLoginUrl(params: Record<string, string>): string | null {
    try {
      const frontendBase = (
        process.env.UNI_AUTH_EXTERNAL_WEB_BASE || 'http://localhost:4400'
      ).trim();
      if (!frontendBase) {
        return null;
      }

      const url = new URL('/login', frontendBase);
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }

      return url.toString();
    } catch {
      return null;
    }
  }

  private getSuccessPath(): string {
    const rawPath = (
      process.env.UNI_AUTH_SUCCESS_REDIRECT_PATH || '/chats'
    ).trim();
    if (!rawPath) {
      return '/chats';
    }

    return rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  }

  private normalizeErrorMessage(message: string): string {
    const trimmed = (message || '').trim();
    if (!trimmed) {
      return 'Не удалось выполнить вход через UniAuth.';
    }

    return trimmed.length > 240 ? `${trimmed.slice(0, 240)}...` : trimmed;
  }

  private renderFallbackPage(message: string): string {
    const escapedMessage = this.escapeHtml(message);

    return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Ошибка входа UniAuth</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 24px; background: #f6f7fb; color: #1f2937; }
    .card { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); }
    h1 { margin-top: 0; font-size: 22px; }
    p { line-height: 1.45; }
    button { margin-top: 16px; background: #7d173f; color: #fff; padding: 10px 16px; border: 0; border-radius: 8px; cursor: pointer; }
    .error { margin-top: 12px; color: #b91c1c; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Вход через UniAuth не выполнен</h1>
    <p>${escapedMessage}</p>
    <button id="retry-btn" type="button">Повторить вход через UniAuth</button>
    <p id="retry-error" class="error"></p>
  </div>
  <script>
    const retryButton = document.getElementById('retry-btn');
    const retryError = document.getElementById('retry-error');
    retryButton.addEventListener('click', async () => {
      retryButton.disabled = true;
      retryError.textContent = '';

      try {
        const response = await fetch('/auth/uniauth/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}'
        });

        const payload = await response.json();
        if (!response.ok || !payload.redirectUrl) {
          throw new Error('Cannot get redirectUrl');
        }

        window.location.href = payload.redirectUrl;
      } catch (error) {
        retryError.textContent = 'Не удалось повторно начать авторизацию. Попробуйте позже.';
        retryButton.disabled = false;
      }
    });
  </script>
</body>
</html>`;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
