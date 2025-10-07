import { Body, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserService } from 'src/BL/Services/UserService';
import { ChatDto } from 'src/DTO/ChatDto';
import { UserDto } from 'src/DTO/UserDto';
import { Controller } from '@nestjs/common';
import { RegisterDto } from 'src/DTO/RegisterDto';
import { ApiBearerAuth, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { AuthService } from 'src/BL/Services/AuthService';
import { LoginDto } from 'src/DTO/LoginDto';
import { FiatService } from 'src/BL/Services/FiatService';
import { JwtAuthGuard } from '../Helpers/JwtAuthGuard';
import { UserData } from '../Helpers/UserData';
import { CurrentUser } from '../Helpers/CurrentUser';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly fiatService: FiatService,
  ) {}
  @Post('login')
  @ApiBody({ type: LoginDto })
  async login(@Body() data: LoginDto): Promise<{
    access_token: string | null;
    fiat_required: boolean;
    fiat_session_id: string | null;
  }> {
    return this.authService.login(data);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('fiat/start')
  async fiatStart(
    @Body() body: { sid: string; t: string },
  ): Promise<{ c: number }> {
    return this.fiatService.start(body.sid, body.t);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('fiat/finish')
  async fiatFinish(
    @Body() body: { sid: string; r: string },
  ): Promise<{ access_token: string | null }> {
    return this.fiatService.finish(body.sid, body.r);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('fiat/enable/:userId')
  async enableFiatForUser(
    @Param('userId') userId: string,
    // @Body('n') n: string,
    @Body('v') v: string,
  ): Promise<UserDto> {
    return this.authService.enableFiatForUser(userId, v);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('fiat/disable/:userId')
  async disableFiatForUser(
    @CurrentUser() user: UserData,
    @Param('userId') userId: string,
  ): Promise<UserDto> {
    return this.authService.disableFiatForUser(userId);
  }
}
