import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MessageService } from 'src/BL/Services/MessageService';
import { MessageDto } from 'src/DTO/MessageDto';
import { JwtAuthGuard } from '../Helpers/JwtAuthGuard';
import { CurrentUser } from '../Helpers/CurrentUser';
import { UserData } from '../Helpers/UserData';

@ApiTags('messages')
@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get(':chatId')
  async getMessages(@CurrentUser() user: UserData, @Param('chatId') chatId: string): Promise<MessageDto[]> {
    // Можно добавить проверку, что user состоит в чате
    return this.messageService.getMessagesInChat(user.userId, chatId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post(':chatId')
  async sendMessage(
    @CurrentUser() user: UserData,
    @Param('chatId') chatId: string,
    @Body() messageDto: MessageDto,
  ): Promise<MessageDto> {
    // messageDto может содержать toClientId для приватных сообщений (Diffie-Hellman)
    return this.messageService.addMessageToChat(user.userId, chatId, messageDto);
  }
}