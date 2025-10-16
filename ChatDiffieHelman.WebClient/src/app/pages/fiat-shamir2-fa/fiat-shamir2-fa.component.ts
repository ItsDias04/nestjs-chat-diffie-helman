import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FiatShamirKeys } from '../../helpers/fiat-shamir-setup-data';
import { FiatShamirService } from '../../auth/fiat-shamir.service';

@Component({
  selector: 'app-fiat-shamir2-fa',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './fiat-shamir2-fa.component.html',
  styleUrl: './fiat-shamir2-fa.component.css'
})
export class FiatShamir2FAComponent {
  data: FiatShamirKeys | undefined;
  constructor(private fiatShamirService: FiatShamirService, private router: Router) { }
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      //json reader
      const reader = new FileReader();
      reader.onload = (e) => {
        const contents = e.target?.result;
        console.log('File contents:', contents);
        this.data = JSON.parse(contents as string) as FiatShamirKeys;

        console.log('File contents:', this.data);
      };
      reader.readAsText(file);
    }
  }
  onAuthorize() {
    let sid = localStorage.getItem('fiat_session_id') || '';
    if (!this.data) {
      alert('Please upload your parameters file');
      return;
    }
    this.fiatShamirService.runFullFiatProtocol(sid, this.data).subscribe({
      next: (res) => {
        console.log('Fiat-Shamir login finished:', res);
     
        if ((res as any).access_token) {
          localStorage.removeItem('fiat_session_id');
          localStorage.setItem('token', (res as any).access_token);
      
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        console.error('Fiat-Shamir full protocol failed', err);
        alert('Fiat-Shamir authentication failed');
      }
    });
  }
}
