import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as elliptic from 'elliptic';
import * as crypto from 'crypto-js';

interface KeyPair {
  privateKey: string;
  publicKey: string;
  publicKeyCompressed: string;
}

interface SignatureResult {
  r: string;
  s: string;
  recoveryParam: number | null;
}

@Component({
  selector: 'app-ecdsa-lab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ecdsa-lab.component.html',
  styleUrl: './ecdsa-lab.component.css',
})
export class EcdsaLabComponent {
  // Инициализация кривой secp256k1 (используется в Bitcoin/Ethereum)
  private ec = new elliptic.ec('secp256k1');

  // Состояние компонента
  currentTab:
    | 'theory'
    | 'task1'
    | 'task2'
    | 'task3'
    | 'task4'
    | 'task5'
    | 'questions' = 'theory';

  // Задание 1: Генерация ключей
  generatedKeys: KeyPair | null = null;

  // Задание 2: Подпись сообщения
  messageToSign: string = 'Bitcoin transaction: Send 0.5 BTC to Alice';
  messageHash: string = '';
  signature: SignatureResult | null = null;
  signatureHex: string = '';

  // Задание 3: Проверка подписи
  verificationMessage: string = '';
  verificationSignature: string = '';
  verificationPublicKey: string = '';
  verificationResult: boolean | null = null;
  verificationError: string = '';

  // Задание 4: Эксперимент с изменённым сообщением
  originalMessage: string = 'Transfer 100 ETH to Bob';
  tamperedMessage: string = 'Transfer 999 ETH to Bob';
  originalSignature: SignatureResult | null = null;
  originalHash: string = '';
  tamperedHash: string = '';
  tamperedVerificationResult: boolean | null = null;
  experimentKeys: KeyPair | null = null;

  // Задание 5: Сравнение подписей
  comparisonResults: Array<{
    message: string;
    hash: string;
    signature: string;
    valid: boolean;
  }> = [];

  // Контрольные вопросы - ответы студента
  answers = {
    q1: 'ECDSA (Elliptic Curve Digital Signature Algorithm) — это алгоритм цифровой подписи, основанный на эллиптических кривых.',
    q2: 'Bitcoin использует ECDSA на кривой secp256k1, а Ethereum — на той же кривой, но с хэшированием Keccak-256.',
    q3: 'Основные этапы работы ECDSA: генерация ключей, хэширование сообщения, создание подписи и проверка подписи.',
    q4: 'Важно хранить приватный ключ в секрете, так как его утечка может привести к компрометации аккаунта.',
    q5: 'Преимущества ECDSA: короткие ключи, быстрые операции, меньший размер транзакций и высокая стойкость.',
  };

  constructor() {}

  // ============= ЗАДАНИЕ 1: Генерация пары ключей =============
  generateKeyPair(): void {
    try {
      const keyPair = this.ec.genKeyPair();

      this.generatedKeys = {
        privateKey: keyPair.getPrivate('hex'),
        publicKey: keyPair.getPublic('hex'),
        publicKeyCompressed: keyPair.getPublic(true, 'hex'),
      };

      console.log('Generated Key Pair:', this.generatedKeys);
    } catch (error) {
      console.error('Error generating keys:', error);
      alert('Ошибка при генерации ключей');
    }
  }

  // ============= ЗАДАНИЕ 2: Подписание сообщения =============
  signMessage(): void {
    if (!this.generatedKeys) {
      alert('Сначала сгенерируйте пару ключей (Задание 1)');
      return;
    }

    try {
      // Хэшируем сообщение с использованием SHA-256
      this.messageHash = crypto.SHA256(this.messageToSign).toString();

      // Создаём keypair из приватного ключа
      const keyPair = this.ec.keyFromPrivate(
        this.generatedKeys.privateKey,
        'hex'
      );

      // Подписываем хэш
      const signature = keyPair.sign(this.messageHash);

      this.signature = {
        r: signature.r.toString('hex'),
        s: signature.s.toString('hex'),
        recoveryParam: signature.recoveryParam,
      };

      // Компактное представление подписи (DER format)
      this.signatureHex = signature.toDER('hex');

      console.log('Message Hash:', this.messageHash);
      console.log('Signature:', this.signature);
    } catch (error) {
      console.error('Error signing message:', error);
      alert('Ошибка при подписании сообщения');
    }
  }

  // ============= ЗАДАНИЕ 3: Проверка подписи =============
  verifySignature(): void {
    this.verificationError = '';
    this.verificationResult = null;

    try {
      if (
        !this.verificationMessage ||
        !this.verificationSignature ||
        !this.verificationPublicKey
      ) {
        this.verificationError = 'Заполните все поля';
        return;
      }

      // Хэшируем сообщение
      const msgHash = crypto.SHA256(this.verificationMessage).toString();

      // Получаем публичный ключ
      const publicKey = this.ec.keyFromPublic(
        this.verificationPublicKey,
        'hex'
      );

      // Парсим подпись (в формате DER hex)
      let parsedSignature;
      try {
        parsedSignature = {
          r: this.verificationSignature.substring(0, 64),
          s: this.verificationSignature.substring(64, 128),
        };

        // Пробуем DER формат если не сработало
        if (!parsedSignature.r || !parsedSignature.s) {
          throw new Error('Invalid format');
        }
      } catch {
        // Если формат не простой hex, пробуем как DER
        parsedSignature = this.ec.keyFromPublic(
          this.verificationPublicKey,
          'hex'
        );
      }

      // Проверяем подпись
      this.verificationResult = publicKey.verify(
        msgHash,
        this.verificationSignature
      );

      console.log('Verification result:', this.verificationResult);
    } catch (error: any) {
      console.error('Verification error:', error);
      this.verificationError = `Ошибка при проверке: ${error.message}`;
      this.verificationResult = false;
    }
  }

  // Копировать данные из задания 2 для проверки
  useDataFromTask2(): void {
    if (!this.generatedKeys || !this.signature) {
      alert('Сначала выполните Задание 1 и 2');
      return;
    }

    this.verificationMessage = this.messageToSign;
    this.verificationSignature = this.signatureHex;
    this.verificationPublicKey = this.generatedKeys.publicKey;
  }

  // ============= ЗАДАНИЕ 4: Эксперимент с изменением сообщения =============
  runTamperingExperiment(): void {
    try {
    
      const keyPair = this.ec.genKeyPair();

      this.experimentKeys = {
        privateKey: keyPair.getPrivate('hex'),
        publicKey: keyPair.getPublic('hex'),
        publicKeyCompressed: keyPair.getPublic(true, 'hex'),
      };

  
      this.originalHash = crypto.SHA256(this.originalMessage).toString();
      const signature = keyPair.sign(this.originalHash);

      this.originalSignature = {
        r: signature.r.toString('hex'),
        s: signature.s.toString('hex'),
        recoveryParam: signature.recoveryParam,
      };

      this.tamperedHash = crypto.SHA256(this.tamperedMessage).toString();

      const publicKey = this.ec.keyFromPublic(
        this.experimentKeys.publicKey,
        'hex'
      );
      const signatureObj = {
        r: this.originalSignature.r,
        s: this.originalSignature.s,
      };

      this.tamperedVerificationResult = publicKey.verify(
        this.tamperedHash,
        signatureObj
      );

      console.log('Original hash:', this.originalHash);
      console.log('Tampered hash:', this.tamperedHash);
      console.log(
        'Verification of tampered message:',
        this.tamperedVerificationResult
      );
    } catch (error) {
      console.error('Error in tampering experiment:', error);
      alert('Ошибка при проведении эксперимента');
    }
  }

  // Проверка оригинального сообщения (должна пройти)
  verifyOriginalMessage(): boolean {
    if (!this.experimentKeys || !this.originalSignature) {
      return false;
    }

    try {
      const publicKey = this.ec.keyFromPublic(
        this.experimentKeys.publicKey,
        'hex'
      );
      const signatureObj = {
        r: this.originalSignature.r,
        s: this.originalSignature.s,
      };
      return publicKey.verify(this.originalHash, signatureObj);
    } catch {
      return false;
    }
  }

  // ============= ЗАДАНИЕ 5: Множественные подписи =============
  runMultipleSignaturesTest(): void {
    this.comparisonResults = [];

    try {
     
      const keyPair = this.ec.genKeyPair();
      const privateKey = keyPair.getPrivate('hex');
      const publicKey = keyPair.getPublic('hex');

      const testMessages = [
        'Transfer 10 BTC to Alice',
        'Transfer 20 ETH to Bob',
        'Smart contract deployment',
        'NFT minting transaction',
        'Transfer 10 BTC to Alice', // Дубликат для демонстрации
      ];

      testMessages.forEach((msg) => {
        // Хэшируем и подписываем
        const hash = crypto.SHA256(msg).toString();
        const key = this.ec.keyFromPrivate(privateKey, 'hex');
        const signature = key.sign(hash);
        const sigHex = signature.toDER('hex');

        // Проверяем
        const pubKey = this.ec.keyFromPublic(publicKey, 'hex');
        const valid = pubKey.verify(hash, signature);

        this.comparisonResults.push({
          message: msg,
          hash: hash.substring(0, 16) + '...',
          signature: sigHex.substring(0, 20) + '...',
          valid: valid,
        });
      });

      console.log('Multiple signatures test results:', this.comparisonResults);
    } catch (error) {
      console.error('Error in multiple signatures test:', error);
      alert('Ошибка при тестировании множественных подписей');
    }
  }

  // ============= Вспомогательные методы =============

  copyToClipboard(text: string): void {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert('Скопировано в буфер обмена!');
      })
      .catch((err) => {
        console.error('Copy failed:', err);
      });
  }

  switchTab(tab: typeof this.currentTab): void {
    this.currentTab = tab;
  }

  downloadReport(): void {
    const report = this.generateReport();
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ecdsa-lab-report-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private generateReport(): string {
    return `
═══════════════════════════════════════════════════════════════
   ОТЧЁТ ПО ПРАКТИЧЕСКОЙ РАБОТЕ №8
   Тема: Реализация и анализ цифровой подписи ECDSA
   Дата: ${new Date().toLocaleString('ru-RU')}
═══════════════════════════════════════════════════════════════

ЗАДАНИЕ 1: Генерация пары ключей ECDSA (secp256k1)
─────────────────────────────────────────────────────────────
Private Key: ${this.generatedKeys?.privateKey || 'Не выполнено'}
Public Key:  ${this.generatedKeys?.publicKey || 'Не выполнено'}
Public Key (compressed): ${
      this.generatedKeys?.publicKeyCompressed || 'Не выполнено'
    }

ЗАДАНИЕ 2: Подписание сообщения
─────────────────────────────────────────────────────────────
Сообщение: ${this.messageToSign}
SHA-256 Hash: ${this.messageHash}
Signature (r): ${this.signature?.r || 'Не выполнено'}
Signature (s): ${this.signature?.s || 'Не выполнено'}
Signature (DER hex): ${this.signatureHex}

ЗАДАНИЕ 3: Проверка подписи
─────────────────────────────────────────────────────────────
Результат проверки: ${
      this.verificationResult !== null
        ? this.verificationResult
          ? '✓ ВАЛИДНА'
          : '✗ НЕВАЛИДНА'
        : 'Не выполнено'
    }

ЗАДАНИЕ 4: Эксперимент с изменением сообщения
─────────────────────────────────────────────────────────────
Оригинальное сообщение: ${this.originalMessage}
Оригинальный hash: ${this.originalHash}

Изменённое сообщение: ${this.tamperedMessage}
Изменённый hash: ${this.tamperedHash}

Проверка изменённого сообщения с оригинальной подписью: 
${
  this.tamperedVerificationResult !== null
    ? this.tamperedVerificationResult
      ? '✓ ВАЛИДНА (ОШИБКА!)'
      : '✗ НЕВАЛИДНА (ПРАВИЛЬНО)'
    : 'Не выполнено'
}

Вывод: ${
      this.tamperedVerificationResult === false
        ? 'Подпись корректно определяет изменение данных'
        : 'Требуется выполнить эксперимент'
    }

ЗАДАНИЕ 5: Сравнение подписей
─────────────────────────────────────────────────────────────
${
  this.comparisonResults.length > 0
    ? this.comparisonResults
        .map(
          (r, i) =>
            `${i + 1}. ${r.message}\n   Hash: ${r.hash}\n   Signature: ${
              r.signature
            }\n   Valid: ${r.valid ? '✓' : '✗'}`
        )
        .join('\n\n')
    : 'Не выполнено'
}

ОТВЕТЫ НА КОНТРОЛЬНЫЕ ВОПРОСЫ
─────────────────────────────────────────────────────────────
1. В чём отличие ECDSA от классического RSA-подписания?
${this.answers.q1 || '[Не заполнено]'}

2. Почему блокчейн использует именно эллиптические кривые secp256k1?
${this.answers.q2 || '[Не заполнено]'}

3. Как обеспечивается неизменность транзакции после её подписания?
${this.answers.q3 || '[Не заполнено]'}

4. Что произойдёт, если закрытый ключ утечёт?
${this.answers.q4 || '[Не заполнено]'}

5. Можно ли использовать одну пару ключей для разных блокчейн-сетей?
${this.answers.q5 || '[Не заполнено]'}

ВЫВОДЫ
─────────────────────────────────────────────────────────────
В ходе лабораторной работы была изучена цифровая подпись ECDSA 
на эллиптической кривой secp256k1, используемая в блокчейн-системах 
Bitcoin и Ethereum.

Основные результаты:
- Успешно реализована генерация криптографических ключей
- Продемонстрирован процесс подписания транзакций
- Проверена валидность подписей
- Экспериментально доказано, что изменение данных приводит к 
  невалидности подписи
- Подтверждена надёжность механизма аутентификации в блокчейне

ECDSA обеспечивает высокий уровень безопасности при компактных ключах,
что критично для распределённых систем блокчейн.

═══════════════════════════════════════════════════════════════
`;
  }
}
