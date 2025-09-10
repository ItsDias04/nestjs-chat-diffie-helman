
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { ApiService } from '../../services/api.service';
// import { HttpClient, HttpHandler } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-login-page',
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
      //   if (res.role == "tutor"){
      //     this.router.navigate(['/tutor/profile']);
      // } else {
      //   this.router.navigate(['/student/profile']);
      // }
       this.router.navigate(['/']); 
      }, (er: any) => {
        console.log(er);
      });


    } else {
      console.error('Form is invalid');
    }
  }
}
