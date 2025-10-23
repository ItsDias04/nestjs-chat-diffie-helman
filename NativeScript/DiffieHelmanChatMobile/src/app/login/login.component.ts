
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { alert } from '@nativescript/core';
import { AuthService } from '../data/auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class LoginComponent {
  username = '';
  password = '';

  constructor(private router: Router, private auth: AuthService) {}

  async onLogin() {
    console.log('Attempting login with', this.username, this.password);
    if (!this.username || !this.password) {
      await alert('Введите логин и пароль');
      return;
    }

    try {
      // Call AuthService.login which will store token in ApplicationSettings on success
      const resp$ = this.auth.login({ email: this.username, password: this.password });
      resp$.subscribe({
        next: async (res) => {
          console.log('Login response', res);
          if (res.access_token) {
            await alert('Вход выполнен');
            // navigate to home after token saved
            this.router.navigate(['/home']);
          } else if (res.fiat_required) {
            await alert('Требуется 2FA');
            // handle 2FA flow if implemented
          } else {
            await alert('Неверные данные');
          }
        },
        error: async (err) => {
          console.error('Login failed', err);
          await alert('Ошибка входа');
        },
      });
    } catch (err) {
      console.error(err);
      await alert('Ошибка при попытке входа');
    }
  }

  onInputChange() {
    console.log('Input changed:', this.username, this.password);
  }
}
