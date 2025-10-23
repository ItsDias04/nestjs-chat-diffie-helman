import { FiatShamirKeys } from './fiat-shamir-setup-data';

/**
 * Проверка числа на простоту (наивный алгоритм для учебных целей)
 */
function isPrime(n: number): boolean {
  if (n <= 1) return false;
  if (n <= 3) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;

  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}

/**
 * Генерация случайного простого числа в диапазоне
 */
function generatePrime(min: number, max: number): number {
  const range = max - min;
  let candidate = min + Math.floor(Math.random() * range);

  // Делаем нечётным
  if (candidate % 2 === 0) candidate++;

  // Ищем ближайшее простое
  while (!isPrime(candidate) && candidate < max) {
    candidate += 2;
  }

  if (candidate >= max) {
    // Если не нашли, ищем в обратную сторону
    candidate = min + Math.floor(Math.random() * range);
    if (candidate % 2 === 0) candidate++;
    while (!isPrime(candidate) && candidate > min) {
      candidate -= 2;
    }
  }

  return candidate;
}

/**
 * Модульное возведение в степень: (base^exp) mod mod
 */
function modPow(base: number, exp: number, mod: number): number {
  if (mod === 1) return 0;
  let result = 1;
  base = base % mod;
  while (exp > 0) {
    if (exp % 2 === 1) {
      result = (result * base) % mod;
    }
    exp = Math.floor(exp / 2);
    base = (base * base) % mod;
  }
  return result;
}

/**
 * Расширенный алгоритм Евклида
 */
function egcd(a: number, b: number): { gcd: number; x: number; y: number } {
  if (a === 0) {
    return { gcd: b, x: 0, y: 1 };
  }
  const { gcd, x: x1, y: y1 } = egcd(b % a, a);
  const x = y1 - Math.floor(b / a) * x1;
  const y = x1;
  return { gcd, x, y };
}

/**
 * Модульное обратное: a^-1 mod m
 */
function modInverse(a: number, m: number): number {
  const { gcd, x } = egcd(a, m);
  if (gcd !== 1) {
    throw new Error('Модульное обратное не существует');
  }
  return ((x % m) + m) % m;
}

/**
 * НОД (наибольший общий делитель)
 */
function gcd(a: number, b: number): number {
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

/**
 * Генерация ключей Fiat-Shamir
 */
export function generateFiatShamirKeys(userId: string): FiatShamirKeys {
  // Генерируем два простых числа (для учебных целей используем небольшие)
  const p = generatePrime(100, 500);
  const q = generatePrime(100, 500);
  const n = p * q;

  // Генерируем секретный ключ s (взаимно простой с n)
  let s: number;
  do {
    s = Math.floor(Math.random() * (n - 2)) + 2;
  } while (gcd(s, n) !== 1);

  // Вычисляем публичный ключ v = s^-2 mod n
  const sInv = modInverse(s, n);
  const v = modPow(sInv, 2, n);

  return {
    p,
    q,
    n,
    s,
    v,
    timestamp: new Date().toISOString(),
    userId,
  };
}

/**
 * Экспорт ключей в JSON файл
 */
export function exportKeysToFile(keys: FiatShamirKeys): void {
  const data = {
    ...keys,
    warning:
      'ВАЖНО: Храните этот файл в безопасном месте! Не передавайте его третьим лицам!',
    instructions: [
      '1. Сохраните этот файл в надёжном месте',
      '2. Создайте резервную копию',
      '3. Никогда не передавайте секретный ключ (s) другим людям',
      '4. Публичный ключ (v) был отправлен на сервер',
      '5. При входе используйте секретный ключ (s) для прохождения 2FA',
    ],
  };

  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `fiat-shamir-keys-${keys.userId}-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Форматирование ключей для отображения
 */
export function formatKeysForDisplay(keys: FiatShamirKeys): string {
  return `
Параметры Fiat-Shamir 2FA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Публичные параметры:
  p = ${keys.p}
  q = ${keys.q}
  n = ${keys.n}

Секретный ключ (ХРАНИТЕ В ТАЙНЕ!):
  s = ${keys.s}

Публичный ключ (отправлен на сервер):
  v = ${keys.v}

Дата создания: ${new Date(keys.timestamp).toLocaleString('ru-RU')}
ID пользователя: ${keys.userId}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ ВАЖНЫЕ ИНСТРУКЦИИ:
1. Сохраните этот файл в безопасном месте
2. Создайте резервную копию на другом носителе
3. НИКОГДА не передавайте секретный ключ (s) третьим лицам
4. При входе вам потребуется секретный ключ (s)
5. Если вы потеряете ключ, потребуется отключить и заново включить 2FA
  `.trim();
}
