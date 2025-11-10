import { Controller, Post, Body, Param, UseGuards, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiProperty, ApiTags, ApiOperation, ApiOkResponse, ApiResponse } from '@nestjs/swagger';
import { InviteService } from 'src/BL/Services/InviteService';
import { JwtAuthGuard } from '../Helpers/JwtAuthGuard';
import { CurrentUser } from '../Helpers/CurrentUser';
import { UserData } from '../Helpers/UserData';
import { InviteDto } from 'src/DTO/InviteDto';

export class InviteRespondDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID приглашения (UUID)', format: 'uuid' })
  inviteId: string;
  
  @ApiProperty({ example: true, description: 'Признак принятия приглашения' })
  accept: boolean;
}

export class InviteCreateDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID чата (UUID)', format: 'uuid' })
  chatId: string;
  
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID пользователя-получателя (UUID)', format: 'uuid' })
  userReceiverId: string;
}

@ApiTags('invites')
@Controller('invites')
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('/create/')
  @ApiOperation({ summary: 'Создать приглашение в чат', description: 'Отправляет приглашение пользователю присоединиться к чату' })
  @ApiBody({ type: InviteCreateDto })
  @ApiOkResponse({ type: InviteDto, description: 'Созданное приглашение' })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 404, description: 'Чат или пользователь не найден' })
  async sendInvite(
    @CurrentUser() user: UserData,
    @Body() inviteCreate: InviteCreateDto
  ): Promise<InviteDto> {
    // Здесь только отправитель, получатель можно добавить по необходимости
    return this.inviteService.createInvite(inviteCreate.chatId, user.userId, inviteCreate.userReceiverId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get()
  @ApiOperation({ summary: 'Получить мои приглашения', description: 'Возвращает список всех приглашений для текущего пользователя' })
  @ApiOkResponse({ type: InviteDto, isArray: true, description: 'Список приглашений' })
  async getMyInvites(@CurrentUser() user: UserData): Promise<InviteDto[]> {
    return this.inviteService.getInvitesForUser(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('/respond/')
  @ApiOperation({ summary: 'Ответить на приглашение', description: 'Принять или отклонить приглашение в чат' })
  @ApiBody({ type: InviteRespondDto })
  @ApiOkResponse({ type: InviteDto, description: 'Обновленное приглашение' })
  @ApiResponse({ status: 404, description: 'Приглашение не найдено' })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  async respondToInvite(
    @CurrentUser() user: UserData,
    
    @Body() acception: InviteRespondDto
  ): Promise<InviteDto> {
    return this.inviteService.respondToInvite(acception.inviteId, acception.accept);
  }
}