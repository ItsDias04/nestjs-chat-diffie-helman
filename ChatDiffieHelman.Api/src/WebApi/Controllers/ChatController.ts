import { Controller, Get, Post, Param, Body, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags, ApiOperation, ApiOkResponse, ApiParam, ApiBody, ApiResponse } from "@nestjs/swagger";
import { ChatService } from "src/BL/Services/ChatService";
import { JwtAuthGuard } from "../Helpers/JwtAuthGuard";
import { CurrentUser } from "../Helpers/CurrentUser";
import { UserData } from "../Helpers/UserData";
import { ChatDto } from "src/DTO/ChatDto";
import { UserDto } from "src/DTO/UserDto";

@ApiTags('chats')
@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get()
  @ApiOperation({ summary: 'Получить мои чаты', description: 'Возвращает список всех чатов текущего пользователя' })
  @ApiOkResponse({ type: ChatDto, isArray: true, description: 'Список чатов' })
  async getMyChats(@CurrentUser() user: UserData): Promise<ChatDto[]> {
    return this.chatService.getAllChatsById(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get(':chatId')
  @ApiOperation({ summary: 'Получить чат по ID', description: 'Возвращает информацию о конкретном чате' })
  @ApiParam({ name: 'chatId', type: 'string', format: 'uuid', description: 'UUID чата' })
  @ApiOkResponse({ type: ChatDto, description: 'Данные чата' })
  @ApiResponse({ status: 404, description: 'Чат не найден' })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  async getChat(@CurrentUser() user: UserData, @Param('chatId') chatId: string): Promise<ChatDto | null> {
    return this.chatService.getChatById(user.userId, chatId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get(':chatId/users')
  @ApiOperation({ summary: 'Получить участников чата', description: 'Возвращает список всех пользователей в чате' })
  @ApiParam({ name: 'chatId', type: 'string', format: 'uuid', description: 'UUID чата' })
  @ApiOkResponse({ type: UserDto, isArray: true, description: 'Список участников' })
  @ApiResponse({ status: 404, description: 'Чат не найден' })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  async getChatUsers(@CurrentUser() user: UserData, @Param('chatId') chatId: string): Promise<UserDto[]> {
    return this.chatService.getChatUsers(user.userId, chatId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post()
  @ApiOperation({ summary: 'Создать новый чат', description: 'Создает новый чат с указанным названием' })
  @ApiBody({ 
    schema: {
      properties: {
        name: { type: 'string', description: 'Название чата', example: 'My Chat Room' }
      }
    }
  })
  @ApiOkResponse({ type: ChatDto, description: 'Созданный чат' })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  async createChat(
    @CurrentUser() user: UserData,
    @Body('name') name: string
  ): Promise<ChatDto> {
    return this.chatService.createChat(name, user.userId);
  }
}