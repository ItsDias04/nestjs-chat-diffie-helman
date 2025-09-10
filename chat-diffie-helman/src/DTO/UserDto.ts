import { ApiProperty } from "@nestjs/swagger";

export class UserDto {
      @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID пользователя (UUID)',
    format: 'uuid',
  })  id: string;

  @ApiProperty({ example: 'John Doe', description: 'Имя пользователя' })
  name: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'Email пользователя' })
  email: string;
}