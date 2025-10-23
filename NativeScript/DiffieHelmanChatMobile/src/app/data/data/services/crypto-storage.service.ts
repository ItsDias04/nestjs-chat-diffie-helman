// crypto-storage.service.ts
import { Injectable } from '@angular/core';

interface StoredKeyData {
  keyId: string;
  sharedSecret: string;
  timestamp: number;
  chatId?: string;
  participants?: string[];
}

interface KeyMetadata {
  keyId: string;
  created: Date;
  chatId?: string;
  participants?: string[];
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CryptoStorageService {
  private readonly STORAGE_PREFIX = 'dh_key_';
  private readonly METADATA_KEY = 'dh_keys_metadata';
  private readonly MAX_KEY_AGE_MS = 24 * 60 * 60 * 1000; // 24 часа

  constructor() {
    // Очищаем устаревшие ключи при инициализации
    this.cleanupExpiredKeys();
  }

  /**
   * Сохранение общего секрета с метаданными
   */
  storeSharedSecret(
    keyId: string, 
    sharedSecret: string, 
    chatId?: string, 
    participants?: string[]
  ): boolean {
    try {
      const keyData: StoredKeyData = {
        keyId,
        sharedSecret,
        timestamp: Date.now(),
        chatId,
        participants
      };

      // Сохраняем ключ
      localStorage.setItem(
        `${this.STORAGE_PREFIX}${keyId}`, 
        JSON.stringify(keyData)
      );

      // Обновляем метаданные
      this.updateKeyMetadata(keyId, chatId, participants);

      console.log(`[CryptoStorage] Shared secret stored with ID: ${keyId}`);
      return true;
    } catch (error) {
      console.error('[CryptoStorage] Failed to store shared secret:', error);
      return false;
    }
  }

  /**
   * Получение общего секрета по ID
   */
  getSharedSecret(keyId: string): string | null {
    try {
      const storedData = localStorage.getItem(`${this.STORAGE_PREFIX}${keyId}`);
      if (!storedData) {
        console.warn(`[CryptoStorage] No key found for ID: ${keyId}`);
        return null;
      }

      const keyData: StoredKeyData = JSON.parse(storedData);
      
      // Проверяем срок действия ключа
      if (Date.now() - keyData.timestamp > this.MAX_KEY_AGE_MS) {
        console.warn(`[CryptoStorage] Key ${keyId} is expired, removing`);
        this.removeSharedSecret(keyId);
        return null;
      }

      return keyData.sharedSecret;
    } catch (error) {
      console.error(`[CryptoStorage] Failed to retrieve key ${keyId}:`, error);
      return null;
    }
  }

  /**
   * Удаление общего секрета
   */
  removeSharedSecret(keyId: string): boolean {
    try {
      localStorage.removeItem(`${this.STORAGE_PREFIX}${keyId}`);
      this.removeFromMetadata(keyId);
      console.log(`[CryptoStorage] Key ${keyId} removed`);
      return true;
    } catch (error) {
      console.error(`[CryptoStorage] Failed to remove key ${keyId}:`, error);
      return false;
    }
  }

  /**
   * Получение всех сохраненных ключей для чата
   */
  getKeysForChat(chatId: string): KeyMetadata[] {
    try {
      const metadata = this.getKeysMetadata();
      return metadata.filter(key => key.chatId === chatId && key.isActive);
    } catch (error) {
      console.error('[CryptoStorage] Failed to get keys for chat:', error);
      return [];
    }
  }

  /**
   * Получение активного ключа для определенного набора участников
   */
  getActiveKeyForParticipants(participants: string[], chatId?: string): string | null {
    try {
      const sortedParticipants = [...participants].sort();
      const metadata = this.getKeysMetadata();
      
      for (const keyMeta of metadata) {
        if (keyMeta.isActive && keyMeta.participants) {
          const sortedStoredParticipants = [...keyMeta.participants].sort();
          
          // Проверяем совпадение участников и чата (если указан)
          if (this.arraysEqual(sortedParticipants, sortedStoredParticipants)) {
            if (!chatId || keyMeta.chatId === chatId) {
              return keyMeta.keyId;
            }
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('[CryptoStorage] Failed to find active key:', error);
      return null;
    }
  }

  /**
   * Деактивация старых ключей для чата (при создании нового)
   */
  deactivateOldKeysForChat(chatId: string, exceptKeyId?: string): void {
    try {
      const metadata = this.getKeysMetadata();
      let hasChanges = false;

      for (const keyMeta of metadata) {
        if (keyMeta.chatId === chatId && keyMeta.keyId !== exceptKeyId && keyMeta.isActive) {
          keyMeta.isActive = false;
          hasChanges = true;
          console.log(`[CryptoStorage] Deactivated key: ${keyMeta.keyId}`);
        }
      }

      if (hasChanges) {
        this.saveKeysMetadata(metadata);
      }
    } catch (error) {
      console.error('[CryptoStorage] Failed to deactivate old keys:', error);
    }
  }

  /**
   * Очистка всех ключей
   */
  clearAllKeys(): void {
    try {
      const metadata = this.getKeysMetadata();
      
      // Удаляем все ключи из localStorage
      for (const keyMeta of metadata) {
        localStorage.removeItem(`${this.STORAGE_PREFIX}${keyMeta.keyId}`);
      }
      
      // Очищаем метаданные
      localStorage.removeItem(this.METADATA_KEY);
      
      console.log('[CryptoStorage] All keys cleared');
    } catch (error) {
      console.error('[CryptoStorage] Failed to clear all keys:', error);
    }
  }

  /**
   * Получение информации обо всех ключах
   */
  getAllKeysInfo(): KeyMetadata[] {
    return this.getKeysMetadata();
  }

  /**
   * Очистка устаревших ключей
   */
  private cleanupExpiredKeys(): void {
    try {
      const metadata = this.getKeysMetadata();
      const now = Date.now();
      let hasChanges = false;

      for (let i = metadata.length - 1; i >= 0; i--) {
        const keyMeta = metadata[i];
        const keyAge = now - keyMeta.created.getTime();
        
        if (keyAge > this.MAX_KEY_AGE_MS) {
          // Удаляем ключ из storage
          localStorage.removeItem(`${this.STORAGE_PREFIX}${keyMeta.keyId}`);
          
          // Удаляем из метаданных
          metadata.splice(i, 1);
          hasChanges = true;
          
          console.log(`[CryptoStorage] Expired key removed: ${keyMeta.keyId}`);
        }
      }

      if (hasChanges) {
        this.saveKeysMetadata(metadata);
      }
    } catch (error) {
      console.error('[CryptoStorage] Failed to cleanup expired keys:', error);
    }
  }

  /**
   * Обновление метаданных ключа
   */
  private updateKeyMetadata(keyId: string, chatId?: string, participants?: string[]): void {
    try {
      const metadata = this.getKeysMetadata();
      const existingIndex = metadata.findIndex(meta => meta.keyId === keyId);
      
      const keyMeta: KeyMetadata = {
        keyId,
        created: new Date(),
        chatId,
        participants,
        isActive: true
      };

      if (existingIndex >= 0) {
        metadata[existingIndex] = keyMeta;
      } else {
        metadata.push(keyMeta);
      }

      // Деактивируем старые ключи для этого чата
      if (chatId) {
        this.deactivateOldKeysForChat(chatId, keyId);
      }

      this.saveKeysMetadata(metadata);
    } catch (error) {
      console.error('[CryptoStorage] Failed to update key metadata:', error);
    }
  }

  /**
   * Удаление ключа из метаданных
   */
  private removeFromMetadata(keyId: string): void {
    try {
      const metadata = this.getKeysMetadata();
      const filteredMetadata = metadata.filter(meta => meta.keyId !== keyId);
      this.saveKeysMetadata(filteredMetadata);
    } catch (error) {
      console.error('[CryptoStorage] Failed to remove from metadata:', error);
    }
  }

  /**
   * Получение метаданных ключей
   */
  private getKeysMetadata(): KeyMetadata[] {
    try {
      const storedMetadata = localStorage.getItem(this.METADATA_KEY);
      if (!storedMetadata) {
        return [];
      }

      const parsed = JSON.parse(storedMetadata);
      
      // Преобразуем строки дат обратно в объекты Date
      return parsed.map((meta: any) => ({
        ...meta,
        created: new Date(meta.created)
      }));
    } catch (error) {
      console.error('[CryptoStorage] Failed to get keys metadata:', error);
      return [];
    }
  }

  /**
   * Сохранение метаданных ключей
   */
  private saveKeysMetadata(metadata: KeyMetadata[]): void {
    try {
      localStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('[CryptoStorage] Failed to save keys metadata:', error);
    }
  }

  /**
   * Проверка равенства массивов
   */
  private arraysEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Получение размера хранилища ключей в байтах
   */
  getStorageSize(): number {
    try {
      let totalSize = 0;
      const metadata = this.getKeysMetadata();
      
      for (const keyMeta of metadata) {
        const keyData = localStorage.getItem(`${this.STORAGE_PREFIX}${keyMeta.keyId}`);
        if (keyData) {
          totalSize += keyData.length * 2; // UTF-16 encoding
        }
      }
      
      const metadataSize = localStorage.getItem(this.METADATA_KEY);
      if (metadataSize) {
        totalSize += metadataSize.length * 2;
      }
      
      return totalSize;
    } catch (error) {
      console.error('[CryptoStorage] Failed to calculate storage size:', error);
      return 0;
    }
  }

  /**
   * Экспорт ключей (для резервного копирования)
   */
  exportKeys(): string {
    try {
      const metadata = this.getKeysMetadata();
      const exportData: any = {
        metadata,
        keys: {}
      };

      for (const keyMeta of metadata) {
        const keyData = localStorage.getItem(`${this.STORAGE_PREFIX}${keyMeta.keyId}`);
        if (keyData) {
          exportData.keys[keyMeta.keyId] = keyData;
        }
      }

      return JSON.stringify(exportData);
    } catch (error) {
      console.error('[CryptoStorage] Failed to export keys:', error);
      return '';
    }
  }

  /**
   * Импорт ключей (из резервной копии)
   */
  importKeys(exportedData: string): boolean {
    try {
      const importData = JSON.parse(exportedData);
      
      if (!importData.metadata || !importData.keys) {
        throw new Error('Invalid export data format');
      }

      // Импортируем ключи
      for (const [keyId, keyData] of Object.entries(importData.keys)) {
        localStorage.setItem(`${this.STORAGE_PREFIX}${keyId}`, keyData as string);
      }

      // Импортируем метаданные
      const metadata: KeyMetadata[] = importData.metadata.map((meta: any) => ({
        ...meta,
        created: new Date(meta.created)
      }));
      
      this.saveKeysMetadata(metadata);
      
      console.log(`[CryptoStorage] Imported ${metadata.length} keys`);
      return true;
    } catch (error) {
      console.error('[CryptoStorage] Failed to import keys:', error);
      return false;
    }
  }
}