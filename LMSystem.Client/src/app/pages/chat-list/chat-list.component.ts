import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Chat } from '../../data/Entities/Chat';
import { ChatsService } from '../../data/services/chats.service';
import { FormsModule, NgModel } from '@angular/forms';

@Component({
  selector: 'app-chat-list',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.css'
})
export class ChatListComponent {
chats: Chat[] = [];
newChatName: string = '';
  constructor(private chatsService: ChatsService) {}
  ngOnInit(): void {
    this.chatsService.getMyChats().subscribe((chats) => {
      this.chats = chats;
    });
  }

  createChat() {
    this.chatsService.createChat(this.newChatName).subscribe((chat) => {
      this.chats.push(chat);
      this.closeModal();
    });
  }
  modalOpen: boolean = false;

  openModal() {
    this.modalOpen = true;
  }
  closeModal() {
    this.modalOpen = false;
  }
}
