import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, tap, throwError } from 'rxjs';
import { TokenResponse } from '../auth/auth.interface';
import { CookieService } from 'ngx-cookie-service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  token: TokenResponse | null = null;
  role: string | null = null;
  // cookieService = inject(CookieService);
  // http: HttpClient = inject(HttpClient);
  // router = inject(Router);
  constructor(private cookieService: CookieService, private http: HttpClient, private router: Router) { }
  baseApiUrl = 'http://localhost:3000';
  urlLogin = `${this.baseApiUrl}/auth`;
  urlRegister = `${this.baseApiUrl}/users`;
  get Role() {
    return localStorage.getItem('role');
  }

  get isAuth() {
    if (!this.token) {
      const token = localStorage.getItem('token');

      if (token) {
        this.token = { access_token: token};
      }
    }
    return !!this.token;
  }

  login(payload: { email: string; password: string }) {
    return this.http.post<TokenResponse>(`${this.urlLogin}/login`, payload).pipe(
      tap((res) => {
        console.log(res);
        this.token = res;
        localStorage.setItem('token', res.access_token);
  
      }),
      catchError((error) => {
        console.error('Login failed', error);
        return throwError(() => new Error('Login failed'));
        })
      );
  }

  register(payload: { username: string; email: string; password: string}) {
    return this.http.post<TokenResponse>(`${this.urlRegister}/registration`, payload).pipe(
      tap((res) => {
        this.token = res;
        localStorage.setItem('token', res.access_token);
      }),
      catchError((error) => {
        console.error('Registration failed', error);
        return throwError(() => new Error('Registration failed'));
      })
    );
  }

  logout() {
    this.token = null;
    this.cookieService.deleteAll();
    this.router.navigate(['/login']);
  }
}
