import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageDto } from 'src/DTO/MessageDto';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // userId -> socketId
  private userSockets = new Map<string, string>();

  handleConnection(client: Socket) {
    // Можно добавить логику авторизации, если нужно
  }

  handleDisconnect(client: Socket) {
    // Удаляем сокет из карты при отключении
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        break;
      }
    }
  }

  @SubscribeMessage('registerUser')
  handleRegisterUser(@MessageBody() userId: string, @ConnectedSocket() client: Socket) {
    this.userSockets.set(userId, client.id);
  }

  @SubscribeMessage('joinChat')
  handleJoinChat(@MessageBody() chatId: string, @ConnectedSocket() client: Socket) {
    client.join(chatId);
  }

  sendMessageToChat(chatId: string, message: MessageDto) {
    // Если сообщение для конкретного пользователя (Diffie-Hellman)
    if (message.toClientId) {
      const socketId = this.userSockets.get(message.toClientId);
      if (socketId) {
        this.server.to(socketId).emit('newMessage', message);
      }
    } else {
      // Обычная рассылка в чат
      this.server.to(chatId).emit('newMessage', message);
    }
  }
}