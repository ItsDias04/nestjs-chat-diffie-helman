import { Component, ElementRef, EventEmitter, Input, NgZone, Output, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../../data/Entities/User';
import { ChatsService } from '../../data/services/chats.service';
import { Message } from '../../data/Entities/Message';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../data/services/users.service';
import { InviteService } from '../../data/services/invite.service';
import { MessageService } from '../../data/services/message.service';
import { ChatSocketService } from '../../data/websockets/ChatSocketService';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLDivElement>;
  private userScrolledUp = false; // true если пользователь отойдет от низа
  private readonly SCROLL_THRESHOLD = 150; // px — что считать «у низа»
  // @Input() chatId!: string; // передаётся извне
  // @Input() chatName: string | null = null;
  @Output() messageSend = new EventEmitter<string>();
  chatId!: string;
  myId: string | undefined;
  myName: string | undefined;
  chatName: string | null = null;
  users$!: Observable<User[]>;

  UsersInChat: User[] = [];

  UsersActive: string[] = [];
  modalUsersOpen: boolean = false;
  // временные локальные сообщения (пока нет сервиса сообщений)
  messages: Message[] = [];
  newMessage = '';
  users: User[] = [];

  constructor(
    private chatsService: ChatsService,
    private usersService: UsersService,
    private invitesService: InviteService,
    private messageService: MessageService,
    private chatSocket: ChatSocketService,
        private ngZone: NgZone,

  ) {}

  ngOnInit(): void {
    this.chatId = window.location.pathname.split('/').pop() || '';
    if (!this.chatId) {
      console.warn('ChatWindowComponent: chatId не задан');
      // Можно получить chatId из маршрута если нужно

      return;
    }

    this.getChat();
    this.loadUsers();
    this.loadMockMessages(); // временно
    this.getMe();
    this.getMessages();


        this.chatSocket.connect({ token: localStorage.getItem('token') || undefined });

    // 2) получаем инфо о себе и регистрируемся на сокете
    this.usersService.getMe().subscribe(me => {
      this.myId = me.id;
      this.myName = me.name;
      this.chatSocket.registerUser(this.myId);

      // сразу подписываемся на сообщения
      this.chatSocket.messages$.subscribe(msg => {
        if (msg.chatId === this.chatId) {
          this.messages.push(msg);
          if (this.isAtBottom()) {
            this.scrollToBottomAfterRender();
            this.userScrolledUp = false;
          }
        }
      });
      this.chatSocket.chatUsers$.subscribe(update => {
        if (update.chatId === this.chatId) {
          this.UsersActive = update.users;
        }
      });

      // входим в комнату чата
      this.chatSocket.joinChat(this.chatId);
    });

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
    // requestAnimationFrame гарантирует, что DOM обновлён
    requestAnimationFrame(() => {
      const el = this.messagesContainer?.nativeElement;
      if (!el) return;
      // Можно использовать smooth или instant. Smooth может не сработать при быстрых обновлениях.
      el.scrollTo({ top: el.scrollHeight, behavior: 'auto' });
    });
  }

  onMediaLoad() {
    // если пользователь был у низа — доскроллим после загрузки картинки
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

    const message: Message = {
      id: '', // ID будет назначен сервером
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
        // this.messages.push(response);
      });
  }
  // import { User } from "./User";

  // export enum DiffieHellmanStage {
  //   PublicKeyExchange = "public_key_exchange",
  //   SharedKeyGenerated = "shared_key_generated",
  //   EncryptedMessage = "encrypted_message",
  //   HandshakeComplete = "handshake_complete"
  // }

  // export enum MessageType {
  //   Text = "text",
  //   Image = "image",
  //   Video = "video",
  //   File = "file",
  //   Audio = "audio",
  //   Encryption = "encryption"
  // }

  // export interface Message {
  //   id: string;
  //   chatId: string;
  //   userId: string;
  //   user: User;
  //   content: string;
  //   timestamp: string; // ISO string
  //   reviewed: boolean;
  //   type: MessageType | string;
  //   dhStage?: DiffieHellmanStage | string;
  //   toClientId: string | null;
  // }

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

  // TODO: заменить на вызов реального сервиса сообщений
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
}
