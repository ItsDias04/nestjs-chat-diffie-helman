import { Routes } from '@angular/router';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { canActivateAuth } from './auth/access.guard';
import { NavigateBarComponent } from './common-ui/navigate-bar/navigate-bar.component';
import { RegistrationComponent } from './pages/registration/registration.component';
import { ChatListComponent } from './pages/chat-list/chat-list.component';
import { ChatComponent } from './pages/chat/chat.component';
import { InvitesListComponent } from './pages/invites-list/invites-list.component';
import { ColumnCipherComponent } from './pages/column-cipher/column-cipher.component';

export const routes: Routes = [
  {
    path: '',
    component: NavigateBarComponent,
    children: [
      // path: '',
     { path: 'chats', component: ChatListComponent},
     { path: 'chat/:id', component: ChatComponent},
     { path: 'invites', component: InvitesListComponent},
     { path: 'column-cipher', component: ColumnCipherComponent},
    ],
    canActivate: [() => canActivateAuth(undefined)], 
  },
  { path: 'login', component: LoginPageComponent },
  { path: 'registration', component: RegistrationComponent },
];