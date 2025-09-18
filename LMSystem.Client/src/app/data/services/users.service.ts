import { Injectable } from "@angular/core";
import { User } from "../Entities/User";
import { HttpClient } from "@angular/common/http";


@Injectable({
  providedIn: 'root'
})
export class UsersService {
 private apiUrl = 'http://localhost:3000/users';


  constructor( private http: HttpClient) { }

    getAllUsers() {
      return this.http.get<User[]>(`${this.apiUrl}/all`);
    }
      getMe() {
    return this.http.get<User>(`${this.apiUrl}/me`);
  }

  saveToLocalStorage(user: User) {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }
  getFromLocalStorage() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }
}