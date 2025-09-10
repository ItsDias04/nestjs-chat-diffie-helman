import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../../data/Entities/User';
import { ChatsService } from '../../data/services/chats.service';
import { Message } from '../../data/Entities/Message';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent {
// @Input() chatId!: string; // передаётся извне
// @Input() chatName: string | null = null;
@Output() messageSend = new EventEmitter<string>();
chatId!: string;
chatName: string | null = null;
users$!: Observable<User[]>;


// временные локальные сообщения (пока нет сервиса сообщений)
messages: Message[] = [];
newMessage = '';


constructor(private chatsService: ChatsService) {}


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

inviteModalOpen: boolean = false;
openInviteModal() {
this.inviteModalOpen = true;
}
// TODO: заменить на вызов реального сервиса сообщений
loadMockMessages(): void {

}


send(): void {
const text = this.newMessage.trim();
if (!text) return;


// Локально добавляем сообщение в UI (оптимистично)
// const msg: Message = {
// id: String(Date.now()),
// authorId: 'me',
// authorName: 'Вы',
// text,
// time: new Date().toISOString()
// };
// this.messages.push(msg);


// Очищаем поле ввода
this.newMessage = '';


// Эмитируем событие, чтобы родитель мог отправить в бэкенд
this.messageSend.emit(text);
}


trackByMessage(_index: number, item: Message) {
return item.id;
}


trackByUser(_index: number, item: User) {
return item.id;
}
}
