import { ApiProperty } from "@nestjs/swagger/dist/decorators/api-property.decorator";

export class RegisterDto {
  @ApiProperty({ example: 'John Doe', description: 'Имя пользователя' })
  username: string;
  @ApiProperty({ example: 'john.doe@example.com', description: 'Email пользователя' })
  email: string;
  @ApiProperty({ example: 'strongPassword123', description: 'Пароль пользователя' })
  password: string;
  id: string | undefined; // This will be set during registration GUID generation

  // constructor(name: string, email: string, password: string) {
  //   this.name = name;
  //   this.email = email;
  //   this.password = password;
  //   this.id = undefined; // ID will be assigned later
  // }
}