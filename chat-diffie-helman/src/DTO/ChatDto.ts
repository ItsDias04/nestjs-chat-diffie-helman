import { ApiProperty } from "@nestjs/swagger/dist/decorators/api-property.decorator";

export class ChatDto {
    @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID чата (UUID)',
    format: 'uuid',
  })
    id: string;

    @ApiProperty({ example: 'Chat Room 1', description: 'Название чата' })
    name: string;
}
