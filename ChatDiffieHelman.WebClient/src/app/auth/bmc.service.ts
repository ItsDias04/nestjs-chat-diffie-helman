import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, switchMap, tap, throwError } from 'rxjs';
import BN from 'bn.js';

@Injectable({ providedIn: 'root' })
export class BmcServiceClient {
  constructor(private http: HttpClient) {}

  baseApiUrl = 'http://localhost:3000';
  urlAuth = `${this.baseApiUrl}/auth`;

  bmcStart(sid: string, aHex: string) {
    return this.http.post<{ r: number }>(`${this.urlAuth}/bmc/start`, { sid, a: aHex }).pipe(
      catchError((e) => throwError(() => e))
    );
  }

  bmcFinish(sid: string, eHex: string) {
    return this.http.post<{ access_token: string | null }>(`${this.urlAuth}/bmc/finish`, { sid, e: eHex }).pipe(
      tap((res) => {
        if (res.access_token) localStorage.setItem('token', res.access_token);
      }),
      catchError((e) => throwError(() => e))
    );
  }

  enableBmcForUser(userId: string, n: string, g: string, y: string) {
    return this.http.post<any>(`${this.urlAuth}/bmc/enable/${userId}`, { n, g, y });
  }

  disableBmcForUser(userId: string) {
    return this.http.post<any>(`${this.urlAuth}/bmc/disable/${userId}`, {});
  }

  // Полный раунд BMC (учебный):
  // Вход: sid, модуль n, генератор g, публичный y, секрет x (все десятичные строки).
  // Математика:
  //   - Клиент выбирает k, считает a = g^k mod N.
  //   - Сервер выдаёт r ∈ {0,1}.
  //   - Клиент отвечает e = k + r·x.
  //   - Сервер проверяет g^e ≟ a · y^r (mod N).
  // BN.js:
  //   - BN.red(N): контекст модульной арифметики.
  //   - toRed(red), redPow(e), redMul(b): операции mod N.
  //   - fromRed(): возврат к обычной форме.
  runFullBmcProtocol(sid: string, nStr: string, gStr: string, yStr: string, xStr: string) {
    if (!sid) return throwError(() => new Error('Missing bmc session id'));
    const N = new BN(nStr, 10);
    const g = new BN(gStr, 10).umod(N);
    const y = new BN(yStr, 10).umod(N);
    const x = new BN(xStr, 10);
    const red = BN.red(N);

    // Выбираем случайный k и считаем a = g^k mod N
    const k = this.randomLessThan(N.subn(2)).iaddn(2); // in [2, N-1]
    const a = g.toRed(red).redPow(k).fromRed();
    const aHex = a.toString(16);

    return this.bmcStart(sid, aHex).pipe(
      switchMap(({ r }) => {
        // e = k + r*x (без редукции по φ(N) — для демонстрации равенства)
        const e = k.add(x.mul(new BN(r))); // k + r*x
        const eHex = e.toString(16);
        return this.bmcFinish(sid, eHex);
      })
    );
  }

  private randomLessThan(n: BN): BN {
    const bytes = Math.ceil(n.bitLength() / 8);
    let k: BN;
    do {
      const arr = new Uint8Array(bytes);
      crypto.getRandomValues(arr);
      k = new BN(arr);
    } while (k.gte(n));
    return k;
  }
}
