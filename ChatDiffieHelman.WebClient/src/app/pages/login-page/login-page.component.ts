import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
// import { ApiService } from '../../services/api.service';
// import { HttpClient, HttpHandler } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css'], // Исправлено
})
export class LoginPageComponent implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  uniAuthLoading = false;
  uniAuthError: string | null = null;

  form: FormGroup = new FormGroup({
    email: new FormControl<string | null>(null, [
      Validators.required,
      Validators.email,
    ]),
    password: new FormControl<string | null>(null, Validators.required),
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const token3 = params.get('token3');
      const uniauthError = params.get('uniauthError');

      if (uniauthError) {
        this.uniAuthError = uniauthError;
        this.uniAuthLoading = false;
        return;
      }

      if (!token3?.trim()) {
        this.uniAuthLoading = false;
        return;
      }

      this.uniAuthError = null;
      this.uniAuthLoading = true;

      this.authService.exchangeUniAuthToken3(token3.trim()).subscribe({
        next: (response) => {
          this.uniAuthLoading = false;

          if (response.status === 'OK' && response.access_token) {
            this.authService.setAccessToken(response.access_token);
            this.router.navigateByUrl('/profile', { replaceUrl: true });
            return;
          }

          this.uniAuthError =
            response.reason ||
            'Token 3 недействителен или уже использован. Повторите вход через UniAuth.';
        },
        error: () => {
          this.uniAuthLoading = false;
          this.uniAuthError =
            'Не удалось проверить token3 через backend. Повторите попытку.';
        },
      });
    });
  }

  startUniAuthLogin(): void {
    this.uniAuthError = null;
    this.uniAuthLoading = true;

    this.authService.startUniAuthLogin().subscribe({
      next: (response) => {
        window.location.href = response.redirectUrl;
      },
      error: () => {
        this.uniAuthLoading = false;
        this.uniAuthError =
          'Не удалось начать вход через UniAuth. Повторите попытку.';
      },
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      console.log('Form Submitted', this.form.value);
      //@ts-ignore
      this.authService.login(this.form.value).subscribe(
        (res) => {
          console.log(res.access_token);
          if (!res.fiat_required && !res.bmc_required) {
            this.authService.setAccessToken(res.access_token || '');
            this.router.navigate(['/']);
          } else if (res.fiat_required) {
            console.log(res);
            localStorage.setItem('fiat_session_id', res.fiat_session_id || '');
            this.authService.fiatSessionId = res.fiat_session_id || '';
            this.router.navigate(['/fiat-2fa']);
          } else if (res.bmc_required) {
            localStorage.setItem('bmc_session_id', res.bmc_session_id || '');
            this.router.navigate(['/bmc-2fa']);
          }
        },
        (er: any) => {
          console.log(er);
        },
      );
    } else {
      console.error('Form is invalid');
    }
  }
}
