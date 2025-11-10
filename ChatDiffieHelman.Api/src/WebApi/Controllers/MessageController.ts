import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiTags, ApiOperation, ApiOkResponse, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger';
import { MessageService } from 'src/BL/Services/MessageService';
import { MessageDto } from 'src/DTO/MessageDto';
import { JwtAuthGuard } from '../Helpers/JwtAuthGuard';
import { CurrentUser } from '../Helpers/CurrentUser';
import { UserData } from '../Helpers/UserData';
import { DiffieHellmanMessageDto } from 'src/DTO/DiffieHellmanMessageDto';
import { DiffieHelmanGateWay } from '../GateWays/DiffieHelmanGateWay';

@ApiTags('messages')
@Controller('messages')
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get(':chatId')
  @ApiOperation({ summary: 'Получить сообщения в чате', description: 'Возвращает все сообщения в указанном чате' })
  @ApiParam({ name: 'chatId', type: 'string', format: 'uuid', description: 'UUID чата' })
  @ApiOkResponse({ type: MessageDto, isArray: true, description: 'Список сообщений' })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @ApiResponse({ status: 404, description: 'Чат не найден' })
  async getMessages(
    @CurrentUser() user: UserData,
    @Param('chatId') chatId: string,
  ): Promise<MessageDto[]> {
    // Можно добавить проверку, что user состоит в чате
    return this.messageService.getMessagesInChat(user.userId, chatId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post(':chatId')
  @ApiOperation({ 
    summary: 'Отправить сообщение', 
    description: 'Создает новое сообщение в чате. Поддерживает как обычные, так и зашифрованные сообщения (Diffie-Hellman)' 
  })
  @ApiParam({ name: 'chatId', type: 'string', format: 'uuid', description: 'UUID чата' })
  @ApiBody({ type: MessageDto })
  @ApiOkResponse({ type: MessageDto, description: 'Отправленное сообщение' })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  async sendMessage(
    @CurrentUser() user: UserData,
    @Param('chatId') chatId: string,
    @Body() messageDto: MessageDto,
  ): Promise<MessageDto> {
    // messageDto может содержать toClientId для приватных сообщений (Diffie-Hellman)
    return this.messageService.addMessageToChat(
      user.userId,
      chatId,
      messageDto,
    );
  }

  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth('access-token')
  // @Post('diffie-hellman/:chatId')
  // async AddDiffieHellmanMessage(
  //   @CurrentUser() user: UserData,
  //   @Param('chatId') chatId: string,
  //   // @Param('messageId') messageId: string,
  //   @Body() diffieHellmanMessageDto: DiffieHellmanMessageDto
  // ): Promise<DiffieHellmanMessageDto> {
  //   throw new Error('Method not implemented.');
  // }
}
