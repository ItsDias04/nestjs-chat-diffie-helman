import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { CommonModule } from '@angular/common';
import { User } from '../../data/Entities/User';
import { UsersService } from '../../data/services/users.service';


@Component({
  selector: 'app-navigate-bar',
  imports: [RouterOutlet, CommonModule, RouterLink],
  templateUrl: './navigate-bar.component.html',
  styleUrl: './navigate-bar.component.css'
})
export class NavigateBarComponent implements OnInit {
  auth = inject(AuthService);
  router = inject(Router);
  role: string = '';
  constructor (private usersService: UsersService) {
    
  
    this.role = this.auth.Role!;
  }
  currentUser: User | undefined;

  ngOnInit() {
    this.getMe();
  }
  // get CurrentUser() {
    // return this.auth.getFromLocalStorage();
  // }
  getMe (){
    this.usersService.getMe().subscribe((user) => {
      this.currentUser = user;
      this.usersService.saveToLocalStorage(user);
    });
  }
  
  logout() {
    this.auth.logout();
    
  }
}
