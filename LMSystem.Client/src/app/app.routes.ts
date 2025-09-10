import { Routes } from '@angular/router';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { canActivateAuth } from './auth/access.guard';
import { NavigateBarComponent } from './common-ui/navigate-bar/navigate-bar.component';
import { RegistrationComponent } from './pages/registration/registration.component';
import { ChatListComponent } from './pages/chat-list/chat-list.component';
import { ChatComponent } from './pages/chat/chat.component';

export const routes: Routes = [
  {
    path: '',
    component: NavigateBarComponent,
    children: [
      // path: '',
     { path: 'chats', component: ChatListComponent},
     { path: 'chat/:id', component: ChatComponent},
    ],
    canActivate: [() => canActivateAuth(undefined)], 
  },
  { path: 'login', component: LoginPageComponent },
  { path: 'registration', component: RegistrationComponent },
];