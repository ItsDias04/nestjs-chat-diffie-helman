import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FiatShamirKeys } from '../../helpers/fiat-shamir-setup-data';
import {
  exportKeysToFile,
  formatKeysForDisplay,
  generateFiatShamirKeys,
} from '../../helpers/fiat-shamir-utils';

@Component({
  selector: 'app-fiat-setup-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fiat-setup-modal.component.html',
  styleUrls: ['./fiat-setup-modal.component.css'],
})
export class FiatSetupModalComponent {
  @Input() userId: string = '';
  @Output() confirmed = new EventEmitter<FiatShamirKeys>();
  @Output() cancelled = new EventEmitter<void>();

  keys: FiatShamirKeys | null = null;
  currentStep: 'generate' | 'download' | 'confirm' = 'generate';
  hasDownloaded = false;

  generateKeys(): void {
    this.keys = generateFiatShamirKeys(this.userId);
    this.currentStep = 'download';
  }

  downloadKeys(): void {
    if (!this.keys) return;
    exportKeysToFile(this.keys);
    this.hasDownloaded = true;
    this.currentStep = 'confirm';
  }

  getFormattedKeys(): string {
    return this.keys ? formatKeysForDisplay(this.keys) : '';
  }

  confirmSetup(): void {
    if (this.keys && this.hasDownloaded) {
      this.confirmed.emit(this.keys);
    }
  }

  cancel(): void {
    this.cancelled.emit();
  }

  copyToClipboard(): void {
    if (!this.keys) return;
    navigator.clipboard.writeText(this.getFormattedKeys()).then(
      () => {
        alert('Ключи скопированы в буфер обмена!');
      },
      (err) => {
        console.error('Ошибка копирования:', err);
      }
    );
  }
}