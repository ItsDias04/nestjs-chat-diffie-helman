import { ApiProperty } from "@nestjs/swagger";
import { ChatDto } from "./ChatDto";
import { UserDto } from "./UserDto";

export class InviteDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID приглашения (UUID)',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: 'ID чата (UUID)',
    format: 'uuid',
  })
  chatId: string;

  @ApiProperty({
    description: 'Информация о чате',
    type: () => ChatDto,
    required: false
  })
  chat: ChatDto;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174002',
    description: 'ID отправителя (UUID)',
    format: 'uuid',
  })
  userSenderId: string;

  @ApiProperty({
    description: 'Информация об отправителе приглашения',
    type: () => UserDto,
    required: false
  })
  userSender: UserDto;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174003',
    description: 'ID получателя (UUID)',
    format: 'uuid',
    nullable: true,
  })
  userReceiverId: string | null;

  @ApiProperty({
    description: 'Информация о получателе приглашения',
    type: () => UserDto,
    nullable: true,
    required: false
  })
  userReceiver: UserDto | null;

  @ApiProperty({
    example: 'pending',
    description: 'Статус приглашения',
    enum: ['pending', 'accepted', 'declined'],
  })
  status: string;

  @ApiProperty({
    example: '2023-03-15T12:00:00Z',
    description: 'Дата создания приглашения',
    type: 'string',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2023-03-15T12:00:00Z',
    description: 'Дата обновления приглашения',
    type: 'string',
    format: 'date-time',
  })
  updatedAt: Date;
}

// import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
// import { Chat } from "./Chat";
// import { User } from "./User";


// export enum InviteStatus {
//     Pending = "pending",
//     Accepted = "accepted",
//     Declined = "declined"
// }
// @Entity()
// export class Invite {
//     @PrimaryGeneratedColumn("uuid")
//     id: string;

//     @ManyToOne(() => Chat)
//     chat: Chat;

//     @ManyToOne(() => User)
//     userSender: User;

//     @ManyToOne(() => User)
//     userReceiver: User;

//     @Column({ type: 'varchar', length: 20 })
//     status: InviteStatus;

//     @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
//     createdAt: Date;

//     @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
//     updatedAt: Date;
// }