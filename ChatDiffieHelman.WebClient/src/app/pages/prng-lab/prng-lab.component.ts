import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface LCGResult {
  iteration: number;
  value: number;
  normalized: number;
}

interface LFSRResult {
  iteration: number;
  state: string;
  output: number;
}

@Component({
  selector: 'app-prng-lab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prng-lab.component.html',
  styleUrls: ['./prng-lab.component.css']
})
export class PrngLabComponent {
  // LCG parameters
  lcgSeed: number = 123456789;
  lcgA: number = 1664525;
  lcgC: number = 1013904223;
  lcgM: number = 2 ** 32;
  lcgIterations: number = 10;
  lcgResults: LCGResult[] = [];

  // LFSR parameters
  lfsrSeed: string = '1101';
  lfsrTaps: string = '0,1'; // tap positions (0-indexed from right)
  lfsrIterations: number = 15;
  lfsrResults: LFSRResult[] = [];

  constructor() {}

  // Linear Congruential Generator
  generateLCG() {
    this.lcgResults = [];
    let x = this.lcgSeed;

    for (let i = 0; i < this.lcgIterations; i++) {
      this.lcgResults.push({
        iteration: i,
        value: x,
        normalized: x / this.lcgM
      });
      // X_{n+1} = (a * X_n + c) mod m
      x = (this.lcgA * x + this.lcgC) % this.lcgM;
    }
  }

  // Linear Feedback Shift Register (LFSR)
  generateLFSR() {
    this.lfsrResults = [];
    let state = this.lfsrSeed.split('').map(Number);
    const taps = this.lfsrTaps.split(',').map(t => parseInt(t.trim()));

    // Validate
    if (state.some(bit => bit !== 0 && bit !== 1)) {
      alert('Начальное состояние должно содержать только 0 и 1');
      return;
    }

    if (state.every(bit => bit === 0)) {
      alert('Начальное состояние не может быть все нули');
      return;
    }

    for (let i = 0; i < this.lfsrIterations; i++) {
      this.lfsrResults.push({
        iteration: i,
        state: state.join(''),
        output: state[state.length - 1]
      });

      // Calculate feedback bit using XOR of tapped positions
      let feedback = 0;
      for (const tap of taps) {
        if (tap >= 0 && tap < state.length) {
          feedback ^= state[state.length - 1 - tap];
        }
      }

      // Shift right and insert feedback bit at the left
      state.pop();
      state.unshift(feedback);
    }
  }

  // Helper to get binary representation
  toBinary(num: number, bits: number = 32): string {
    return (num >>> 0).toString(2).padStart(bits, '0');
  }

  // Get period length for LFSR
  getMaxPeriod(): number {
    const n = this.lfsrSeed.length;
    return Math.pow(2, n) - 1;
  }

  // Get period info text
  getPeriodInfo(): string {
    const n = this.lfsrSeed.length;
    const period = Math.pow(2, n) - 1;
    return 'Максимальный период: ' + period;
  }

  // Get LFSR sequence as string
  getLFSRSequence(): string {
    return this.lfsrResults.map(r => r.output).join('');
  }

  // Clear results
  clearLCG() {
    this.lcgResults = [];
  }

  clearLFSR() {
    this.lfsrResults = [];
  }
}
