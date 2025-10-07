// ...existing code...
import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { FiatSessionsService, FiatSession, FiatSessionState } from "../Singelton/Services/FiatSessionsService";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../../Data/Entities/User";
import { Repository } from "typeorm";
import BN = require('bn.js');
import { randomInt } from "crypto";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class FiatService {
  constructor(
    private fiatSessionsService: FiatSessionsService,
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  // Start step: client sends commitment t (hex), server responds with challenge bit c (0 or 1)
  async start(sid: string, tHex: string): Promise<{ c: number }> {
    if (!sid) throw new BadRequestException('sid required');
    if (!tHex) throw new BadRequestException('t (commitment) required');

    const session = this.fiatSessionsService.getSession(sid);
    if (!session) throw new NotFoundException('session not found');

    // normalize hex
    const tNorm = this.sanitizeHex(tHex);
    if (!this.isValidHex(tNorm)) throw new BadRequestException('invalid hex for t');

    // set session current and state
    const c = randomInt(0, 2); // 0 or 1
    session.current = { x: tNorm, e: c.toString() };
    session.state = FiatSessionState.InProgress;
    this.fiatSessionsService.updateSession(sid, session);

    return { c };
  }

  // Finish step: client sends response r (hex). Server verifies and returns JWT on success.
  async finish(sid: string, rHex: string): Promise<{ access_token: string | null }> {
    if (!sid) throw new BadRequestException('sid required');
    if (!rHex) throw new BadRequestException('r required');

    const session = this.fiatSessionsService.getSession(sid);
    if (!session) throw new NotFoundException('session not found');
    if (!session.current) {
      this.fiatSessionsService.deleteSession(sid);
      throw new BadRequestException('no active challenge for session');
    }

    const user = await this.userRepository.findOne({ where: { id: session.userId }});
    // remove session to avoid replay regardless of outcome
    this.fiatSessionsService.deleteSession(sid);

    if (!user) throw new NotFoundException('user not found');
    if (user.fiat_n == null || user.fiat_v == null) throw new BadRequestException('user has no fiat parameters');

    const nBN = new BN(user.fiat_n.toString(), 10);
    const vBN = new BN(user.fiat_v.toString(), 10);
    const red = BN.red(nBN);

    const rNorm = this.sanitizeHex(rHex);
    if (!this.isValidHex(rNorm)) throw new BadRequestException('invalid hex for r');

    const rBN = new BN(rNorm, 16).umod(nBN).toRed(red);

    // compute left = r^2 * v^e mod n
    let left = rBN.redSqr();
    const e = Number(session.current.e);
    if (e === 1) {
      left = left.redMul(new BN(vBN.toString(), 10).toRed(red));
    }
    left = left.fromRed().umod(nBN);

    const tBN = new BN(session.current.x, 16).umod(nBN);

    if (!left.eq(tBN)) {
      throw new UnauthorizedException('fiat verification failed');
    }

    // successful => issue JWT
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
}