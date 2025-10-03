import { ApiProperty } from "@nestjs/swagger";

export class DiffieHellmanMessageDto {
  
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID чата (UUID)', format: 'uuid' })
    chatId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID отправителя (UUID)', format: 'uuid' })
  fromClientId: string;
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID получателя (UUID)', format: 'uuid' })
  toClientId: string;

  @ApiProperty({ example: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQ...\n-----END PUBLIC KEY-----', description: 'Публичный ключ отправителя', format: 'string' })
  publicKey: string;

  @ApiProperty({ example: 1, description: 'Этап обмена ключами (1 или 2)', format: 'int' })
  stage: number; // 1 - отправка публичного ключа, 2 - получение общего секрета
}
