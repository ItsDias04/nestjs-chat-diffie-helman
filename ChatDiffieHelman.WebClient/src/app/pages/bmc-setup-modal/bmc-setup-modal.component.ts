import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BmcKeys } from '../../helpers/bmc-setup-data';
import { exportBmcKeysToFile, formatBmcKeys, generateBmcKeys } from '../../helpers/bmc-utils';

@Component({
  selector: 'app-bmc-setup-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bmc-setup-modal.component.html',
  styleUrls: ['./bmc-setup-modal.component.css'],
})
export class BmcSetupModalComponent {
  @Input() userId: string = '';
  @Output() confirmed = new EventEmitter<BmcKeys>();
  @Output() cancelled = new EventEmitter<void>();

  keys: BmcKeys | null = null;
  step: 'generate' | 'download' | 'confirm' = 'generate';
  downloaded = false;

  generate() {
    this.keys = generateBmcKeys(this.userId);
    this.step = 'download';
  }
  download() {
    if (!this.keys) return;
    exportBmcKeysToFile(this.keys);
    this.downloaded = true;
    this.step = 'confirm';
  }
  formatted() {
    return this.keys ? formatBmcKeys(this.keys) : '';
  }
  confirm() {
    if (this.keys && this.downloaded) this.confirmed.emit(this.keys);
  }
  cancel() {
    this.cancelled.emit();
  }
}
