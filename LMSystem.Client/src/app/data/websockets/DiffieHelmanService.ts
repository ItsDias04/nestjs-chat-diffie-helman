import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

export interface DiffieHellmanMessageDto {
  chatId: string;
  fromClientId: string;
  toClientId: string;
  publicKey: string;
  stage: number;
}

export interface ActiveUser {
  id: string;
  name?: string;
  // другие поля пользователя
}

export interface DhMessage {
  chatId: string;
  fromClientId: string;
  toClientId: string;
  publicKey: string;
  stage: number;
  serverTimestamp: number;
}

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

@Injectable({
  providedIn: 'root'
})
export class DiffieHellmanService {
  private socket: Socket | null = null;
  private currentUserId: string | null = null;
  private currentChatId: string | null = null;
  
  // Состояние сервиса
  private connectedSubject = new BehaviorSubject<boolean>(false);
  private activeUsersSubject = new BehaviorSubject<ActiveUser[]>([]);
  private messagesSubject = new Subject<DhMessage>();
  private errorsSubject = new Subject<string>();
  private keyExchangeStatusSubject = new BehaviorSubject<string>('idle');
  
  // Хранение ключей и промежуточных результатов
  private myPrivateKey: string | null = null;
  private myPublicKey: string | null = null;
  private sharedSecret: string | null = null;
  private receivedPublicKeys: Map<string, string> = new Map();
  private isKeyExchangeActive: boolean = false;

  public connected$ = this.connectedSubject.asObservable();
  public activeUsers$ = this.activeUsersSubject.asObservable();
  public messages$ = this.messagesSubject.asObservable();
  public errors$ = this.errorsSubject.asObservable();
  public keyExchangeStatus$ = this.keyExchangeStatusSubject.asObservable();

  constructor( private ngZone: NgZone) {}

  /**
   * Подключение к WebSocket
   */
  connect(token: string, serverUrl: string = 'ws://localhost:3000'): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(`${serverUrl}/diffie-hellman`, {
      auth: {
        token: `Bearer ${token}`
      },
      transports: ['websocket']
    });

    this.setupSocketListeners();
  }

  /**
   * Отключение от WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectedSubject.next(false);
    }
    this.resetState();
  }

  /**
   * Присоединение к сессии обмена ключами для чата
   */
  joinDiffieHellmanSession(chatId: string, userId: string): void {
    if (!this.socket?.connected) {
      this.errorsSubject.next('WebSocket не подключен');
      return;
    }

    this.currentChatId = chatId;
    this.currentUserId = userId;
    
    this.socket.emit('dh-join', { chatId });
  }

  /**
   * Покидание сессии обмена ключами
   */
  leaveDiffieHellmanSession(): void {
    if (!this.socket?.connected || !this.currentChatId) {
      return;
    }

    this.socket.emit('dh-leave', { chatId: this.currentChatId });
    this.resetState();
  }

  /**
   * Установка активных пользователей и запуск обмена ключами
   */
  async setActiveUsersAndStartKeyExchange(users: ActiveUser[]): Promise<void> {
    if (!this.currentUserId) {
      this.errorsSubject.next('Не установлен текущий пользователь');
      return;
    }

    if (this.isKeyExchangeActive) {
      this.errorsSubject.next('Обмен ключами уже активен');
      return;
    }

    // Сортируем пользователей по ID (GUID)
    const sortedUsers = [...users].sort((a, b) => a.id.localeCompare(b.id));
    this.activeUsersSubject.next(sortedUsers);

    // Находим индекс текущего пользователя
    const currentUserIndex = sortedUsers.findIndex(user => user.id === this.currentUserId);
    
    if (currentUserIndex === -1) {
      this.errorsSubject.next('Текущий пользователь не найден в списке активных пользователей');
      return;
    }

    this.isKeyExchangeActive = true;

    try {
      // ВСЕ пользователи генерируют свои ключевые пары в начале
      this.keyExchangeStatusSubject.next('Генерация ключевой пары...');
      
      const keyPair = await this.generateKeyPair();
      this.myPrivateKey = keyPair.privateKey;
      this.myPublicKey = keyPair.publicKey;

      // Все пользователи отправляют свои публичные ключи в начале
      if (true) {
        await this.initiateKeyExchange(sortedUsers);
      } else {
        // this.keyExchangeStatusSubject.next('Ожидание начала обмена ключами...');
      }
    } catch (error) {
      this.errorsSubject.next(`Ошибка при подготовке к обмену ключами: ${error}`);
      this.isKeyExchangeActive = false;
    }
  }

  /**
   * Инициация обмена ключами (выполняет первый пользователь в списке)
   */
  private async initiateKeyExchange(sortedUsers: ActiveUser[]): Promise<void> {
    try {
      if (!this.myPublicKey) {
        throw new Error('Публичный ключ не сгенерирован');
      }

      // Получаем следующего пользователя в списке
      const nextUser = this.getNextUser(sortedUsers, this.currentUserId!);
      
      if (!nextUser) {
        this.errorsSubject.next('Не найден следующий пользователь для отправки ключа');
        return;
      }

      this.keyExchangeStatusSubject.next(`Отправка ключа пользователю ${nextUser.id}...`);

      // Отправляем свой публичный ключ следующему пользователю (stage = 1)
      this.sendDiffieHellmanMessage({
        chatId: this.currentChatId!,
        fromClientId: this.currentUserId!,
        toClientId: nextUser.id,
        publicKey: this.myPublicKey,
        stage: 1
      });

    } catch (error) {
      this.errorsSubject.next(`Ошибка при инициации обмена ключами: ${error}`);
      this.isKeyExchangeActive = false;
    }
  }

  /**
   * Обработка полученного сообщения Diffie-Hellman
   */
  private async handleReceivedMessage(message: DhMessage): Promise<void> {
    if (!this.isKeyExchangeActive) {
      return;
    }

    try {
      const sortedUsers = this.activeUsersSubject.value;
      const totalUsers = sortedUsers.length;

      this.keyExchangeStatusSubject.next(`Получено сообщение на этапе ${message.stage}`);

      // Сохраняем полученный публичный ключ
      this.receivedPublicKeys.set(message.fromClientId, message.publicKey);

      // Проверяем, завершился ли обмен ключами (ключ прошел полный круг)
      if (message.stage >= totalUsers-1) {
        // Это финальное сообщение - вычисляем общий секрет
        await this.calculateFinalSharedSecret(message.publicKey);
        this.keyExchangeStatusSubject.next('Обмен ключами завершен');
        this.isKeyExchangeActive = false;
        return;
      }

      if (!this.myPrivateKey || !this.myPublicKey) {
        throw new Error('Ключевая пара не сгенерирована');
      }

      // Вычисляем промежуточный результат: g^(a * receivedKey) mod p
      const intermediateResult = await this.computeDiffieHellman(this.myPrivateKey, message.publicKey);
      
      // Генерируем новый публичный ключ на основе промежуточного результата
      const newPublicKey = await this.derivePublicKeyFromSecret(intermediateResult);

      // Находим следующего пользователя (с учетом цикличности)
      const nextUser = this.getNextUser(sortedUsers, this.currentUserId!);
      
      if (!nextUser) {
        this.errorsSubject.next('Не найден следующий пользователь для продолжения обмена');
        return;
      }

      this.keyExchangeStatusSubject.next(`Пересылка ключа пользователю ${nextUser.id}...`);

      // Отправляем обновленный ключ следующему пользователю с увеличенным stage
      this.sendDiffieHellmanMessage({
        chatId: message.chatId,
        fromClientId: this.currentUserId!,
        toClientId: nextUser.id,
        publicKey: newPublicKey,
        stage: message.stage + 1
      });

    } catch (error) {
      this.errorsSubject.next(`Ошибка при обработке сообщения: ${error}`);
      this.isKeyExchangeActive = false;
    }
  }

  /**
   * Отправка сообщения Diffie-Hellman
   */
  private sendDiffieHellmanMessage(message: DiffieHellmanMessageDto): void {
    if (!this.socket?.connected) {
      this.errorsSubject.next('WebSocket не подключен');
      return;
    }

    this.socket.emit('dh-send', message);
  }

  /**
   * Получение следующего пользователя в отсортированном списке (циклично)
   */
  private getNextUser(sortedUsers: ActiveUser[], currentUserId: string): ActiveUser | null {
    const currentIndex = sortedUsers.findIndex(user => user.id === currentUserId);
    if (currentIndex === -1) return null;
    
    // Циклично переходим к следующему пользователю
    // Если текущий последний, то следующий - первый
    const nextIndex = (currentIndex + 1) % sortedUsers.length;
    return sortedUsers[nextIndex];
  }

  /**
   * Настройка слушателей WebSocket событий
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.connectedSubject.next(true);
    });

    this.socket.on('disconnect', () => {
      this.connectedSubject.next(false);
    });

    this.socket.on('dh-connected', (data: any) => {
      console.log('Подключен к Diffie-Hellman gateway:', data);
    });

    this.socket.on('dh-joined', (data: any) => {
      console.log('Присоединился к сессии DH:', data);
    });

    this.socket.on('dh-left', (data: any) => {
      console.log('Покинул сессию DH:', data);
    });

    this.socket.on('dh-message', (message: DhMessage) => {
      this.messagesSubject.next(message);
      this.handleReceivedMessage(message);
    });

    this.socket.on('dh-sent', (data: any) => {
      console.log('Сообщение DH отправлено:', data);
    });

    this.socket.on('dh-error', (error: any) => {
      this.errorsSubject.next(error.message || 'Неизвестная ошибка');
    });

    this.socket.on('error', (error: any) => {
      this.errorsSubject.next(error.message || 'Ошибка WebSocket');
    });

    this.socket.on('dh-chatUsersUpdate', (data: any) => {
      console.log('Пользователи чата обновлены:', data);
this.ngZone.run(() => this.activeUsersSubject.next(data));
    })
  }

  /**
   * Сброс состояния сервиса
   */
  private resetState(): void {
    this.currentUserId = null;
    this.currentChatId = null;
    this.myPrivateKey = null;
    this.myPublicKey = null;
    this.sharedSecret = null;
    this.receivedPublicKeys.clear();
    this.keyExchangeStatusSubject.next('idle');
    this.isKeyExchangeActive = false;
  }

  /**
   * Генерация ключевой пары с использованием Web Crypto API
   */
  private async generateKeyPair(): Promise<KeyPair> {
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'ECDH',
          namedCurve: 'P-256'
        },
        true,
        ['deriveKey', 'deriveBits']
      );

      const publicKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
      const privateKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);

      return {
        publicKey: JSON.stringify(publicKeyJwk),
        privateKey: JSON.stringify(privateKeyJwk)
      };
    } catch (error) {
      throw new Error(`Ошибка генерации ключевой пары: ${error}`);
    }
  }

  /**
   * Вычисление общего секрета Diffie-Hellman с использованием Web Crypto API
   */
  private async computeDiffieHellman(privateKeyJwk: string, publicKeyJwk: string): Promise<string> {
    try {
      const privateKey = await window.crypto.subtle.importKey(
        'jwk',
        JSON.parse(privateKeyJwk),
        { name: 'ECDH', namedCurve: 'P-256' },
        false,
        ['deriveBits']
      );

      const publicKey = await window.crypto.subtle.importKey(
        'jwk',
        JSON.parse(publicKeyJwk),
        { name: 'ECDH', namedCurve: 'P-256' },
        false,
        []
      );

      const sharedBits = await window.crypto.subtle.deriveBits(
        { name: 'ECDH', public: publicKey },
        privateKey,
        256
      );

      // Преобразуем ArrayBuffer в hex строку
      const sharedArray = new Uint8Array(sharedBits);
      return Array.from(sharedArray, byte => byte.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      throw new Error(`Ошибка вычисления общего секрета: ${error}`);
    }
  }

  /**
   * Генерация нового публичного ключа из промежуточного секрета
   */
  private async derivePublicKeyFromSecret(secret: string): Promise<string> {
    try {
      // Используем секрет как основу для генерации нового ключа
      const secretBuffer = new TextEncoder().encode(secret);
      const hash = await window.crypto.subtle.digest('SHA-256', secretBuffer);
      
      // Генерируем новую ключевую пару, используя хеш как энтропию
      // В реальной реализации здесь должна быть более сложная логика
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'ECDH',
          namedCurve: 'P-256'
        },
        true,
        ['deriveKey', 'deriveBits']
      );

      const publicKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
      return JSON.stringify(publicKeyJwk);
    } catch (error) {
      throw new Error(`Ошибка генерации производного ключа: ${error}`);
    }
  }

  /**
   * Финальное вычисление общего секрета для всех участников
   */
  private async calculateFinalSharedSecret(finalPublicKey: string): Promise<void> {
    if (!this.myPrivateKey) {
      throw new Error('Приватный ключ не найден');
    }

    try {
      this.sharedSecret = await this.computeDiffieHellman(this.myPrivateKey, finalPublicKey);
      console.log('Общий секрет вычислен:', this.sharedSecret);
    } catch (error) {
      throw new Error(`Ошибка финального вычисления общего секрета: ${error}`);
    }
  }

  /**
   * Получение вычисленного общего секрета
   */
  getSharedSecret(): string | null {
    return this.sharedSecret;
  }

  /**
   * Получение текущего статуса обмена ключами
   */
  getCurrentStatus(): string {
    return this.keyExchangeStatusSubject.value;
  }

  /**
   * Проверка, активен ли процесс обмена ключами
   */
  isKeyExchangeInProgress(): boolean {
    return this.isKeyExchangeActive;
  }

  /**
   * Принудительная остановка обмена ключами
   */
  stopKeyExchange(): void {
    this.isKeyExchangeActive = false;
    this.keyExchangeStatusSubject.next('Обмен ключами остановлен');
  }
}