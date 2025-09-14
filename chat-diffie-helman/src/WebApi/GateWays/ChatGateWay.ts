// ChatGateWay.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ActiveUsersService } from '../../BL/Singelton/Services/ActiveUsersService';
import { MessageDto } from 'src/DTO/MessageDto';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly activeUsersService: ActiveUsersService,
    private readonly jwtService: JwtService,
  ) {}

  // middleware выполняется ДО handleConnection
  afterInit(server: Server) {
    server.use(async (socket: Socket & { data?: any }, next) => {
      try {
        const handshake: any = socket.handshake;
        const authHeader = handshake?.auth?.token ?? handshake?.headers?.authorization;

        if (!authHeader) {
          return next(new Error('Unauthorized: token not provided'));
        }

        const token = (typeof authHeader === 'string' && authHeader.startsWith('Bearer '))
          ? authHeader.slice(7)
          : authHeader;

        const payload = await this.jwtService.verifyAsync(token).catch(() => null);
        if (!payload || !payload['sub']) {
          return next(new Error('Unauthorized: invalid token'));
        }

        socket.data = socket.data || {};
        socket.data.userId = payload['sub'];
        return next();
      } catch (e) {
        return next(new Error('Unauthorized'));
      }
    });
  }

  handleConnection(client: Socket) {
    // Токен уже проверен в middleware — просто используем userId
    const userId = client.data?.userId as string | undefined;
    if (!userId) {
      // На всякий случай обработаем аккуратно
      client.emit('error', { message: 'Unauthorized' });
      client.disconnect(true);
      return;
    }

    // регистрируем активного пользователя
    this.activeUsersService.addUser(userId, client.id);
    client.emit('connected', { ok: true });
  }

  handleDisconnect(client: Socket) {
    this.activeUsersService.removeUser(client.id);
    
  }

  @SubscribeMessage('joinChat')
  handleJoinChat(
    @MessageBody() data: { chatId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { chatId } = data;
    const userId = client.data.userId as string | undefined;

    if (!userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    client.join(chatId);
    this.activeUsersService.addUserToChat(chatId, userId);

    const activeUsers = this.activeUsersService.getActiveUsersInChat(chatId);

    this.server.to(chatId).emit('chatUsersUpdate', {
      chatId,
      users: activeUsers,
    });
  }

  sendMessageToChat(chatId: string, message: MessageDto) {
    // if (message.toClientId) {
      // const socketId = this.activeUsersService.getSocketId(message.toClientId);
      // if (socketId) {
        // this.server.to(socketId).emit('newMessage', message);
      // }
    // } else {
      this.server.to(chatId).emit('newMessage', message);
    // }
  }
}
