import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Chat } from "./Chat";
import { User } from "./User";


export enum InviteStatus {
    Pending = "pending",
    Accepted = "accepted",
    Declined = "declined"
}
@Entity()
export class Invite {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => Chat)
    chat: Chat;
    
    @ManyToOne(() => User)
    userSender: User;

    @ManyToOne(() => User)
    userReceiver: User;

    @Column({ type: 'varchar', length: 20 })
    status: InviteStatus;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
}