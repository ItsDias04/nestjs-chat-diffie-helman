import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UsersService } from '../../data/services/users.service';
import { User } from '../../data/Entities/User';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { FiatSetupModalComponent } from '../../pages/fiat-setup-modal/fiat-setup-modal.component';
import { FiatShamirKeys } from '../../helpers/fiat-shamir-setup-data';
import { FiatShamirService } from '../../auth/fiat-shamir.service';
import { BmcSetupModalComponent } from '../../pages/bmc-setup-modal/bmc-setup-modal.component';
import { BmcServiceClient } from '../../auth/bmc.service';
import { BmcKeys } from '../../helpers/bmc-setup-data';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FiatSetupModalComponent, BmcSetupModalComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;
  profileForm: FormGroup;
  isEditMode = false;
  saveMessage = '';
  isLoading = true;
  errorMessage = '';
  is2FAEnabled: boolean = false;
  isBmcEnabled: boolean = false;
  showFiatSetupModal = false;
  showBmcSetupModal = false;

  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  private fiatShamirService: FiatShamirService,
  private bmcService: BmcServiceClient,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';

    
    const cachedUser = this.usersService.getFromLocalStorage();
    if (cachedUser) {
      this.currentUser = cachedUser;
  this.is2FAEnabled = cachedUser.fiat_enabled || false;
  this.isBmcEnabled = cachedUser.bmc_enabled || false;
      this.updateForm(cachedUser);
      this.isLoading = false;
    }

    this.usersService.getMe().subscribe({
      next: (user) => {
        this.currentUser = user;
  this.is2FAEnabled = user.fiat_enabled || false;
  this.isBmcEnabled = user.bmc_enabled || false;
        this.updateForm(user);
        this.usersService.saveToLocalStorage(user);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading profile:', err);
        this.errorMessage =
          'Не удалось загрузить профиль. Пожалуйста, попробуйте позже.';
        this.isLoading = false;
      },
    });
  }

  updateForm(user: User): void {
    this.profileForm.patchValue({
      name: user.name,
      email: user.email,
    });
  }

  toggleEditMode(): void {
    if (this.isEditMode) {
      // Отменяем редактирование - восстанавливаем данные
      if (this.currentUser) {
        this.updateForm(this.currentUser);
      }
    }
    this.isEditMode = !this.isEditMode;
    this.saveMessage = '';
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.saveMessage = 'Сохранение...';

      const updatedUser: User = {
        ...this.currentUser!,
        name: this.profileForm.value.name,
        email: this.profileForm.value.email,
      };

      this.usersService.saveToLocalStorage(updatedUser);
      this.currentUser = updatedUser;

      this.saveMessage = 'Профиль успешно обновлён!';
      this.isEditMode = false;

      setTimeout(() => {
        this.saveMessage = '';
      }, 3000);
    }
  }
  

  getInitials(): string {
    if (!this.currentUser?.name) return '?';
    const names = this.currentUser.name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return this.currentUser.name[0].toUpperCase();
  }

  goToChats(): void {
    this.router.navigate(['/chats']);
  }

  toggle2FA(): void {
    if (!this.currentUser) return;

    if (this.is2FAEnabled) {
    
      if (
        confirm(
          'Вы уверены, что хотите отключить двухфакторную аутентификацию?'
        )
      ) {
        this.disable2FA();
      }
    } else {
      
      if (this.isBmcEnabled) {
        alert('Сначала отключите BMC 2FA, затем включите Fiat-Shamir.');
        return;
      }
      this.showFiatSetupModal = true;
    }
  }

  toggleBMC(): void {
    if (!this.currentUser) return;
    if (this.isBmcEnabled) {
      if (confirm('Вы уверены, что хотите отключить BMC 2FA?')) {
        this.disableBMC();
      }
    } else {
  
      if (this.is2FAEnabled) {
        alert('Сначала отключите Fiat-Shamir 2FA, затем включите BMC.');
        return;
      }
      this.showBmcSetupModal = true;
    }
  }

  onFiatSetupConfirmed(keys: FiatShamirKeys): void {
    if (!this.currentUser) return;


    this.fiatShamirService.enableFiatForUser(this.currentUser.id, keys.v.toString(), keys.n.toString())
      .subscribe( () => {
          this.is2FAEnabled = true;
          this.saveMessage = '✅ Двухфакторная аутентификация успешно включена!';
          this.showFiatSetupModal = false;
        
          if (this.currentUser) {
            this.currentUser.fiat_enabled = true;
            this.usersService.saveToLocalStorage(this.currentUser);
          }
        },
        
      );
  }

  onFiatSetupCancelled(): void {
    this.showFiatSetupModal = false;
    this.is2FAEnabled = false;
  }

  onBmcSetupConfirmed(keys: BmcKeys): void {
    if (!this.currentUser) return;
    this.saveMessage = 'Включение BMC 2FA...';
    // send public parameters to server
    this.bmcService.enableBmcForUser(this.currentUser.id, keys.n, keys.g, keys.y).subscribe({
      next: () => {
        this.isBmcEnabled = true;
        this.showBmcSetupModal = false;
        this.saveMessage = '✅ BMC 2FA успешно включена!';
        this.currentUser!.bmc_enabled = true;
        this.usersService.saveToLocalStorage(this.currentUser!);
      },
      error: () => {
        this.saveMessage = '❌ Ошибка включения BMC 2FA';
      }
    });
  }

  onBmcSetupCancelled(): void {
    this.showBmcSetupModal = false;
    this.isBmcEnabled = false;
  }

  private disable2FA(): void {
    if (!this.currentUser) return;

    this.saveMessage = 'Отключение 2FA...';

    this.fiatShamirService.disableFiatForUser(this.currentUser.id).subscribe({
      next: () => {
        this.is2FAEnabled = false;
        this.saveMessage = 'Двухфакторная аутентификация отключена';

        // Обновляем данные пользователя
        if (this.currentUser) {
          this.currentUser.fiat_enabled = false;
          this.usersService.saveToLocalStorage(this.currentUser);
        }

        setTimeout(() => {
          this.saveMessage = '';
        }, 3000);
      },
      error: (err) => {
        console.error('Error disabling 2FA:', err);
        this.saveMessage = '❌ Ошибка отключения 2FA. Попробуйте позже.';
        setTimeout(() => {
          this.saveMessage = '';
        }, 3000);
      },
    });
  }

  private disableBMC(): void {
    if (!this.currentUser) return;
    this.saveMessage = 'Отключение BMC 2FA...';
    this.bmcService.disableBmcForUser(this.currentUser.id).subscribe({
      next: () => {
        this.isBmcEnabled = false;
        if (this.currentUser) {
          this.currentUser.bmc_enabled = false;
          this.usersService.saveToLocalStorage(this.currentUser);
        }
        this.saveMessage = 'BMC 2FA отключена';
      },
      error: () => {
        this.saveMessage = '❌ Ошибка отключения BMC 2FA';
      },
    });
  }
}