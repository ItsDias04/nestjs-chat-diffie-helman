import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../Data/Entities/User';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { Repository } from 'typeorm';
import { LoginDto } from '../../DTO/LoginDto';
import { IAuthService } from '../Abstractions/IAuthService';
import { FiatSessionsService } from '../Singelton/Services/FiatSessionsService';
import { BmcSessionsService } from '../Singelton/Services/BmcSessionsService';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private fiatSessionsService: FiatSessionsService,
    private bmcSessionsService: BmcSessionsService,
  ) {}

  async login(loginDto: LoginDto) {
    
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });
    
    if (!user || user.password !== loginDto.password) {
      throw new UnauthorizedException();
    }
    
    const payload = { email: user.email, sub: user.id };

    const needFiat = !!user.fiat_enabled;
    const needBmc = !!user.bmc_enabled;
    const noImmediateJwt = needFiat || needBmc;

    return {
      access_token: noImmediateJwt ? null : this.jwtService.sign(payload),
      fiat_required: needFiat,
      fiat_session_id: needFiat ? this.fiatSessionsService.createSession(user.id) : null,
      // BMC
      bmc_required: needBmc,
      bmc_session_id: needBmc ? this.bmcSessionsService.createSession(user.id) : null,
    } as any;
  }

  async enableFiatForUser(userId: string, vHex: string, nHex: string): Promise<string> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    // user.fiat_n = this.getN().toString();
    user.fiat_n = nHex;
    user.fiat_v = vHex;
    user.fiat_enabled = true;
    // Disable BMC if turning on Fiat
    user.bmc_enabled = false;
    user.bmc_n = null;
    user.bmc_g = null;
    user.bmc_y = null;
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

  async enableBmcForUser(userId: string, n: string, g: string, y: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    user.bmc_n = n;
    user.bmc_g = g;
    user.bmc_y = y;
    user.bmc_enabled = true;
    // Disable Fiat if turning on BMC
    user.fiat_enabled = false;
    user.fiat_n = null;
    user.fiat_v = null;
    await this.userRepository.save(user);
    return user;
  }

  async disableBmcForUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    user.bmc_n = null;
    user.bmc_g = null;
    user.bmc_y = null;
    user.bmc_enabled = false;
    await this.userRepository.save(user);
    return user;
  }

  // getN() {
  //   // Example: return a fixed prime number for simplicity
  //   //  234121 * 234103
  //   const n = 54808428463
  //   return n;
  // }
}
