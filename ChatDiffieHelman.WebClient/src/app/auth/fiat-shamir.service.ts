import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { catchError, throwError, tap, switchMap } from 'rxjs';
import { FiatShamirKeys } from '../helpers/fiat-shamir-setup-data';
import { TokenResponse } from './auth.interface';
import BN from 'bn.js';

@Injectable({
  providedIn: 'root'
})
export class FiatShamirService {
  token: TokenResponse | null = null;
  role: string | null = null;
  fiatSessionId: string | null = null;

  constructor(
    private cookieService: CookieService,
    private http: HttpClient,
    private router: Router
  ) { }

  baseApiUrl = 'http://localhost:3000';
  urlLogin = `${this.baseApiUrl}/auth`;
  urlRegister = `${this.baseApiUrl}/users`;

  /**
   * Начало Fiat-Shamir челлендж-ответ протокола
   * @param sid - session ID из ответа login
   * @param t - значение t (commitment) от клиента в HEX
   * @returns challenge c от сервера
   */
  fiatStart(sid: string, t: string) {
    return this.http.post<{ c: number }>(
      `${this.urlLogin}/fiat/start`,
      { sid, t }
    ).pipe(
      catchError((error) => {
        console.error('Fiat start failed', error);
        return throwError(() => new Error('Fiat start failed'));
      })
    );
  }

  /**
   * Завершение Fiat-Shamir протокола
   * @param sid - session ID
   * @param r - ответ от клиента на challenge в HEX
   * @returns access_token при успешной верификации
   */
  fiatFinish(sid: string, r: string) {
    return this.http.post<{ access_token: string | null }>(
      `${this.urlLogin}/fiat/finish`,
      { sid, r }
    ).pipe(
      tap((res) => {
        if (res.access_token) {
          this.token = { access_token: res.access_token };
          localStorage.setItem('token', res.access_token);
          this.fiatSessionId = null;
        }
      }),
      catchError((error) => {
        console.error('Fiat finish failed', error);
        return throwError(() => new Error('Fiat finish failed'));
      })
    );
  }

  /**
   * Включить Fiat-Shamir 2FA для пользователя
   * @param userId - ID пользователя
   * @param v - публичный ключ v = s^-2 mod n
   * @param n - модуль n
   * @returns обновленные данные пользователя
   */
  enableFiatForUser(userId: string, v: string, n: string) {
    return this.http.post<any>(
      `${this.urlLogin}/fiat/enable/${userId}`,
      { v, n }
    ).subscribe({
      next: (res) => {
        console.log('Fiat 2FA enabled for user', res);
      },
      error: (error) => {
        console.error('Enable Fiat 2FA failed', error);
        return throwError(() => new Error('Enable Fiat 2FA failed'));
      }
    });
  }

  /**
   * Отключить Fiat-Shamir 2FA для пользователя
   * @param userId - ID пользователя
   * @returns обновленные данные пользователя
   */
  disableFiatForUser(userId: string) {
    return this.http.post<any>(
      `${this.urlLogin}/fiat/disable/${userId}`,
      {}
    ).pipe(
      tap((res) => {
        console.log('Fiat 2FA disabled for user', res);
      }),
      catchError((error) => {
        console.error('Disable Fiat 2FA failed', error);
        return throwError(() => new Error('Disable Fiat 2FA failed'));
      })
    );
  }

  /**
   * Получить session ID для текущей Fiat-Shamir сессии
   */
  getFiatSessionId(): string | null {
    return this.fiatSessionId;
  }

  /**
   * Проверить, требуется ли Fiat-Shamir 2FA
   */
  isFiatRequired(): boolean {
    return !!this.fiatSessionId;
  }

  /** 
   * Запуск полного протокола Fiat-Shamir (start + finish)
   * Использует bn.js для корректной работы с большими числами
   *
   * @param sid - session ID
   * @param keys - локальные параметры Fiat-Shamir (содержат s и n как строки)
   */
  runFullFiatProtocol(sid: string, keys: FiatShamirKeys) {
    if (!sid) {
      return throwError(() => new Error('Missing fiat session id'));
    }
    if (!keys || !keys.s || !keys.n) {
      return throwError(() => new Error('Missing Fiat-Shamir keys'));
    }

    // Конвертируем s и n в BN
    const sBN = new BN(keys.s.toString(), 10);
    const nBN = new BN(keys.n.toString(), 10);
    const red = BN.red(nBN);

    // Генерируем случайное a: 1 < a < n, gcd(a,n) = 1
    const aBN = this.generateRandomA(nBN);
    
    // Вычисляем t = a^2 mod n
    const tBN = aBN.toRed(red).redSqr().fromRed();
    const tHex = tBN.toString(16);

    console.log('Generated commitment t:', tHex);

    // Отправляем t -> получаем challenge c
    return this.fiatStart(sid, tHex).pipe(
      switchMap((res) => {
        const c = res.c;
        console.log('Challenge from server:', c);

        // Вычисляем r = a * s^c mod n
        let rRedBN = aBN.toRed(red);
        
        if (c === 1) {
          const sPowBN = sBN.toRed(red);
          rRedBN = rRedBN.redMul(sPowBN);
        }
        // если c === 0, то r = a
        
        const rBN = rRedBN.fromRed();
        const rHex = rBN.toString(16);

        console.log('Computed response r:', rHex);
        return this.fiatFinish(sid, rHex);
      }),
      catchError((error) => {
        console.error('runFullFiatProtocol failed', error);
        return throwError(() => new Error('runFullFiatProtocol failed'));
      })
    );
  }

  /**
   * Генерирует случайное число a: 1 < a < n, gcd(a,n) = 1
   */
  private generateRandomA(nBN: BN): BN {
    const bitLength = nBN.bitLength();
    let a: BN;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      // Генерируем случайное число той же длины что и n
      const randomBytes = this.getRandomBytes(Math.ceil(bitLength / 8));
      a = new BN(randomBytes);
      
      // Приводим в диапазон (1, n)
      a = a.umod(nBN.subn(2)).addn(2);
      
      attempts++;
      if (attempts > maxAttempts) {
        throw new Error('Failed to generate valid random a');
      }
    } while (a.gcd(nBN).cmpn(1) !== 0);

    return a;
  }

  /**
   * Генерирует случайные байты используя crypto API браузера
   */
  private getRandomBytes(length: number): Uint8Array {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return bytes;
  }
}