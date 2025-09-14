import { Injectable } from '@nestjs/common';

@Injectable()
export class ActiveUsersService {
  // userId -> socketId
  private userSockets = new Map<string, string>();

  // chatId -> Set<userId>
  private chatUsers = new Map<string, Set<string>>();

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
    }
  }

  addUserToChat(chatId: string, userId: string) {
    if (!this.chatUsers.has(chatId)) {
      this.chatUsers.set(chatId, new Set());
    }
    if (this.chatUsers.get(chatId)) {
      this.chatUsers.get(chatId)!.add(userId);
    }
  }

  getActiveUsersInChat(chatId: string): string[] {
    return Array.from(this.chatUsers.get(chatId) ?? []);
  }

  getSocketId(userId: string): string | undefined {
    return this.userSockets.get(userId);
  }
}
