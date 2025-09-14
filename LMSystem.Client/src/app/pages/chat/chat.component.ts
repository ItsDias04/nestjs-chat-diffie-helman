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

  constructor(
    private chatsService: ChatsService,
    private usersService: UsersService,
    private invitesService: InviteService,
    private messageService: MessageService,
    private chatSocket: ChatSocketService,
    private ngZone: NgZone,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.chatId = window.location.pathname.split('/').pop() || '';
    if (!this.chatId) {
      console.warn('ChatWindowComponent: chatId не задан');
      return;
    }
   
    this.initializeChat();
  }

  ngOnDestroy(): void {
    // Отписываемся от всех подписок
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Покидаем чат при уничтожении компонента
    if (this.chatId) {
      this.chatSocket.leaveChat(this.chatId);
    }
  }

  private async initializeChat(): Promise<void> {
    this.getChat();
    this.loadUsers();
    // this.loadMockMessages();
    this.getMe();
    this.getMessages();

    // Подключаемся к сокету
    this.chatSocket.connect({ token: localStorage.getItem('token') || undefined });

    // Подписываемся на статус соединения
    const connectionSub = this.chatSocket.connectionStatus$.subscribe(connected => {
      this.isConnected = connected;
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
          this.messages.push(msg);
          if (this.isAtBottom()) {
            this.scrollToBottomAfterRender();
            this.userScrolledUp = false;
          }
        }
      });
      this.subscriptions.push(messagesSub);

      // Подписываемся на обновления пользователей в чате
      const chatUsersSub = this.chatSocket.chatUsers$.subscribe((update: ChatUsersUpdate) => {
        if (update.chatId === this.chatId) {
          console.log('[ChatComponent] Chat users update:', update);
          
          // Обновляем список активных пользователей
          this.UsersActive = update.users;
          
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

  private showUserStatusMessage(message: string, type: 'connect' | 'disconnect' | 'leave'): void {
    // Можно показать toast уведомление или добавить системное сообщение в чат
    console.info(`[ChatComponent] ${type.toUpperCase()}: ${message}`);
    
    // Пример добавления системного сообщения в чат
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
      toClientId: null,
    };

    this.messages.push(systemMessage);
    if (this.isAtBottom()) {
      this.scrollToBottomAfterRender();
    }
  }

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
    this.messageService.getMessages(this.chatId).subscribe((messages) => {
      this.messages = messages;
      console.log('Loaded messages:', this.messages);
    });
  }

  sendMessage() {
    const text = this.newMessage.trim();
    if (!text) return;
    if (!this.myId || !this.myName) {
      console.error('User info is missing');
      return;
    }
    if (!this.isConnected) {
      // console.error('Socket not connected');
      // return;
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
      content: text,
      timestamp: new Date().toISOString(),
      reviewed: false,
      type: 'text',
      toClientId: null,
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
      this.myId = user.id;
      this.myName = user.name;
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
}