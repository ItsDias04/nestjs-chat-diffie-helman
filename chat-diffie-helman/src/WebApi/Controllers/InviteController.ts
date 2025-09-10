import { Controller, Post, Body, Param, UseGuards, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiProperty, ApiTags } from '@nestjs/swagger';
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
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID пользователя (UUID)', format: 'uuid' })
    userReceiverId: string;
}

@ApiTags('invites')
@Controller('invites')
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('/create/')
  @ApiBody({ type: InviteCreateDto })
  async sendInvite(
    @CurrentUser() user: UserData,
    @Body('userReceiverId') inviteCreate: InviteCreateDto
  ): Promise<InviteDto> {
    // Здесь только отправитель, получатель можно добавить по необходимости
    return this.inviteService.createInvite(inviteCreate.chatId, user.userId, inviteCreate.userReceiverId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get()

  async getMyInvites(@CurrentUser() user: UserData): Promise<InviteDto[]> {
    return this.inviteService.getInvitesForUser(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('/respond/')
  @ApiBody({ type: InviteRespondDto })
  async respondToInvite(
    @CurrentUser() user: UserData,
    
    @Body('accept') { inviteId, accept }: InviteRespondDto
  ): Promise<InviteDto> {
    // Если accept === true — принять, иначе отклонить
    return this.inviteService.respondToInvite(inviteId, accept);
  }
}