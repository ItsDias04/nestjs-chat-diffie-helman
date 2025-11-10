import { ApiProperty } from "@nestjs/swagger/dist/decorators/api-property.decorator";
import { IsEmail, IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe', description: 'Имя пользователя' })
  @IsString({ message: 'Имя должно быть строкой' })
  @MinLength(2, { message: 'Имя должно содержать минимум 2 символа' })
  @MaxLength(100, { message: 'Имя не может быть длиннее 100 символов' })
  @Matches(/^[a-zA-Zа-яА-ЯёЁ\s\-]+$/, { 
    message: 'Имя может содержать только буквы, пробелы и дефисы' 
  })
  username: string;
  
  @ApiProperty({ example: 'john.doe@example.com', description: 'Email пользователя' })
  @IsEmail({}, { message: 'Некорректный формат email' })
  @MaxLength(255, { message: 'Email не может быть длиннее 255 символов' })
  email: string;
  
  @ApiProperty({ example: 'strongPassword123', description: 'Пароль пользователя' })
  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
  @MaxLength(100, { message: 'Пароль не может быть длиннее 100 символов' })
  password: string;
  
  @IsOptional()
  id: string | undefined; // This will be set during registration GUID generation

  // constructor(name: string, email: string, password: string) {
  //   this.name = name;
  //   this.email = email;
  //   this.password = password;
  //   this.id = undefined; // ID will be assigned later
  // }
}