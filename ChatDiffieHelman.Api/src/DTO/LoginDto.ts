import { ApiProperty } from "@nestjs/swagger/dist/decorators/api-property.decorator";
import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class LoginDto { 
    @ApiProperty({ example: 'john.doe@example.com', description: 'Email пользователя' })
    @IsEmail({}, { message: 'Некорректный формат email' })
    @MaxLength(255, { message: 'Email не может быть длиннее 255 символов' })
    email: string;

    @ApiProperty({ example: 'strongPassword123', description: 'Пароль пользователя' })
    @IsString({ message: 'Пароль должен быть строкой' })
    @MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
    @MaxLength(100, { message: 'Пароль не может быть длиннее 100 символов' })
    password: string;
}