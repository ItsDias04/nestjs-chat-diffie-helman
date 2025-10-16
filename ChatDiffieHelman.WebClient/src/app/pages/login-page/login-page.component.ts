
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { ApiService } from '../../services/api.service';
// import { HttpClient, HttpHandler } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css'] // Исправлено
})
export class LoginPageComponent {
  authService = inject(AuthService);
  router = inject(Router);
  
  form: FormGroup = new FormGroup({
    email: new FormControl<string | null>(null, [Validators.required, Validators.email]),
    password: new FormControl<string | null>(null, Validators.required),
  })

  onSubmit(): void {

    if (this.form.valid) {
      console.log('Form Submitted', this.form.value);
      //@ts-ignore
      this.authService.login(this.form.value).subscribe((res) => {
        console.log(res.access_token);
        if (!res.fiat_required && !res.bmc_required) {
          this.authService.token = { access_token: res.access_token || ''};
          localStorage.setItem('token', res.access_token || '');
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
      }, (er: any) => {
        console.log(er);
      });


    } else {
      console.error('Form is invalid');
    }
  }
}
