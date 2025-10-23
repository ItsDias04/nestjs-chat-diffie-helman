import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Message } from '../Entities/Message';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private apiUrl = 'http://localhost:3000/messages';

  constructor(private http: HttpClient) {}

  // Получить все сообщения чата
  getMessages(chatId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/${chatId}`);
  }

  // Отправить новое сообщение в чат
  sendMessage(chatId: string, message: Message): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/${chatId}`, message);
  }
}