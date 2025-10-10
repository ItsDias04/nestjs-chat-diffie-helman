import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../Data/Entities/User';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { Repository } from 'typeorm';
import { LoginDto } from '../../DTO/LoginDto';
import { IAuthService } from '../Abstractions/IAuthService';
import { FiatSessionsService } from '../Singelton/Services/FiatSessionsService';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private fiatSessionsService: FiatSessionsService,
  ) {}

  async login(loginDto: LoginDto) {
    
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });
    
    if (!user || user.password !== loginDto.password) {
      throw new UnauthorizedException();
    }
    
    const payload = { email: user.email, sub: user.id };

    return {
      access_token: user.fiat_enabled
        ? null
        : this.jwtService.sign(payload),
      fiat_required: user.fiat_enabled,
      fiat_session_id: user.fiat_enabled
        ? this.fiatSessionsService.createSession(user.id)
        : null,
    };
  }

  async enableFiatForUser(userId: string, vHex: string, nHex: string): Promise<string> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    // user.fiat_n = this.getN().toString();
    user.fiat_n = nHex;
    user.fiat_v = vHex;
    user.fiat_enabled = true;
    await this.userRepository.save(user);
    return user.fiat_n;
  }

  async disableFiatForUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    user.fiat_n = null;
    user.fiat_v = null;
    user.fiat_enabled = false;
    await this.userRepository.save(user);
    return user;
  }

  getN() {
    // Example: return a fixed prime number for simplicity
    //  234121 * 234103
    const n = 54808428463
    return n;
  }
}
