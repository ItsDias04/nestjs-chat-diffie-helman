import { ApiProperty } from "@nestjs/swagger/dist/decorators/api-property.decorator";

export class LoginDto { 
    @ApiProperty({ example: 'john.doe@example.com', description: 'Email пользователя' })
    email: string;

    @ApiProperty({ example: 'strongPassword123', description: 'Пароль пользователя' })
    password: string;
}