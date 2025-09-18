import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Chat } from "src/Data/Entities/Chat";
import { Message } from "src/Data/Entities/Message";
import { User } from "src/Data/Entities/User";
import { ChatDto } from "src/DTO/ChatDto";
import { MessageDto } from "src/DTO/MessageDto";
import { UserDto } from "src/DTO/UserDto";
import { Repository } from "typeorm/repository/Repository";

@Injectable()
export class ChatService {

    constructor(
        @InjectRepository(Chat)
        private readonly chatRepository: Repository<Chat>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async getAllChatsById(userId: string): Promise<ChatDto[]> {
        const chats = await this.chatRepository.find({
            where: { users: { id: userId } },
            relations: ['users'],
        });
        return chats.map(chat => this.toChatDto(chat));
    }

    async getChatById(userId: string, chatId: string): Promise<ChatDto | null> {
        const chat = await this.chatRepository.findOne({ where: { id: chatId, users: { id: userId } } });
        return chat ? this.toChatDto(chat) : null;
    }

    async getChatUsers(userId: string, chatId: string): Promise<UserDto[]> {
        const chat = await this.chatRepository.findOne({ where: { id: chatId }, relations: ['users'] });
        if (!chat || !chat.users.find(u => u.id === userId)) {
            throw new Error(`Chat with id ${chatId} not found or user with id ${userId} is not a member of the chat`);
        }
        return chat ? chat.users.map(user => this.toUserDto(user)) : [];
    }

    async createChat(name: string, userAdminId: string): Promise<ChatDto> {
        const userAdmin = await this.userRepository.findOne({ where: { id: userAdminId } });
        if (!userAdmin) {
            throw new Error(`User with id ${userAdminId} not found`); 
        }

        const chat = this.chatRepository.create({ name, users: [userAdmin], userAdmin: userAdmin });
        await this.chatRepository.save(chat);
        return this.toChatDto(chat);
    }

    private toChatDto(chat: Chat): ChatDto {
        return Object.assign(new ChatDto(), {
            id: chat.id,
            name: chat.name,
        });
    }

    private toUserDto(user: User): UserDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }
   
}
// import { ApiProperty } from "@nestjs/swagger";

// export class MessageDto {
//     @ApiProperty({ example: 'msg123', description: 'ID сообщения' })
//     id: string;
//     @ApiProperty({ example: 'chat123', description: 'ID чата' })
//     chatId: string;
//     @ApiProperty({ example: 'user123', description: 'ID пользователя' })
//     userId: string;
//     @ApiProperty({ example: 'Hello, world!', description: 'Содержимое сообщения' })
//     content: string;
//     @ApiProperty({ example: '2023-03-15T12:00:00Z', description: 'Время отправки сообщения' })
//     timestamp: Date;
//     @ApiProperty({ example: false, description: 'Статус проверки сообщения' })
//     reviewed: boolean;
//     @ApiProperty({ example: 'text', description: 'Тип сообщения' })
//     type: string;
//     @ApiProperty({ example: 'public_key_exchange', description: 'Этап обмена ключами Диффи-Хеллмана' })
//     dhStage?: string;
// }
