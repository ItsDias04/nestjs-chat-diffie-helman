import {
  Body,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserService } from 'src/BL/Services/UserService';
import { ChatDto } from 'src/DTO/ChatDto';
import { UserDto } from 'src/DTO/UserDto';
import { Controller } from '@nestjs/common';
import { RegisterDto } from 'src/DTO/RegisterDto';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from '../Helpers/CurrentUser';
import { JwtAuthGuard } from '../Helpers/JwtAuthGuard';
import { UserData } from '../Helpers/UserData';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get('all')
  @ApiOperation({ summary: 'Получить всех пользователей', description: 'Возвращает список всех зарегистрированных пользователей' })
  @ApiOkResponse({ type: UserDto, isArray: true, description: 'Список пользователей' })
  async getAllUsers(): Promise<UserDto[]> {
    return this.userService.getAllUsers();
  }
  
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get('me')
  @ApiOperation({ summary: 'Получить информацию о текущем пользователе', description: 'Возвращает данные авторизованного пользователя' })
  @ApiOkResponse({ type: UserDto, description: 'Данные текущего пользователя' })
  getMe(@CurrentUser() user: UserData): UserDto {
    return this.userService.findById(user.userId) as unknown as UserDto;
  }
  
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get(':id')
  @ApiOperation({ summary: 'Получить пользователя по ID', description: 'Возвращает информацию о конкретном пользователе' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'UUID пользователя' })
  @ApiOkResponse({ type: UserDto, description: 'Данные пользователя' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async getUser(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<UserDto | null> {
    return this.userService.findById(id);
  }

  @Post('registration')
  @ApiOperation({ summary: 'Регистрация нового пользователя', description: 'Создает нового пользователя в системе' })
  @ApiBody({ type: RegisterDto })
  @ApiOkResponse({ type: UserDto, description: 'Зарегистрированный пользователь' })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 409, description: 'Пользователь с таким email уже существует' })
  async registerUser(@Body() data: RegisterDto): Promise<UserDto> {
    return this.userService.register(data);
  }
}
