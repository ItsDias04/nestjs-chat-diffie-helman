import { Component, inject } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-registration',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.css'
})
export class RegistrationComponent {
authService = inject(AuthService);
  router = inject(Router);
  
  form: FormGroup = new FormGroup({
    email: new FormControl<string | null>(null, [Validators.required, Validators.email]),
    username: new FormControl<string | null>(null, Validators.required),
    password: new FormControl<string | null>(null, Validators.required),
  })

  onSubmit(): void {

    if (this.form.valid) {
      console.log('Form Submitted', this.form.value);
      //@ts-ignore
      this.authService.register(this.form.value).subscribe((res) => {
        console.log(res.access_token);
      //   if (res.role == "tutor"){
      //     this.router.navigate(['/tutor/profile']);
      // } else {
      //   this.router.navigate(['/student/profile']);
      // }
      this.router.navigate(['/login']);
      }, (er: any) => {
        console.log(er);
      });


    } else {
      console.error('Form is invalid');
    }
  }
}
