import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Chat } from "./Chat";
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
    // Encryption = "encryption"
}

@Entity()
export class Message {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column( )
    chatId: string;

    @Column()
    userId: string;
    @ManyToOne(() => Chat, chat => chat.messages)
    chat: Chat;

    @ManyToOne(() => User, user => user.messages)
    user: User;

    @Column()
    content: string;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    timestamp: Date;

    @Column({ default: false })
    reviewed: boolean;

    @Column({ type: "enum", enum: MessageType })
    type: MessageType;

    // @Column({ type: "enum", enum: DiffieHellmanStage, nullable: true })
    // dhStage?: DiffieHellmanStage;
    @Column({ type: "int", nullable: true })
    encryptionKeyIndex?: number;
    
}