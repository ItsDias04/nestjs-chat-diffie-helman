import { Chat } from "./Chat";
import { User } from "./User";

export interface Invite {
  id: string;
  chatId: string;
  chat: Chat;
  userSenderId: string;
  userSender: User;
  userReceiverId: string | null;
    userReceiver: User | null;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}