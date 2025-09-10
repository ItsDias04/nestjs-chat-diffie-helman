import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm/dist/common/typeorm.decorators";
import { Chat } from "src/Data/Entities/Chat";
import { Message, MessageType } from "src/Data/Entities/Message";
import { MessageDto } from "src/DTO/MessageDto";
import { Repository } from "typeorm/repository/Repository";
import { DiffieHellmanStage } from "src/Data/Entities/Message";
import { User } from "src/Data/Entities/User";
import { ChatGateway } from "src/WebApi/GateWays/ChatGateWey";
@Injectable()
export class MessageService {
 
    constructor(
        @InjectRepository(Message)
        private readonly messageRepository: Repository<Message>,
        @InjectRepository(Chat)
        private readonly chatRepository: Repository<Chat>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
         private readonly chatGateway: ChatGateway,
    ) {}

    async getMessagesInChat(userId: string, chatId: string): Promise<MessageDto[]> {
        
        const chat = await this.chatRepository.findOne({ where: { id: chatId }, relations: ['messages'] });
        const user = chat?.users.find(u => u.id === userId);
        if (!chat) {
            throw new Error(`Chat with id ${chatId} not found`);
        }
        if (!user) {
            throw new Error(`User with id ${userId} not found`);
        }
        if (!chat.users.find(u => u.id === userId)) {
            throw new Error(`User with id ${userId} is not a member of chat with id ${chatId}`);
        }
        return chat?.messages.map(message => this.toMessageDto(message)) || [];
    }
    async addMessageToChat(userId: string, chatId: string, messageDto: MessageDto): Promise<MessageDto> {
        const chat = await this.chatRepository.findOne({ where: { id: chatId } });
        if (!chat) {
            throw new Error(`Chat with id ${chatId} not found`);
        }
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error(`User with id ${userId} not found`);
        }
        if (!chat.users.find(u => u.id === userId)) {
            throw new Error(`User with id ${userId} is not a member of chat with id ${chatId}`);
        } 
        const message = this.messageRepository.create(this.toMessageEntity(messageDto));
        message.chat = chat;
        message.user = user;
        message.chatId = chatId;
        message.userId = userId;
        const resultDto = this.toMessageDto(await this.messageRepository.save(message));
        this.chatGateway.sendMessageToChat(chatId, resultDto);
        return resultDto;
    }

    private toMessageDto(message: Message): MessageDto {
        return Object.assign(new MessageDto(), {
            id: message.id,
            chatId: message.chatId,
            userId: message.userId,
            user: message.user ? {
                id: message.user.id,
                name: message.user.name,
                email: message.user.email,
            } : undefined,
            content: message.content,
            timestamp: message.timestamp,
            reviewed: message.reviewed,
            type: message.type,
            dhStage: message.dhStage,
        });
    }

    private toMessageEntity(messageDto: MessageDto): Message {
        const message = new Message();
        message.id = messageDto.id;
        message.chatId = messageDto.chatId;
        message.userId = messageDto.userId;
        message.content = messageDto.content;
        message.timestamp = messageDto.timestamp;
            message.reviewed = messageDto.reviewed;
            message.type = messageDto.type as MessageType;
            message.dhStage = messageDto.dhStage as DiffieHellmanStage | undefined;
            return message;
        }
    }
