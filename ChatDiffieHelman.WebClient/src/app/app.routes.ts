import { Routes } from '@angular/router';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { canActivateAuth } from './auth/access.guard';
import { NavigateBarComponent } from './common-ui/navigate-bar/navigate-bar.component';
import { RegistrationComponent } from './pages/registration/registration.component';
import { ChatListComponent } from './pages/chat-list/chat-list.component';
import { ChatComponent } from './pages/chat/chat.component';
import { InvitesListComponent } from './pages/invites-list/invites-list.component';
import { ColumnCipherComponent } from './pages/column-cipher/column-cipher.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { FiatShamir2FAComponent } from './pages/fiat-shamir2-fa/fiat-shamir2-fa.component';
import { Bmc2FAComponent } from './pages/bmc-2fa/bmc-2fa.component';
import { EcdsaLabComponent } from './pages/ecdsa-lab/ecdsa-lab.component';
import { PrngLabComponent } from './pages/prng-lab/prng-lab.component';
import { EcdsaBlockchainComponent } from './pages/ecdsa-blockchain/ecdsa-blockchain.component';
import { LinearAlgebraComponent } from './pages/linear-algebra/linear-algebra.component';

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
     { path: 'profile', component: ProfileComponent},
     { path: 'ecdsa-lab', component: EcdsaLabComponent},
     { path: 'prng-lab', component: PrngLabComponent},
     { path: 'ecdsa-blockchain', component: EcdsaBlockchainComponent},
     { path: 'linear-algebra', component: LinearAlgebraComponent},

    ],
    canActivate: [() => canActivateAuth(undefined)], 
  },
  { path: 'fiat-2fa', component: FiatShamir2FAComponent },
  { path: 'bmc-2fa', component: Bmc2FAComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'registration', component: RegistrationComponent },
];