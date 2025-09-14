import { Injectable } from '@nestjs/common';

@Injectable()
export class ActiveUsersService {
  // userId -> socketId
  private userSockets = new Map<string, string>();

  // chatId -> Set<userId>
  private chatUsers = new Map<string, Set<string>>();

  // userId -> Set<chatId> - для отслеживания в каких чатах находится пользователь
  private userChats = new Map<string, Set<string>>();

  addUser(userId: string, socketId: string) {
    this.userSockets.set(userId, socketId);
  }

  removeUser(socketId: string) {
    let removedUser: string | null = null;

    for (const [userId, id] of this.userSockets.entries()) {
      if (id === socketId) {
        this.userSockets.delete(userId);
        removedUser = userId;
        break;
      }
    }

    if (removedUser) {
      // удалить юзера из всех чатов
      for (const users of this.chatUsers.values()) {
        users.delete(removedUser);
      }
      
      // очистить информацию о чатах пользователя
      this.userChats.delete(removedUser);
    }
  }

  addUserToChat(chatId: string, userId: string) {
    // Добавляем пользователя в чат
    if (!this.chatUsers.has(chatId)) {
      this.chatUsers.set(chatId, new Set());
    }
    if (this.chatUsers.get(chatId)) {
      this.chatUsers.get(chatId)!.add(userId);
    }

    // Добавляем чат к пользователю
    if (!this.userChats.has(userId)) {
      this.userChats.set(userId, new Set());
    }
    this.userChats.get(userId)!.add(chatId);
  }

  removeUserFromChat(chatId: string, userId: string) {
    // Удаляем пользователя из чата
    const chatUserSet = this.chatUsers.get(chatId);
    if (chatUserSet) {
      chatUserSet.delete(userId);
      
      // Если в чате не осталось пользователей, удаляем чат
      if (chatUserSet.size === 0) {
        this.chatUsers.delete(chatId);
      }
    }

    // Удаляем чат у пользователя
    const userChatSet = this.userChats.get(userId);
    if (userChatSet) {
      userChatSet.delete(chatId);
      
      // Если у пользователя не осталось чатов, удаляем запись
      if (userChatSet.size === 0) {
        this.userChats.delete(userId);
      }
    }
  }

  getActiveUsersInChat(chatId: string): string[] {
    return Array.from(this.chatUsers.get(chatId) ?? []);
  }

  getUserChats(userId: string | undefined): string[] {
    if (!userId) return [];
    return Array.from(this.userChats.get(userId) ?? []);
  }

  getSocketId(userId: string): string | undefined {
    return this.userSockets.get(userId);
  }
}