import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../Data/Entities/User';
import { BmcSessionsService, BmcSessionState } from '../Singelton/Services/BmcSessionsService';
import BN = require('bn.js');
import { randomInt } from 'crypto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class BmcService {
  constructor(
    private readonly sessions: BmcSessionsService,
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Протокол Брикелла–Маккарли (BMC, учебный вариант)
   * Параметры: модуль N, генератор g, публичный ключ y = g^x mod N (секрет x у клиента).
   * Раунд:
   *  1) Клиент отправляет обязательство a = g^k mod N.
   *  2) Сервер возвращает вызов r ∈ {0,1}.
   *  3) Клиент отвечает e = k + r·x (в учебной реализации без редукции по φ(N)).
   *  4) Сервер проверяет: g^e ≟ a · y^r (mod N).
   *
   * bn.js кратко:
   *  - BN.red(N) → контекст модульной арифметики по N.
   *  - toRed(red) → перевод BN в редуцированную форму.
   *  - redPow(e) → возведение в степень по модулю N.
   *  - redMul(b) → умножение по модулю N.
   *  - fromRed() → выход из редуцированной формы в обычную.
   */
  // Client sends commitment a = g^k mod N (hex); server responds with challenge bit r in {0,1}
  async start(sid: string, aHex: string): Promise<{ r: number }> {
    if (!sid) throw new BadRequestException('sid required');
    if (!aHex) throw new BadRequestException('a (commitment) required');

    const session = this.sessions.getSession(sid);
    if (!session) throw new NotFoundException('session not found');

    const aNorm = this.sanitizeHex(aHex);
    if (!this.isValidHex(aNorm)) throw new BadRequestException('invalid hex for a');

    const r = randomInt(0, 2);
    session.current = { a: aNorm, r };
    session.state = BmcSessionState.InProgress;
    this.sessions.updateSession(sid, session);
    return { r };
  }

  // Client responds with e = k + r*x; server verifies: g^e ?= a * y^r (mod N)
  async finish(sid: string, eHex: string): Promise<{ access_token: string | null }> {
    if (!sid) throw new BadRequestException('sid required');
    if (!eHex) throw new BadRequestException('e (response) required');

    const session = this.sessions.getSession(sid);
    if (!session) throw new NotFoundException('session not found');
    if (!session.current) {
      this.sessions.deleteSession(sid);
      throw new BadRequestException('no active challenge for session');
    }

    const user = await this.userRepository.findOne({ where: { id: session.userId } });
    this.sessions.deleteSession(sid);

    if (!user) throw new NotFoundException('user not found');
    if (!user.bmc_enabled || !user.bmc_n || !user.bmc_g || !user.bmc_y) {
      throw new BadRequestException('user has no BMC parameters');
    }

  const N = this.parseBig(user.bmc_n);
  const g = this.parseBig(user.bmc_g).umod(N);
  const y = this.parseBig(user.bmc_y).umod(N);
    const red = BN.red(N);

  const eBN = this.parseBig(this.sanitizeHex(eHex)); // e — показатель для g^e (mod N)
  const aBN = this.parseBig(session.current.a).umod(N).toRed(red);
    const r = session.current.r;

    // left = g^e mod N
  const left = g.toRed(red).redPow(eBN);
    // right = a if r==0, a*y if r==1
    let right = aBN;
    if (r === 1) {
      right = aBN.redMul(y.toRed(red));
    }
    // Compare
    if (!left.fromRed().umod(N).eq(right.fromRed().umod(N))) {
      throw new UnauthorizedException('bmc verification failed');
    }

    const payload = { email: user.email, sub: user.id };
    const token = this.jwtService.sign(payload);
    return { access_token: token };
  }

  private sanitizeHex(h: string): string {
    if (!h) return '';
    return h.replace(/^0x/, '').toLowerCase();
  }
  private isValidHex(h: string): boolean {
    return /^[0-9a-f]+$/i.test(h);
  }
  private parseBig(s: string): BN {
    // try hex, then decimal
    const t = s.trim();
    if (/^0x[0-9a-f]+$/i.test(t)) return new BN(t.slice(2), 16);
    if (/^[0-9a-f]+$/i.test(t) && /[a-f]/i.test(t)) return new BN(t, 16);
    return new BN(t, 10);
  }
}
