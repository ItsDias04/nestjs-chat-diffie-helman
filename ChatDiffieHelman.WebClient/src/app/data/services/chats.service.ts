import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Chat } from '../Entities/Chat';
import { User } from '../Entities/User';


@Injectable({
  providedIn: 'root'
})
export class ChatsService {
  private apiUrl = 'http://localhost:3000/chats';

  constructor(private http: HttpClient) {}

  getMyChats(): Observable<Chat[]> {
    return this.http.get<Chat[]>(`${this.apiUrl}`);
  }

  getChat(chatId: string): Observable<Chat | null> {
    return this.http.get<Chat>(`${this.apiUrl}/${chatId}`);
  }

  getChatUsers(chatId: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/${chatId}/users`);
  }

  createChat(name: string): Observable<Chat> {
    return this.http.post<Chat>(`${this.apiUrl}`, { name });
  }
}