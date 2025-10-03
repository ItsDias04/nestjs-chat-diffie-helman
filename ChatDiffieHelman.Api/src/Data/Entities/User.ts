import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinTable } from "typeorm";
import { Invite } from "./Invite";
import { Chat } from "./Chat";
import { Message } from "./Message";

@Entity()
export class User {
   @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @OneToMany(() => Invite, invite => invite.userReceiver)
    invites: Invite[];

    @ManyToMany(() => Chat, chat => chat.users)
    chats: Chat[];

    @OneToMany(() => Message, message => message.user)
    messages: Message[];
}