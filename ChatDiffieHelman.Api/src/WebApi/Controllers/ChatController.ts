import { Controller, Get, Post, Param, Body, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
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
  async getMyChats(@CurrentUser() user: UserData): Promise<ChatDto[]> {
    return this.chatService.getAllChatsById(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get(':chatId')
  async getChat(@CurrentUser() user: UserData, @Param('chatId') chatId: string): Promise<ChatDto | null> {
    return this.chatService.getChatById(user.userId, chatId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get(':chatId/users')
  async getChatUsers(@CurrentUser() user: UserData, @Param('chatId') chatId: string): Promise<UserDto[]> {
    return this.chatService.getChatUsers(user.userId, chatId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post()
  async createChat(
    @CurrentUser() user: UserData,
    @Body('name') name: string
  ): Promise<ChatDto> {
    return this.chatService.createChat(name, user.userId);
  }
}