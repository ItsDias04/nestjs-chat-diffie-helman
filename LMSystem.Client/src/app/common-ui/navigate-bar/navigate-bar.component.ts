import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-navigate-bar',
  imports: [RouterOutlet, CommonModule, RouterLink],
  templateUrl: './navigate-bar.component.html',
  styleUrl: './navigate-bar.component.css'
})
export class NavigateBarComponent {
  auth = inject(AuthService);
  router = inject(Router);
  role: string = '';
  constructor () {  
    this.role = this.auth.Role!;
  }
  
  logout() {
    this.auth.logout();
    
  }
}
