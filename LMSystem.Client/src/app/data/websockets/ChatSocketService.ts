import { Injectable, NgZone } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject, Observable } from 'rxjs';
import { Message } from '../../data/Entities/Message';
import { environment } from '../../../environments/environments';

@Injectable({ providedIn: 'root' })
export class ChatSocketService {
  private socket: Socket | null = null;

  private messageSubject = new Subject<Message>();
  public messages$ = this.messageSubject.asObservable();

  private chatUsersSubject = new Subject<{ chatId: string; users: any[] }>();
  public chatUsers$ = this.chatUsersSubject.asObservable();

  constructor(private ngZone: NgZone) {}

  connect(opts?: { token?: string }) {
    if (this.socket) return;

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
      console.debug('[ChatSocket] connected', this.socket?.id);
    });

    this.socket.on('disconnect', (reason: any) => {
      console.debug('[ChatSocket] disconnected', reason);
    });

    this.socket.on('connect_error', (err: any) => {
      console.error('[ChatSocket] connect_error', err);
    });

    // Новое сообщение
    this.socket.on('newMessage', (message: Message) => {
      this.ngZone.run(() => this.messageSubject.next(message));
    });

    // Обновление пользователей в чате
    this.socket.on('chatUsersUpdate', (payload: { chatId: string; users: any[] }) => {
      console.log('chatUsersUpdate', payload);
      this.ngZone.run(() => this.chatUsersSubject.next(payload));
    });
  }

  disconnect() {
    if (!this.socket) return;
    this.socket.disconnect();
    this.socket = null;
  }

  /** Зарегистрировать пользователя на сервере */
  registerUser(userId: string) {
    if (!this.socket) return;
    this.socket.emit('registerUser', userId);
  }

  /** Войти в комнату (чат) */
  joinChat(chatId: string) {
    if (!this.socket) return;
    this.socket.emit('joinChat', { chatId });
  }

  /** Отправить сообщение в чат */
  sendMessage(chatId: string, message: Message) {
    if (!this.socket) return;
    this.socket.emit('sendMessage', { chatId, message });
  }

  /** Отправить приватное сообщение на другой клиент по id клиента (socketId на сервере) */
  sendToClient(toClientId: string, message: Message) {
    if (!this.socket) return;
    this.socket.emit('sendToClient', { toClientId, message });
  }

  /** Универсальный подписчик на произвольное событие */
  onEvent<T>(eventName: string): Observable<T> {
    const subject = new Subject<T>();
    if (!this.socket) return subject.asObservable();

    this.socket.on(eventName, (payload: T) => this.ngZone.run(() => subject.next(payload)));
    return subject.asObservable();
  }
}