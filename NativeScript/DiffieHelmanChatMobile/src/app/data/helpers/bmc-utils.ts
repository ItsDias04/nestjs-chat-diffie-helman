import { BmcKeys } from './bmc-setup-data';

function isPrime(n: number): boolean {
  if (n <= 1) return false;
  if (n <= 3) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}

function generatePrime(min: number, max: number): number {
  const range = max - min;
  let candidate = min + Math.floor(Math.random() * range);
  if (candidate % 2 === 0) candidate++;
  while (!isPrime(candidate) && candidate < max) candidate += 2;
  if (candidate >= max) {
    candidate = min + Math.floor(Math.random() * range);
    if (candidate % 2 === 0) candidate++;
    while (!isPrime(candidate) && candidate > min) candidate -= 2;
  }
  return candidate;
}

function modPow(base: number, exp: number, mod: number): number {
  if (mod === 1) return 0;
  let result = 1;
  base = base % mod;
  while (exp > 0) {
    if (exp % 2 === 1) result = (result * base) % mod;
    exp = Math.floor(exp / 2);
    base = (base * base) % mod;
  }
  return result;
}

export function generateBmcKeys(userId: string): BmcKeys {
  // Educational: small primes; in real use, very large safe primes and strong RSA-like modulus
  const p = generatePrime(200, 600);
  const q = generatePrime(200, 600);
  const n = p * q;

  // choose small generator g coprime with n
  let g = 5;
  while (g % p === 0 || g % q === 0) g++;

  // choose secret x
  const x = Math.floor(Math.random() * (n - 2)) + 2;
  const y = modPow(g, x, n);

  return {
    n: String(n),
    g: String(g),
    y: String(y),
    x: String(x),
    userId,
    timestamp: new Date().toISOString(),
  };
}

export function exportBmcKeysToFile(keys: BmcKeys): void {
  const data = {
    ...keys,
    warning: 'Храните секрет x в тайне. Файл содержит приватные данные!',
  };
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bmc-keys-${keys.userId}-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatBmcKeys(keys: BmcKeys): string {
  return `BMC параметры\nN=${keys.n}\ng=${keys.g}\ny=${keys.y}\nсекрет x=${keys.x}\n`;
}
