import { Injectable } from '@angular/core';
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

  public connected$ = this.connectedSubject.asObservable();
  public activeUsers$ = this.activeUsersSubject.asObservable();
  public messages$ = this.messagesSubject.asObservable();
  public errors$ = this.errorsSubject.asObservable();
  public keyExchangeStatus$ = this.keyExchangeStatusSubject.asObservable();

  constructor() {}

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
  setActiveUsersAndStartKeyExchange(users: ActiveUser[]): void {
    if (!this.currentUserId) {
      this.errorsSubject.next('Не установлен текущий пользователь');
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

    // Если текущий пользователь первый в отсортированном списке, он инициирует обмен
    if (currentUserIndex === 0) {
      this.initiateKeyExchange(sortedUsers);
    }
  }

  /**
   * Инициация обмена ключами (выполняет первый пользователь в списке)
   */
  private async initiateKeyExchange(sortedUsers: ActiveUser[]): Promise<void> {
    try {
      this.keyExchangeStatusSubject.next('Генерация ключевой пары...');
      
      // Генерируем ключевую пару
      const keyPair = await this.generateKeyPair();
      this.myPrivateKey = keyPair.privateKey;
      this.myPublicKey = keyPair.publicKey;

      // Получаем следующего пользователя в списке
      const nextUser = this.getNextUser(sortedUsers, this.currentUserId!);
      
      if (!nextUser) {
        this.errorsSubject.next('Не найден следующий пользователь для отправки ключа');
        return;
      }

      this.keyExchangeStatusSubject.next(`Отправка ключа пользователю ${nextUser.id}...`);

      // Отправляем публичный ключ следующему пользователю
      this.sendDiffieHellmanMessage({
        chatId: this.currentChatId!,
        fromClientId: this.currentUserId!,
        toClientId: nextUser.id,
        publicKey: this.myPublicKey,
        stage: 1
      });

    } catch (error) {
      this.errorsSubject.next(`Ошибка при инициации обмена ключами: ${error}`);
    }
  }

  /**
   * Обработка полученного сообщения Diffie-Hellman
   */
  private async handleReceivedMessage(message: DhMessage): Promise<void> {
    try {
      const sortedUsers = this.activeUsersSubject.value;
      const totalUsers = sortedUsers.length;

      this.keyExchangeStatusSubject.next(`Получено сообщение на этапе ${message.stage}`);

      // Сохраняем полученный публичный ключ
      this.receivedPublicKeys.set(message.fromClientId, message.publicKey);

      // Если это последний этап (stage равен количеству пользователей)
      if (message.stage >= totalUsers) {
        // Вычисляем общий секрет
        await this.calculateSharedSecret(message.publicKey);
        this.keyExchangeStatusSubject.next('Обмен ключами завершен');
        return;
      }

      // Если у нас еще нет ключевой пары, генерируем ее
      if (!this.myPrivateKey || !this.myPublicKey) {
        const keyPair = await this.generateKeyPair();
        this.myPrivateKey = keyPair.privateKey;
        this.myPublicKey = keyPair.publicKey;
      }

      // Вычисляем промежуточный результат с полученным ключом
      const intermediateSecret = await this.computeDiffieHellman(this.myPrivateKey, message.publicKey);
      
      // Генерируем новый публичный ключ на основе промежуточного результата
      const newPublicKey = await this.derivePublicKeyFromSecret(intermediateSecret);

      // Находим следующего пользователя
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
   * Получение следующего пользователя в отсортированном списке
   */
  private getNextUser(sortedUsers: ActiveUser[], currentUserId: string): ActiveUser | null {
    const currentIndex = sortedUsers.findIndex(user => user.id === currentUserId);
    if (currentIndex === -1) return null;
    
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
  }

  /**
   * Генерация ключевой пары (заглушка - замените на реальную криптографическую библиотеку)
   */
  private async generateKeyPair(): Promise<KeyPair> {
    // Здесь должна быть реальная генерация ключевой пары
    // Например, используя Web Crypto API или библиотеку node-forge
    
    // Заглушка для примера
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
  }

  /**
   * Вычисление общего секрета Diffie-Hellman
   */
  private async computeDiffieHellman(privateKey: string, publicKey: string): Promise<string> {
    // Здесь должно быть реальное вычисление общего секрета
    // Заглушка для примера
    return `shared_secret_${Date.now()}`;
  }

  /**
   * Генерация публичного ключа из секрета
   */
  private async derivePublicKeyFromSecret(secret: string): Promise<string> {
    // Здесь должна быть реальная генерация ключа из секрета
    // Заглушка для примера
    return `derived_public_key_${secret}_${Date.now()}`;
  }

  /**
   * Финальное вычисление общего секрета
   */
  private async calculateSharedSecret(finalPublicKey: string): Promise<void> {
    if (!this.myPrivateKey) {
      throw new Error('Приватный ключ не найден');
    }

    this.sharedSecret = await this.computeDiffieHellman(this.myPrivateKey, finalPublicKey);
    console.log('Общий секрет вычислен:', this.sharedSecret);
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
}