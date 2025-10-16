import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { BmcServiceClient } from '../../auth/bmc.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bmc-2fa',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './bmc-2fa.component.html',
  styleUrl: './bmc-2fa.component.css'
})
export class Bmc2FAComponent {
  data: any | undefined;
  constructor(private bmcService: BmcServiceClient, private router: Router) {}

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const contents = e.target?.result as string;
      try { this.data = JSON.parse(contents); } catch {}
    };
    reader.readAsText(file);
  }

  onAuthorize() {
    const sid = localStorage.getItem('bmc_session_id') || '';
    if (!this.data) { alert('Загрузите файл параметров BMC'); return; }
    this.bmcService
      .runFullBmcProtocol(sid, this.data.n, this.data.g, this.data.y, this.data.x)
      .subscribe({
        next: (res) => {
          if ((res as any).access_token) {
            localStorage.removeItem('bmc_session_id');
            localStorage.setItem('token', (res as any).access_token);
            this.router.navigate(['/']);
          }
        },
        error: () => alert('BMC аутентификация не удалась'),
      });
  }
}
