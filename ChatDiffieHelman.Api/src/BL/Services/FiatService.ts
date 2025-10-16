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

  /**
   * Протокол Fiat–Shamir (идентификация, учебная версия)
   * Параметры пользователя:
   *   - секрет s (хранится у клиента, НЕ на сервере)
   *   - модуль n = p*q (хранится на сервере)
   *   - публичное v = s^{-2} mod n (хранится на сервере)
   * Раунд протокола:
   *  1) Клиент выбирает случайное a ∈ Z*_n и считает обязательство (commitment)
   *       x = a^2 mod n
   *     Отправляет x (здесь поле tHex) на сервер.
   *  2) Сервер генерирует случайный бит вызова c ∈ {0,1} и отправляет клиенту.
   *  3) Клиент вычисляет ответ
   *       y = a · s^c mod n
   *     и отправляет y (здесь поле rHex) на сервер.
   *  4) Сервер проверяет тождество
   *       y^2 ≟ x · v^c (mod n)
   *     где v = s^{-2} (поэтому при c=1 умножаем на v, при c=0 — нет).
   *
   * Используемая библиотека bn.js:
   *   - BN — класс больших целых.
   *   - red = BN.red(n) — создаёт «контекст» редуцированной арифметики по модулю n для быстрых операций.
   *   - toRed(red) — переводит число BN в редуцированную форму.
   *   - redSqr(), redMul() — возведение в квадрат и умножение в редуцированной форме (mod n).
   *   - fromRed() — возвращает обычное представление (из редуцированного).
   *   - umod(n) — остаток по модулю n.
   */

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
    
    this.fiatSessionsService.deleteSession(sid);

    if (!user) throw new NotFoundException('user not found');
    if (user.fiat_n == null || user.fiat_v == null) throw new BadRequestException('user has no fiat parameters');

  // n и v могут храниться как десятичные строки — парсим в BN
  const nBN = new BN(user.fiat_n.toString(), 10);
  const vBN = new BN(user.fiat_v.toString(), 10);
    const red = BN.red(nBN);

    const rNorm = this.sanitizeHex(rHex);
    if (!this.isValidHex(rNorm)) throw new BadRequestException('invalid hex for r');

    // r — это ответ клиента y, интерпретируем как hex → mod n → редуцированная форма
    const rBN = new BN(rNorm, 16).umod(nBN).toRed(red);

    // Левая часть проверки: y^2 mod n
    let left = rBN.redSqr();
    const e = Number(session.current.e);
    if (e === 1) {
      // При c=1 домножаем на v (v = s^{-2}). Тогда получаем y^2 · v ≟ x (mod n)
      left = left.redMul(new BN(vBN.toString(), 10).toRed(red));
    }
    // Преобразуем к обычной форме для сравнения
    left = left.fromRed().umod(nBN);

    // Правая часть: x (commitment), который клиент присылал на шаге start
    const tBN = new BN(session.current.x, 16).umod(nBN);

    if (!left.eq(tBN)) {
      throw new UnauthorizedException('fiat verification failed');
    }

    // Успех → выдаём JWT
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