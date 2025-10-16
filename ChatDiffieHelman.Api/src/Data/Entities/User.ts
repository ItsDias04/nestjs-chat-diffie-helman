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

    @Column({ default: false })
    fiat_enabled: boolean;

    @Column({ type: "text", default: null, nullable: true })
    fiat_n: string | null;

    @Column({ type: "text", default: null, nullable: true })
    fiat_v: string | null;

    // Brickell–McCurley identification parameters
    @Column({ default: false })
    bmc_enabled: boolean;

    // RSA modulus N (hex or decimal string, we store as text)
    @Column({ type: "text", default: null, nullable: true })
    bmc_n: string | null;

    // Generator g (hex or decimal string)
    @Column({ type: "text", default: null, nullable: true })
    bmc_g: string | null;

    // Public key y = g^x mod N (hex or decimal string)
    @Column({ type: "text", default: null, nullable: true })
    bmc_y: string | null;
}