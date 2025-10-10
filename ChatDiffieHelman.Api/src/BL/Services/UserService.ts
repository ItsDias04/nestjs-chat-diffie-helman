import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/Data/Entities/User";
import { RegisterDto } from "src/DTO/RegisterDto";
import { UserDto } from "src/DTO/UserDto";
import { Repository } from "typeorm";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async register(registerDto: RegisterDto): Promise<UserDto> {
    // id будет сгенерирован автоматически благодаря @PrimaryGeneratedColumn('uuid')
    const newUser = new User();
    // newUser.id will be generated automatically by TypeORM
    newUser.name = registerDto.username;
    newUser.email = registerDto.email;
    newUser.password = registerDto.password; // В реальном приложении пароль должен быть захеширован
    // Можно добавить валидацию и другие проверки здесь

    const savedUser = await this.userRepository.save(newUser);
    // Преобразование в UserDto (если нужно)
    return this.toUserDto(savedUser);
  }

  async findById(id: string): Promise<UserDto | null> {
    const user = await this.userRepository.findOne({ where: { id } });
    return user ? this.toUserDto(user) : null;
  }

  async getAllUsers(): Promise<UserDto[]> {
    const users = await this.userRepository.find();
    return users.map(u => this.toUserDto(u));
  }

  // Маппинг User -> UserDto
  toUserDto(user: User): UserDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      fiat_enabled: user.fiat_enabled,
      // Добавьте другие поля, если нужно
    };
  }
}