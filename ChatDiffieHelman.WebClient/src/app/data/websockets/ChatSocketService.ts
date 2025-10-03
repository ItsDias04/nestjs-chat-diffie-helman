// ChatSocketService.ts
import { Injectable, NgZone } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject, Observable } from 'rxjs';
import { Message } from '../../data/Entities/Message';
import { environment } from '../../../environments/environments';

export interface ChatUsersUpdate {
  chatId: string;
  users: string[];
  disconnectedUser?: string; // пользователь который отключился
  leftUser?: string; // пользователь который покинул чат
}

@Injectable({ providedIn: 'root' })
export class ChatSocketService {
  private socket: Socket | null = null;

  private messageSubject = new Subject<Message>();
  public messages$ = this.messageSubject.asObservable();

  private chatUsersSubject = new Subject<ChatUsersUpdate>();
  public chatUsers$ = this.chatUsersSubject.asObservable();

  private connectionStatusSubject = new Subject<boolean>();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  constructor(private ngZone: NgZone) {}

  connect(opts?: { token?: string }) {
    if (this.socket?.connected) return;

    const url = (environment as any).socketUrl || (environment as any).apiUrl || '/';
    this.socket = io(url, {
      transports: ['websocket'],
      auth: opts?.token ? { token: opts.token } : undefined,
      extraHeaders: {
        Authorization: `Bearer ${opts?.token}`,
      },
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      // console.log('[ChatSocket] connected', this.socket?.id);
      this.ngZone.run(() => this.connectionStatusSubject.next(true));
    });

    this.socket.on('disconnect', (reason: any) => {
      // console.log('[ChatSocket] disconnected', reason);
      this.ngZone.run(() => this.connectionStatusSubject.next(false));
    });

    this.socket.on('connect_error', (err: any) => {
      // console.error('[ChatSocket] connect_error', err);
      this.ngZone.run(() => this.connectionStatusSubject.next(false));
    });

    this.socket.on('connected', (data: any) => {
      // console.log('[ChatSocket] server confirmed connection', data);
    });

    this.socket.on('error', (error: any) => {
      // console.error('[ChatSocket] server error', error);
    });

    // Новое сообщение
    this.socket.on('newMessage', (message: Message) => {
      // console.log('[ChatSocket] received message', message);
      this.ngZone.run(() => this.messageSubject.next(message));
    });

    // Обновление пользователей в чате
    this.socket.on('chatUsersUpdate', (payload: ChatUsersUpdate) => {
      // console.log('[ChatSocket] chatUsersUpdate', payload);
      this.ngZone.run(() => this.chatUsersSubject.next(payload));
    });
  }

  disconnect() {
    if (!this.socket) return;
    this.socket.disconnect();
    this.socket = null;
    this.ngZone.run(() => this.connectionStatusSubject.next(false));
  }

  /** Зарегистрировать пользователя на сервере - больше не нужно, аутентификация через middleware */
  registerUser(userId: string) {
    // Метод оставлен для обратной совместимости, но не используется
    // console.log('[ChatSocket] registerUser called (deprecated)', userId);
  }

  /** Войти в комнату (чат) */
  joinChat(chatId: string) {
    if (!this.socket?.connected) {
      // console.warn('[ChatSocket] Cannot join chat - socket not connected');
      return;
    }
    // console.log('[ChatSocket] joining chat', chatId);
    this.socket.emit('joinChat', { chatId });
  }

  /** Покинуть чат */
  leaveChat(chatId: string) {
    if (!this.socket?.connected) return;
    // console.log('[ChatSocket] leaving chat', chatId);
    this.socket.emit('leaveChat', { chatId });
  }

  /** Отправить сообщение в чат */
  sendMessage(chatId: string, message: Message) {
    if (!this.socket?.connected) return;
    this.socket.emit('sendMessage', { chatId, message });
  }

  /** Отправить приватное сообщение на другой клиент по id клиента (socketId на сервере) */
  sendToClient(toClientId: string, message: Message) {
    if (!this.socket?.connected) return;
    this.socket.emit('sendToClient', { toClientId, message });
  }

  /** Получить статус подключения */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /** Универсальный подписчик на произвольное событие */
  onEvent<T>(eventName: string): Observable<T> {
    const subject = new Subject<T>();
    if (!this.socket) return subject.asObservable();

    this.socket.on(eventName, (payload: T) => this.ngZone.run(() => subject.next(payload)));
    return subject.asObservable();
  }
}
