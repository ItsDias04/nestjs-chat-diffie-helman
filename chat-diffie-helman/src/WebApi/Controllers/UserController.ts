import { Body, Get, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { UserService } from "src/BL/Services/UserService";
import { ChatDto } from "src/DTO/ChatDto";
import { UserDto } from "src/DTO/UserDto";
import { Controller } from "@nestjs/common";
import { RegisterDto } from "src/DTO/RegisterDto";
import { ApiBearerAuth, ApiBody, ApiOkResponse } from "@nestjs/swagger";
import { CurrentUser } from "../Helpers/CurrentUser";
import { JwtAuthGuard } from "../Helpers/JwtAuthGuard";
import { UserData } from "../Helpers/UserData";

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get('all')
  @ApiOkResponse({ type: UserDto, isArray: true })
  async getAllUsers(): Promise<UserDto[]> {
    return this.userService.getAllUsers();
  }   
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get('me')
    // @ApiOkResponse({ type: UserDto })
  getMe(@CurrentUser() user: UserData): UserData {
    return user; // { userId, email }
  }
  @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
  @Get(':id')
  @ApiOkResponse({ type: UserDto })
  async getUser(@Param('id', new ParseUUIDPipe()) id: string): Promise<UserDto | null> {
    return this.userService.findById(id);
  }

  @Post('registration')
  @ApiBody({ type: RegisterDto })
  async registerUser(@Body() data: RegisterDto): Promise<UserDto> {
      return this.userService.register(data);
    }


}
