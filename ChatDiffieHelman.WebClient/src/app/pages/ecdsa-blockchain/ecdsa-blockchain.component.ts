import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as CryptoJS from 'crypto-js';

interface KeyPair {
  privateKey: string;
  publicKey: string;
  address: string;
}

interface Signature {
  r: string;
  s: string;
  v: number;
}

interface Transaction {
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  hash: string;
  signature?: Signature;
  valid?: boolean;
}

@Component({
  selector: 'app-ecdsa-blockchain',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ecdsa-blockchain.component.html',
  styleUrls: ['./ecdsa-blockchain.component.css']
})
export class EcdsaBlockchainComponent implements OnInit {
  // Key Management
  keyPair: KeyPair | null = null;
  showPrivateKey: boolean = false;

  // Transaction Data
  recipientAddress: string = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  transactionAmount: number = 1.5;
  transactionMessage: string = 'Bitcoin payment for services';
  
  // Signature Results
  originalTransaction: Transaction | null = null;
  signedTransaction: Transaction | null = null;
  verificationResult: boolean | null = null;
  
  // Modified Transaction Test
  modifiedMessage: string = '';
  modifiedTransaction: Transaction | null = null;
  modifiedVerificationResult: boolean | null = null;

  // Educational
  currentStep: number = 1;
  showTheory: boolean = false;

  // History
  transactionHistory: Transaction[] = [];

  // Blockchain Network
  selectedNetwork: string = 'Bitcoin (secp256k1)';
  networks = ['Bitcoin (secp256k1)', 'Ethereum (secp256k1 + Keccak-256)'];

  constructor() {}

  ngOnInit(): void {
    this.loadFromLocalStorage();
  }

  // ============= STEP 1: Key Generation =============
  generateKeyPair(): void {
    // Simplified key generation (for demonstration)
    // In real implementation, use proper elliptic curve library
    const privateKeyBytes = CryptoJS.lib.WordArray.random(32);
    const privateKey = privateKeyBytes.toString(CryptoJS.enc.Hex);
    
    // Generate public key (simplified - in reality use EC point multiplication)
    const publicKeyHash = CryptoJS.SHA256(privateKey);
    const publicKey = '04' + publicKeyHash.toString(CryptoJS.enc.Hex).substring(0, 128);
    
    // Generate address
    let address: string;
    if (this.selectedNetwork.includes('Ethereum')) {
      // Ethereum-style address (Keccak-256)
      const addressHash = CryptoJS.SHA256(publicKey).toString(CryptoJS.enc.Hex);
      address = '0x' + addressHash.substring(addressHash.length - 40);
    } else {
      // Bitcoin-style address (simplified)
      const pubKeyHash = CryptoJS.SHA256(publicKey).toString(CryptoJS.enc.Hex);
      const addressHash = CryptoJS.RIPEMD160(CryptoJS.enc.Hex.parse(pubKeyHash));
      address = '1' + addressHash.toString(CryptoJS.enc.Base64).substring(0, 33);
    }

    this.keyPair = {
      privateKey: privateKey,
      publicKey: publicKey,
      address: address
    };

    this.saveToLocalStorage();
    this.currentStep = 2;
  }

  togglePrivateKeyVisibility(): void {
    this.showPrivateKey = !this.showPrivateKey;
  }

  copyToClipboard(text: string, type: string): void {
    navigator.clipboard.writeText(text).then(() => {
      alert(`${type} скопирован в буфер обмена!`);
    });
  }

  // ============= STEP 2: Create Transaction =============
  createTransaction(): void {
    if (!this.keyPair) {
      alert('Сначала сгенерируйте пару ключей!');
      return;
    }

    const timestamp = Date.now();
    const transactionData = {
      from: this.keyPair.address,
      to: this.recipientAddress,
      amount: this.transactionAmount,
      timestamp: timestamp,
      message: this.transactionMessage
    };

    const transactionString = JSON.stringify(transactionData);
    const hash = CryptoJS.SHA256(transactionString).toString(CryptoJS.enc.Hex);

    this.originalTransaction = {
      from: transactionData.from,
      to: transactionData.to,
      amount: transactionData.amount,
      timestamp: timestamp,
      hash: hash
    };

    this.currentStep = 3;
  }

  // ============= STEP 3: Sign Transaction =============
  signTransaction(): void {
    if (!this.originalTransaction || !this.keyPair) {
      alert('Сначала создайте транзакцию!');
      return;
    }

    // Simplified ECDSA signature (for demonstration)
    // In real implementation, use proper ECDSA signing with secp256k1
    const messageHash = this.originalTransaction.hash;
    const privateKey = this.keyPair.privateKey;

    // Generate signature components (simplified)
    const k = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
    const rHash = CryptoJS.SHA256(k + messageHash).toString(CryptoJS.enc.Hex);
    const r = rHash.substring(0, 64);
    
    const sInput = messageHash + privateKey + r;
    const s = CryptoJS.SHA256(sInput).toString(CryptoJS.enc.Hex).substring(0, 64);
    
    const v = parseInt(r.substring(0, 2), 16) % 2 === 0 ? 27 : 28;

    const signature: Signature = { r, s, v };

    this.signedTransaction = {
      ...this.originalTransaction,
      signature: signature,
      valid: true
    };

    this.transactionHistory.unshift({...this.signedTransaction});
    this.saveToLocalStorage();
    this.currentStep = 4;
  }

  // ============= STEP 4: Verify Signature =============
  verifySignature(): void {
    if (!this.signedTransaction || !this.keyPair) {
      alert('Сначала подпишите транзакцию!');
      return;
    }

    // Simplified verification
    // In real implementation, use proper ECDSA verification
    const signature = this.signedTransaction.signature;
    const messageHash = this.signedTransaction.hash;
    const publicKey = this.keyPair.publicKey;

    if (!signature) {
      this.verificationResult = false;
      return;
    }

    // Verify by re-computing and comparing
    const verificationHash = CryptoJS.SHA256(
      messageHash + publicKey + signature.r
    ).toString(CryptoJS.enc.Hex).substring(0, 64);

    this.verificationResult = verificationHash === signature.s;
    this.currentStep = 5;
  }

  // ============= STEP 5: Test Modified Transaction =============
  createModifiedTransaction(): void {
    if (!this.signedTransaction || !this.keyPair) {
      alert('Сначала создайте и подпишите оригинальную транзакцию!');
      return;
    }

    const modifiedData = {
      from: this.signedTransaction.from,
      to: this.signedTransaction.to,
      amount: this.signedTransaction.amount,
      timestamp: this.signedTransaction.timestamp,
      message: this.modifiedMessage || this.transactionMessage + ' [MODIFIED]'
    };

    const modifiedString = JSON.stringify(modifiedData);
    const modifiedHash = CryptoJS.SHA256(modifiedString).toString(CryptoJS.enc.Hex);

    this.modifiedTransaction = {
      ...this.signedTransaction,
      hash: modifiedHash
    };
  }

  verifyModifiedTransaction(): void {
    if (!this.modifiedTransaction || !this.keyPair) {
      alert('Сначала создайте модифицированную транзакцию!');
      return;
    }

    const signature = this.modifiedTransaction.signature;
    const messageHash = this.modifiedTransaction.hash;
    const publicKey = this.keyPair.publicKey;

    if (!signature) {
      this.modifiedVerificationResult = false;
      return;
    }

    const verificationHash = CryptoJS.SHA256(
      messageHash + publicKey + signature.r
    ).toString(CryptoJS.enc.Hex).substring(0, 64);

    this.modifiedVerificationResult = verificationHash === signature.s;
  }

  // ============= Utility Functions =============
  resetAll(): void {
    if (confirm('Вы уверены, что хотите сбросить все данные?')) {
      this.keyPair = null;
      this.originalTransaction = null;
      this.signedTransaction = null;
      this.verificationResult = null;
      this.modifiedTransaction = null;
      this.modifiedVerificationResult = null;
      this.currentStep = 1;
      this.transactionHistory = [];
      localStorage.removeItem('ecdsa-blockchain-data');
    }
  }

  formatHash(hash: string, length: number = 16): string {
    if (!hash) return '';
    if (hash.length <= length * 2) return hash;
    return hash.substring(0, length) + '...' + hash.substring(hash.length - length);
  }

  formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleString('ru-RU');
  }

  getNetworkInfo(): string {
    if (this.selectedNetwork.includes('Bitcoin')) {
      return 'Bitcoin использует кривую secp256k1 с SHA-256 для хэширования';
    } else {
      return 'Ethereum использует кривую secp256k1 с Keccak-256 для хэширования';
    }
  }

  saveToLocalStorage(): void {
    const data = {
      keyPair: this.keyPair,
      transactionHistory: this.transactionHistory,
      selectedNetwork: this.selectedNetwork
    };
    localStorage.setItem('ecdsa-blockchain-data', JSON.stringify(data));
  }

  loadFromLocalStorage(): void {
    const stored = localStorage.getItem('ecdsa-blockchain-data');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.keyPair = data.keyPair || null;
        this.transactionHistory = data.transactionHistory || [];
        this.selectedNetwork = data.selectedNetwork || this.selectedNetwork;
      } catch (e) {
        console.error('Error loading from localStorage:', e);
      }
    }
  }

  exportTransaction(transaction: Transaction): void {
    const dataStr = JSON.stringify(transaction, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transaction-${transaction.timestamp}.json`;
    link.click();
  }

  // Educational Methods
  toggleTheory(): void {
    this.showTheory = !this.showTheory;
  }

  goToStep(step: number): void {
    this.currentStep = step;
  }
}
