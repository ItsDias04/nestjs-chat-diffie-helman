import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Console } from "node:console";
import { Chat } from "src/Data/Entities/Chat";
import { Invite, InviteStatus } from "src/Data/Entities/Invite";
import { User } from "src/Data/Entities/User";
import { InviteDto } from "src/DTO/InviteDto";
import { DeepPartial, Repository } from "typeorm";

@Injectable()
export class InviteService {
    constructor(
        @InjectRepository(Invite)
        private readonly inviteRepository: Repository<Invite>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Chat)
        private readonly chatRepository: Repository<Chat>,
    ) {}
    async createInvite(chatId: string, inviterId: string, userReceiverId: string): Promise<InviteDto> {
        const chat = await this.chatRepository.findOne({ where: { id: chatId }, relations: ['users'] });
        if (!chat) {
            throw new Error(`Chat with id ${chatId} not found`);
        }
        const inviter = await this.userRepository.findOne({ where: { id: inviterId } });
        if (!inviter) {
            throw new Error(`User with id ${inviterId} not found`);
        }
        if (!chat.users.find(u => u.id === inviterId)) {
            throw new Error(`User with id ${inviterId} is not a member of chat with id ${chatId}`);
        }
        const invite = await this.inviteRepository.findOne({ where: { chat: { id: chatId }, userSender: { id: inviterId }, userReceiver: { id: userReceiverId } } });
        if (invite) {
            throw new Error(`Invite already exists`);
        }

        if (!userReceiverId) {
            throw new Error('UserReceiverId is required');
        }
        const userReceiver = await this.userRepository.findOne({ where: { id: userReceiverId } });
            if (!userReceiver) {
                throw new Error(`User with id ${userReceiverId} not found`);
            }
           
        // You may need to provide userReceiver as well, here it's set to null for demonstration
        const newInvite = this.inviteRepository.create({
            chat: chat,
            userSender: inviter,
            userReceiver: userReceiver,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
        } as DeepPartial<Invite>);
    await this.inviteRepository.save(newInvite);
    return this.toInviteDto(newInvite);
    }
     async getInvitesForUser(userId: string): Promise<InviteDto[]> {
    const invites = await this.inviteRepository.find({
        where: { userReceiver: { id: userId } },
        relations: ['chat', 'userSender', 'userReceiver'], // <--- добавьте это
    });
    return invites.map(invite => this.toInviteDto(invite));
}
    
    async respondToInvite(inviteId: string, accept: boolean): Promise<InviteDto> {
        const invite = await this.inviteRepository.findOne({ where: { id: inviteId }, relations: ['chat', 'userSender', 'userReceiver'] });
        if (!invite) {
            throw new Error(`Invite with id ${inviteId} not found`);
        }
        invite.status = accept ? InviteStatus.Accepted : InviteStatus.Declined;
        invite.updatedAt = new Date();
        console.log(invite);

        if (accept) {
            const chat = await this.chatRepository.findOne({ where: { id: invite.chat.id }, relations: ['users'] });
            
            chat?.users.push(invite.userReceiver);

            await this.chatRepository.save(chat!);
        }

        await this.inviteRepository.save(invite);
        return this.toInviteDto(invite);
    }
    private toInviteDto(invite: Invite): InviteDto {
        return Object.assign(new InviteDto(), {
            id: invite.id,
            chatId: invite.chat.id,
            chat: invite.chat,
            userSenderId: invite.userSender.id,
            userSender: invite.userSender,
            userReceiverId: invite.userReceiver ? invite.userReceiver.id : null,
            userReceiver: invite.userReceiver ? invite.userReceiver : null,
            status: invite.status,
            createdAt: invite.createdAt,
            updatedAt: invite.updatedAt
        });
    }
}