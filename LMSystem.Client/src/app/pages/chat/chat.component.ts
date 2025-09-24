// chat.component.ts
import { Component, ElementRef, EventEmitter, Input, NgZone, Output, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { filter, Observable, Subscription } from 'rxjs';
import { User } from '../../data/Entities/User';
import { ChatsService } from '../../data/services/chats.service';
import { Message } from '../../data/Entities/Message';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../data/services/users.service';
import { InviteService } from '../../data/services/invite.service';
import { MessageService } from '../../data/services/message.service';
import { ChatSocketService, ChatUsersUpdate } from '../../data/websockets/ChatSocketService';
import { NavigationEnd, Router } from '@angular/router';
import { DiffieHellmanService, ActiveUser } from '../../data/websockets/DiffieHelmanService';
import { CryptoStorageService } from '../../data/services/crypto-storage.service';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnDestroy, OnInit {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLDivElement>;
  private userScrolledUp = false;
  private readonly SCROLL_THRESHOLD = 150;
  private subscriptions: Subscription[] = [];
  private lastActiveUsersHash = '';

  @Output() messageSend = new EventEmitter<string>();
  chatId!: string;
  myId: string | undefined;
  myName: string | undefined;
  chatName: string | null = null;
  users$!: Observable<User[]>;

  UsersInChat: User[] = [];
  UsersActive: string[] = [];
  modalUsersOpen: boolean = false;
  messages: Message[] = [];
  newMessage = '';
  users: User[] = [];
  isConnected = false;

  // Diffie-Hellman related properties
  isDhConnected = false;
  keyExchangeInProgress = false;
  keyExchangeStatus = 'idle';
  currentEncryptionKeyId: string | null = null;

  constructor(
    private chatsService: ChatsService,
    private usersService: UsersService,
    private invitesService: InviteService,
    private messageService: MessageService,
    private chatSocket: ChatSocketService,
    private dhService: DiffieHellmanService,
    private cryptoStorage: CryptoStorageService,
    private ngZone: NgZone,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.chatId = window.location.pathname.split('/').pop() || '';
    this.myId = this.usersService.getFromLocalStorage()?.id;
    if (!this.chatId) {
      console.warn('ChatWindowComponent: chatId не задан');
      return;
    }
 
    this.initializeChat();  
     this.initializeDiffieHellman();
 
  }

  ngOnDestroy(): void {
    // Отписываемся от всех подписок
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Покидаем чат при уничтожении компонента
    if (this.chatId) {
      this.chatSocket.leaveChat(this.chatId);
      this.dhService.leaveDiffieHellmanSession();
    }
    
    // Отключаем Diffie-Hellman сервис
    this.dhService.disconnect();
  }

  private async initializeChat(): Promise<void> {
    this.getChat();
    this.loadUsers();
    this.getMe();
    this.getMessages();

    // Подключаемся к сокету
    this.chatSocket.connect({ token: localStorage.getItem('token') || undefined });

    // Подписываемся на статус соединения
    const connectionSub = this.chatSocket.connectionStatus$.subscribe(connected => {
      // this.isConnected = connected;
      console.log('[ChatComponent] Connection status:', connected);
    });
    this.subscriptions.push(connectionSub);

    // Получаем информацию о себе
    const userSub = this.usersService.getMe().subscribe(me => {
      this.myId = me.id;
      this.myName = me.name;

      // Подписываемся на сообщения
      const messagesSub = this.chatSocket.messages$.subscribe(msg => {
        if (msg.chatId === this.chatId) {
          console.log('[ChatComponent] New message received:', msg);
          
          // Если сообщение зашифровано, расшифровываем его
          this.decryptMessageIfNeeded(msg).then(decryptedMsg => {
            this.messages.push(decryptedMsg);
            if (this.isAtBottom()) {
              this.scrollToBottomAfterRender();
              this.userScrolledUp = false;
            }
          });
        }
      });
      this.subscriptions.push(messagesSub);

      // Подписываемся на обновления пользователей в чате
      const chatUsersSub = this.dhService.activeUsers$.subscribe((update: any) => {
        if (update.chatId === this.chatId) {
          console.log('[ChatComponent] Chat users update:', update);
          
          // Обновляем список активных пользователей
          this.UsersActive = update.users;
          
          // Проверяем, изменился ли состав пользователей
          this.handleActiveUsersChange(update.users);
          
          // Опционально: показываем уведомления о подключении/отключении
          if (update.disconnectedUser) {
            // this.showUserStatusMessage(`Пользователь ${update.disconnectedUser} отключился`, 'disconnect');
          }
          if (update.leftUser) {
            // this.showUserStatusMessage(`Пользователь ${update.leftUser} покинул чат`, 'leave');
          }
        }
      });
      this.subscriptions.push(chatUsersSub);

      // Входим в комнату чата
      this.chatSocket.joinChat(this.chatId);
    });
    this.subscriptions.push(userSub);
  }

  private initializeDiffieHellman(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('[ChatComponent] JWT token не найден');
      return;
    }

    // Подключаемся к Diffie-Hellman WebSocket
    this.dhService.connect(token);

    // Подписываемся на статус подключения DH
    const dhConnectionSub = this.dhService.connected$.subscribe(connected => {
      this.isDhConnected = connected;
      console.log('[ChatComponent] DH Connection status:', connected);
      
      // Если подключились и есть активные пользователи, присоединяемся к сессии DH
      if (connected && this.myId) {
          setTimeout(() => {
      this.dhService.joinDiffieHellmanSession(this.chatId, this.myId!);
    }, 100);
      }
    });
    this.subscriptions.push(dhConnectionSub);

    // Подписываемся на статус обмена ключами
    const dhStatusSub = this.dhService.keyExchangeStatus$.subscribe(status => {
      this.keyExchangeStatus = status;
      this.keyExchangeInProgress = !['idle', 'completed', 'error'].includes(status);
      
      console.log('[ChatComponent] Key exchange status:', status);
      
      // Если обмен ключами завершен, сохраняем результат
      if (status === 'Обмен ключами завершен') {
        this.handleKeyExchangeCompleted();
      }
    });
    this.subscriptions.push(dhStatusSub);

    // Подписываемся на ошибки DH
    const dhErrorsSub = this.dhService.errors$.subscribe(error => {
      console.error('[ChatComponent] DH Error:', error);
      this.showUserStatusMessage(`Ошибка шифрования: ${error}`, 'disconnect');
    });
    this.subscriptions.push(dhErrorsSub);
  }

  private handleActiveUsersChange(activeUsers: string[]): void {
    // Создаем хэш для определения изменений в составе пользователей
    const currentHash = this.createUsersHash(activeUsers);
    
    // Если состав пользователей изменился и их больше одного
    if (currentHash !== this.lastActiveUsersHash && activeUsers.length > 1) {
      console.log('[ChatComponent] Active users changed, starting key exchange');
      this.lastActiveUsersHash = currentHash;
      
      // Запускаем обмен ключами с задержкой, чтобы все пользователи успели подключиться
      setTimeout(() => {
        this.startKeyExchangeForActiveUsers(activeUsers);
      }, 1000);
    } else {
      this.lastActiveUsersHash = currentHash;
    }
  }

  private createUsersHash(users: string[]): string {
    return users.sort().join('|');
  }

  private startKeyExchangeForActiveUsers(activeUserIds: string[]): void {
    if (!this.myId || !this.isDhConnected || this.keyExchangeInProgress) {
      return;
    }

    // Присоединяемся к DH сессии, если еще не присоединились
    // this.dhService.joinDiffieHellmanSession(this.chatId, this.myId);

    // Создаем список активных пользователей для DH
    const activeUsers: ActiveUser[] = activeUserIds.map(id => ({ id }));
    
    console.log('[ChatComponent] Starting key exchange for users:', activeUsers);
    
    // Запускаем обмен ключами
    this.dhService.setActiveUsersAndStartKeyExchange(activeUsers);
  }

  private handleKeyExchangeCompleted(): void {
    const sharedSecret = this.dhService.getSharedSecret();
    if (!sharedSecret) {
      console.error('[ChatComponent] Shared secret is null after key exchange completion');
      return;
    }

    // Создаем уникальный идентификатор для этого ключа на основе участников
    const keyId = this.generateKeyId(this.UsersActive);
    
    // Сохраняем общий секрет
    this.cryptoStorage.storeSharedSecret(keyId, sharedSecret);
    this.currentEncryptionKeyId = keyId;
    
    console.log(`[ChatComponent] Shared secret saved with key ID: ${keyId}`);
    
    this.showUserStatusMessage('🔒 Безопасное соединение установлено', 'connect');
  }

  private generateKeyId(userIds: string[]): string {
    // Создаем детерминированный ID на основе отсортированных ID пользователей и chatId
    const sortedUsers = [...userIds].sort();
    const keyData = `${this.chatId}:${sortedUsers.join(':')}`;
    
    // Простое хеширование (в реальном приложении используйте crypto.subtle.digest)
    return btoa(keyData).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  private async encryptMessage(content: string): Promise<{ encryptedContent: string, keyId: string } | null> {
    if (!this.currentEncryptionKeyId) {
      return null;
    }

    const sharedSecret = this.cryptoStorage.getSharedSecret(this.currentEncryptionKeyId);
    if (!sharedSecret) {
      console.warn('[ChatComponent] No shared secret available for encryption');
      return null;
    }

    try {
      // Здесь должно быть реальное шифрование
      // Для примера используем простое кодирование
      const encryptedContent = btoa(content + '|' + sharedSecret.substring(0, 8));
      
      return {
        encryptedContent,
        keyId: this.currentEncryptionKeyId
      };
    } catch (error) {
      console.error('[ChatComponent] Encryption failed:', error);
      return null;
    }
  }

  private async decryptMessageIfNeeded(message: Message): Promise<Message> {
    // Проверяем, есть ли в сообщении keyId (индикатор зашифрованного сообщения)
    if (!message.keyId) {
      return message; // Сообщение не зашифровано
    }

    const sharedSecret = this.cryptoStorage.getSharedSecret(message.keyId);
    if (!sharedSecret) {
      console.warn(`[ChatComponent] No shared secret for key ID: ${message.keyId}`);
      return {
        ...message,
        content: '[🔒 Не удалось расшифровать сообщение]'
      };
    }

    try {
      // Здесь должно быть реальное расшифрование
      // Для примера используем простое декодирование
      const decoded = atob(message.content);
      const [originalContent] = decoded.split('|');
      
      return {
        ...message,
        content: originalContent
      };
    } catch (error) {
      console.error('[ChatComponent] Decryption failed:', error);
      return {
        ...message,
        content: '[🔒 Ошибка расшифровки сообщения]'
      };
    }
  }

  private showUserStatusMessage(message: string, type: 'connect' | 'disconnect' | 'leave'): void {
    console.info(`[ChatComponent] ${type.toUpperCase()}: ${message}`);
    
    const systemMessage: Message = {
      id: `system-${Date.now()}`,
      chatId: this.chatId,
      userId: 'system',
      user: {
        id: 'system',
        email: '',
        name: 'System',
      },
      content: message,
      timestamp: new Date().toISOString(),
      reviewed: true,
      type: 'system',
    };

    this.messages.push(systemMessage);
    if (this.isAtBottom()) {
      this.scrollToBottomAfterRender();
    }
  }

  // Остальные методы остаются без изменений
  onMessagesScroll() {
    this.userScrolledUp = !this.isAtBottom();
  }

  isAtBottom(): boolean {
    const el = this.messagesContainer?.nativeElement;
    if (!el) return true;
    const scrollPos = el.scrollTop + el.clientHeight;
    const scrollHeight = el.scrollHeight;
    return (scrollHeight - scrollPos) <= this.SCROLL_THRESHOLD;
  }

  private scrollToBottomAfterRender() {
    requestAnimationFrame(() => {
      const el = this.messagesContainer?.nativeElement;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior: 'auto' });
    });
  }

  onMediaLoad() {
    if (this.isAtBottom()) this.scrollToBottomAfterRender();
  }

  getMessages() {
    this.messageService.getMessages(this.chatId).subscribe(async (messages) => {
      // Расшифровываем все полученные сообщения
      this.messages = await Promise.all(
        messages.map(msg => this.decryptMessageIfNeeded(msg))
      );
      console.log('Loaded messages:', this.messages);
    });
  }

  async sendMessage() {
    const text = this.newMessage.trim();
    if (!text) return;
    if (!this.myId || !this.myName) {
      console.error('User info is missing');
      return;
    }

    let messageContent = text;
    let keyId: string | undefined;

    // Пытаемся зашифровать сообщение, если есть общий ключ
    const encryptionResult = await this.encryptMessage(text);
    if (encryptionResult) {
      messageContent = encryptionResult.encryptedContent;
      keyId = encryptionResult.keyId;
      console.log('[ChatComponent] Message encrypted with key ID:', keyId);
    }

    const message: Message = {
      id: '',
      chatId: this.chatId,
      userId: this.myId,
      user: {
        id: this.myId,
        email: '',
        name: this.myName,
      },
      content: messageContent,
      timestamp: new Date().toISOString(),
      reviewed: false,
      type: 'text',
  
      keyId: keyId, // Добавляем ID ключа к сообщению
    };

    this.messageService
      .sendMessage(this.chatId, message)
      .subscribe((response) => {
        this.scrollToBottomAfterRender();
        this.newMessage = '';
      });
  }

  getMe() {
    this.usersService.getMe().subscribe((user) => {
      // this.myId = user.id;
      // this.myName = user.name;
    });
  }

  getChat() {
    return this.chatsService.getChat(this.chatId).subscribe((chat) => {
      this.chatName = chat?.name || null;
      return chat;
    });
  }

  loadUsers(): void {
    this.users$ = this.chatsService.getChatUsers(this.chatId);
  }

  loadMockMessages(): void {}

  trackByMessage(_index: number, item: Message) {
    return item.id;
  }

  trackByUser(_index: number, item: User) {
    return item.id;
  }

  openUsersModal() {
    this.modalUsersOpen = true;
    this.usersService.getAllUsers().subscribe((users) => {
      this.users = users;
    });
  }

  sendInvite(chatId: string, userReceiverId: string) {
    this.invitesService.sendInvite({ chatId, userReceiverId }).subscribe();
  }

  closeUsersModal() {
    this.modalUsersOpen = false;
  }

  // Дополнительные методы для работы с активными пользователями
  isUserActive(userId: string): boolean {
    return this.UsersActive.includes(userId);
  }

  getActiveUsersCount(): number {
    return this.UsersActive.length;
  }

  // Методы для отображения статуса шифрования
  isEncryptionActive(): boolean {
    return this.currentEncryptionKeyId !== null;
  }

  getEncryptionStatus(): string {
    if (this.keyExchangeInProgress) {
      return this.keyExchangeStatus;
    }
    
    if (this.isEncryptionActive()) {
      return '🔒 Сообщения зашифрованы';
    }
    
    if (this.UsersActive.length < 2) {
      return '👤 Ожидание других пользователей';
    }
    
    return '🔓 Шифрование неактивно';
  }

  // Метод для ручного запуска обмена ключами (опционально)
  manualStartKeyExchange(): void {
    if (this.UsersActive.length > 1 && this.myId) {
      this.startKeyExchangeForActiveUsers(this.UsersActive);
    }
  }
}