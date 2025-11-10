import { Body, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserService } from 'src/BL/Services/UserService';
import { ChatDto } from 'src/DTO/ChatDto';
import { UserDto } from 'src/DTO/UserDto';
import { Controller } from '@nestjs/common';
import { RegisterDto } from 'src/DTO/RegisterDto';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from 'src/BL/Services/AuthService';
import { LoginDto } from 'src/DTO/LoginDto';
import { FiatService } from 'src/BL/Services/FiatService';
import { BmcService } from 'src/BL/Services/BmcService';
import { JwtAuthGuard } from '../Helpers/JwtAuthGuard';
import { UserData } from '../Helpers/UserData';
import { CurrentUser } from '../Helpers/CurrentUser';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly fiatService: FiatService,
    private readonly bmcService: BmcService,
  ) {}
  @Post('login')
  @ApiOperation({ summary: 'Вход пользователя', description: 'Аутентификация пользователя с email и паролем. Может потребовать дополнительную идентификацию (Fiat-Shamir или BMC).' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ 
    description: 'Успешный вход или требуется дополнительная идентификация',
    schema: {
      properties: {
        access_token: { type: 'string', nullable: true, description: 'JWT токен (null если требуется дополнительная идентификация)' },
        fiat_required: { type: 'boolean', description: 'Требуется ли идентификация Fiat-Shamir' },
        fiat_session_id: { type: 'string', nullable: true, description: 'ID сессии Fiat-Shamir' },
        bmc_required: { type: 'boolean', description: 'Требуется ли идентификация Brickell–McCurley' },
        bmc_session_id: { type: 'string', nullable: true, description: 'ID сессии BMC' }
      }
    }
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


  @Post('fiat/start')
  @ApiOperation({ summary: 'Начать идентификацию Fiat-Shamir', description: 'Первый шаг протокола идентификации Fiat-Shamir' })
  @ApiBody({ 
    schema: {
      properties: {
        sid: { type: 'string', description: 'ID сессии' },
        t: { type: 'string', description: 'Обязательство (commitment) t = r² mod n' }
      }
    }
  })
  @ApiOkResponse({ 
    description: 'Возвращает вызов (challenge)',
    schema: {
      properties: {
        c: { type: 'number', description: 'Случайный вызов (0 или 1)' }
      }
    }
  })
  async fiatStart(
    @Body() body: { sid: string; t: string },
  ): Promise<{ c: number }> {
    return this.fiatService.start(body.sid, body.t);
  }

  @Post('fiat/finish')
  @ApiOperation({ summary: 'Завершить идентификацию Fiat-Shamir', description: 'Второй шаг протокола идентификации Fiat-Shamir' })
  @ApiBody({ 
    schema: {
      properties: {
        sid: { type: 'string', description: 'ID сессии' },
        r: { type: 'string', description: 'Ответ r = x·c + y mod n' }
      }
    }
  })
  @ApiOkResponse({ 
    description: 'JWT токен при успешной идентификации',
    schema: {
      properties: {
        access_token: { type: 'string', nullable: true, description: 'JWT токен доступа' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Идентификация не пройдена' })
  async fiatFinish(
    @Body() body: { sid: string; r: string },
  ): Promise<{ access_token: string | null }> {
    return this.fiatService.finish(body.sid, body.r);
  }

  // Brickell–McCurley identification
  @Post('bmc/start')
  @ApiOperation({ summary: 'Начать идентификацию Brickell–McCurley', description: 'Первый шаг протокола идентификации Brickell–McCurley' })
  @ApiBody({ 
    schema: {
      properties: {
        sid: { type: 'string', description: 'ID сессии' },
        a: { type: 'string', description: 'Обязательство a = g^k mod n' }
      }
    }
  })
  @ApiOkResponse({ 
    description: 'Возвращает случайный вызов',
    schema: {
      properties: {
        r: { type: 'number', description: 'Случайное число вызова' }
      }
    }
  })
  async bmcStart(
    @Body() body: { sid: string; a: string },
  ): Promise<{ r: number }> {
    return this.bmcService.start(body.sid, body.a);
  }

  @Post('bmc/finish')
  @ApiOperation({ summary: 'Завершить идентификацию Brickell–McCurley', description: 'Второй шаг протокола идентификации Brickell–McCurley' })
  @ApiBody({ 
    schema: {
      properties: {
        sid: { type: 'string', description: 'ID сессии' },
        e: { type: 'string', description: 'Ответ e = k + r·x mod (n-1)' }
      }
    }
  })
  @ApiOkResponse({ 
    description: 'JWT токен при успешной идентификации',
    schema: {
      properties: {
        access_token: { type: 'string', nullable: true, description: 'JWT токен доступа' }
      }
    }
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
  @ApiOperation({ summary: 'Включить Fiat-Shamir для пользователя', description: 'Активация протокола Fiat-Shamir идентификации' })
  @ApiBody({ 
    schema: {
      properties: {
        v: { type: 'string', description: 'Публичный ключ v = s² mod n' },
        n: { type: 'string', description: 'Модуль n (произведение двух простых чисел)' }
      }
    }
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
  @ApiOperation({ summary: 'Отключить Fiat-Shamir для пользователя', description: 'Деактивация протокола Fiat-Shamir идентификации' })
  @ApiOkResponse({ type: UserDto, description: 'Обновленные данные пользователя' })
  async disableFiatForUser(
    @CurrentUser() user: UserData,
    @Param('userId') userId: string,
  ): Promise<UserDto> {
    return this.authService.disableFiatForUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('bmc/enable/:userId')
  @ApiOperation({ summary: 'Включить Brickell–McCurley для пользователя', description: 'Активация протокола Brickell–McCurley идентификации' })
  @ApiBody({ 
    schema: {
      properties: {
        n: { type: 'string', description: 'Модуль n' },
        g: { type: 'string', description: 'Генератор g' },
        y: { type: 'string', description: 'Публичный ключ y = g^x mod n' }
      }
    }
  })
  @ApiOkResponse({ type: UserDto, description: 'Обновленные данные пользователя' })
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
  @ApiOperation({ summary: 'Отключить Brickell–McCurley для пользователя', description: 'Деактивация протокола Brickell–McCurley идентификации' })
  @ApiOkResponse({ type: UserDto, description: 'Обновленные данные пользователя' })
  async disableBmcForUser(
    @Param('userId') userId: string,
  ): Promise<UserDto> {
    return this.authService.disableBmcForUser(userId) as any;
  }
}
