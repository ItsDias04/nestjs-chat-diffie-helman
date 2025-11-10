import { ApiProperty } from "@nestjs/swagger";
import { UserDto } from "./UserDto";
import { ChatDto } from "./ChatDto";

export class MessageDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID сообщения (UUID)',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
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
    example: '123e4567-e89b-12d3-a456-426614174000', 
    description: 'ID пользователя (UUID)', 
    format: 'uuid' 
  })
  userId: string;

  @ApiProperty({ 
    description: 'Информация о пользователе, отправившем сообщение', 
    type: () => UserDto,
    required: false
  })
  user: UserDto;

  @ApiProperty({ 
    example: 'Hello, world!', 
    description: 'Содержимое сообщения', 
    type: 'string' 
  })
  content: string;

  @ApiProperty({ 
    example: '2023-10-05T14:48:00.000Z', 
    description: 'Временная метка сообщения', 
    type: 'string', 
    format: 'date-time' 
  })
  timestamp: Date;

  @ApiProperty({ 
    example: true, 
    description: 'Флаг, указывающий, было ли сообщение просмотрено' 
  })
  reviewed: boolean;

  @ApiProperty({ 
    example: 'text', 
    description: 'Тип сообщения',
    enum: ['text', 'diffie-hellman-key', 'system']
  })
  type: string;

  @ApiProperty({ 
    example: 0, 
    description: 'Порядковый номер ключа шифрования в чате', 
    nullable: true,
    required: false
  })
  encryptionKeyIndex?: number;
}
