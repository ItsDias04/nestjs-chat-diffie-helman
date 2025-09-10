import { Body, Get, Param, Post } from "@nestjs/common";
import { UserService } from "src/BL/Services/UserService";
import { ChatDto } from "src/DTO/ChatDto";
import { UserDto } from "src/DTO/UserDto";
import { Controller } from "@nestjs/common";
import { RegisterDto } from "src/DTO/RegisterDto";
import { ApiBody, ApiOkResponse } from "@nestjs/swagger";
import { AuthService } from "src/BL/Services/AuthService";
import { LoginDto } from "src/DTO/LoginDto";

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
    @Post('login')
    @ApiBody({ type: LoginDto })
    async login(@Body() data: LoginDto): Promise<{ access_token: string }> {
        return this.authService.login(data);
    }
}