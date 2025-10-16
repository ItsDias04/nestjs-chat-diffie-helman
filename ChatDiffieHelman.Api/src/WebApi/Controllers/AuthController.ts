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
import { BmcService } from 'src/BL/Services/BmcService';
import { JwtAuthGuard } from '../Helpers/JwtAuthGuard';
import { UserData } from '../Helpers/UserData';
import { CurrentUser } from '../Helpers/CurrentUser';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly fiatService: FiatService,
    private readonly bmcService: BmcService,
  ) {}
  @Post('login')
  @ApiBody({ type: LoginDto })
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
  async fiatStart(
    @Body() body: { sid: string; t: string },
  ): Promise<{ c: number }> {
    return this.fiatService.start(body.sid, body.t);
  }

  @Post('fiat/finish')
  async fiatFinish(
    @Body() body: { sid: string; r: string },
  ): Promise<{ access_token: string | null }> {
    return this.fiatService.finish(body.sid, body.r);
  }

  // Brickell–McCurley identification
  @Post('bmc/start')
  async bmcStart(
    @Body() body: { sid: string; a: string },
  ): Promise<{ r: number }> {
    return this.bmcService.start(body.sid, body.a);
  }

  @Post('bmc/finish')
  async bmcFinish(
    @Body() body: { sid: string; e: string },
  ): Promise<{ access_token: string | null }> {
    return this.bmcService.finish(body.sid, body.e);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('fiat/enable/:userId')
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
  async disableFiatForUser(
    @CurrentUser() user: UserData,
    @Param('userId') userId: string,
  ): Promise<UserDto> {
    return this.authService.disableFiatForUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('bmc/enable/:userId')
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
  async disableBmcForUser(
    @Param('userId') userId: string,
  ): Promise<UserDto> {
    return this.authService.disableBmcForUser(userId) as any;
  }
}
