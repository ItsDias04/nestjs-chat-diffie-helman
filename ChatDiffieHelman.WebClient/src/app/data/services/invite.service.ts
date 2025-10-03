import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Invite } from '../Entities/Invite';


export interface InviteCreateDto {
  chatId: string;
  userReceiverId: string;
}

export interface InviteRespondDto {
  inviteId: string;
  accept: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class InviteService {
  private apiUrl = 'http://localhost:3000/invites';

  constructor(private http: HttpClient) {}

  // Получить все приглашения пользователя
  getMyInvites(): Observable<Invite[]> {
    return this.http.get<Invite[]>(`${this.apiUrl}`);
  }

  // Отправить приглашение
  sendInvite(data: InviteCreateDto): Observable<Invite> {
    return this.http.post<Invite>(`${this.apiUrl}/create/`, data);
  }

  // Ответить на приглашение (принять/отклонить)
  respondToInvite(data: InviteRespondDto): Observable<Invite> {
    return this.http.post<Invite>(`${this.apiUrl}/respond/`, data);
  }
}