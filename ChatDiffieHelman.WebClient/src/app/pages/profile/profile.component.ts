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

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FiatSetupModalComponent],
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
  showFiatSetupModal = false;

  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    private fiatShamirService: FiatShamirService,
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

    // Сначала проверяем localStorage
    const cachedUser = this.usersService.getFromLocalStorage();
    if (cachedUser) {
      this.currentUser = cachedUser;
      this.is2FAEnabled = cachedUser.fiatEnabled || false;
      this.updateForm(cachedUser);
      this.isLoading = false;
    }

    // Затем загружаем актуальные данные с сервера
    this.usersService.getMe().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.is2FAEnabled = user.fiat_enabled || false;
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

      // Здесь должен быть HTTP запрос на обновление профиля
      // Так как в ProfileService нет метода update, симулируем сохранение
      const updatedUser: User = {
        ...this.currentUser!,
        name: this.profileForm.value.name,
        email: this.profileForm.value.email,
      };

      // Сохраняем в localStorage (в реальном приложении должен быть API запрос)
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
      // Отключаем 2FA
      if (
        confirm(
          'Вы уверены, что хотите отключить двухфакторную аутентификацию?'
        )
      ) {
        this.disable2FA();
      }
    } else {
      // Включаем 2FA - показываем модал
      this.showFiatSetupModal = true;
    }
  }

  onFiatSetupConfirmed(keys: FiatShamirKeys): void {
    if (!this.currentUser) return;

    this.saveMessage = 'Включение 2FA...';

    // Отправляем публичный ключ v на сервер
    this.fiatShamirService.enableFiatForUser(this.currentUser.id, keys.v.toString(), keys.n.toString());
      // next: () => {
      //   this.is2FAEnabled = true;
      //   this.saveMessage = '✅ Двухфакторная аутентификация успешно включена!';
      //   this.showFiatSetupModal = false;

      //   // Обновляем данные пользователя
      //   if (this.currentUser) {
      //     this.currentUser.fiatEnabled = true;
      //     this.usersService.saveToLocalStorage(this.currentUser);
      //   }

      //   setTimeout(() => {
      //     this.saveMessage = '';
      //   }, 5000);
      // },
      // error: (err) => {
      //   console.error('Error enabling 2FA:', err);
      //   this.saveMessage = '❌ Ошибка включения 2FA. Попробуйте позже.';
      //   setTimeout(() => {
      //     this.saveMessage = '';
      //   }, 3000);
      // },
    // });
  }

  onFiatSetupCancelled(): void {
    this.showFiatSetupModal = false;
    this.is2FAEnabled = false;
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
}