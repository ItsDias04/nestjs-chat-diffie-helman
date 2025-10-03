import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Chat } from '../../data/Entities/Chat';
import { ChatsService } from '../../data/services/chats.service';
import { FormsModule, NgModel } from '@angular/forms';
import { InviteService } from '../../data/services/invite.service';
import { User } from '../../data/Entities/User';
import { UsersService } from '../../data/services/users.service';

@Component({
  selector: 'app-chat-list',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.css'
})
export class ChatListComponent {
chats: Chat[] = [];
newChatName: string = '';

  modalUsersOpen: boolean = false;

  users:User[] = [];
  

  constructor(
    private chatsService: ChatsService, 
 
  ) {}
  ngOnInit(): void {
    this.chatsService.getMyChats().subscribe((chats) => {
      this.chats = chats;
    });

  }
  // openUsersModal() {
  //   this.modalUsersOpen = true;
  //   this.usersService.getAllUsers().subscribe((users) => {
  //     this.users = users;
  //   });
  // }
  closeUsersModal() {
    this.modalUsersOpen = false;
  }
  // sendInvite(chatId: string, userReceiverId: string) {
  //   this.inviteService.sendInvite({chatId, userReceiverId}).subscribe();
  // }
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
