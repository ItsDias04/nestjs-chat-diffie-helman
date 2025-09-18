import { User } from "./User";

export enum DiffieHellmanStage {
  PublicKeyExchange = "public_key_exchange",
  SharedKeyGenerated = "shared_key_generated",
  EncryptedMessage = "encrypted_message",
  HandshakeComplete = "handshake_complete"
}

export enum MessageType {
  Text = "text",
  Image = "image",
  Video = "video",
  File = "file",
  Audio = "audio",
  Encryption = "encryption"
}

export interface Message {
  id: string;
  chatId: string;
  userId: string;
  user: User;
  content: string;
  timestamp: string; // ISO string
  reviewed: boolean;
  type: MessageType | string;
  keyId?: string;
  // dhStage?: DiffieHellmanStage | string;
  // toClientId: string | null;
}