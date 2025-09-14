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
import { DiffieHellmanMessageDto } from 'src/DTO/DiffieHellmanMessageDto';

interface DiffieHellmanSession {
  initiatorId: string;
  recipientId: string;
  chatId: string;
  stage: number;
  initiatorPublicKey?: string;
  recipientPublicKey?: string;
  timestamp: number;
}

@WebSocketGateway({ 
  cors: true,
  namespace: '/diffie-hellman' // Отдельное пространство для DH обмена
})
export class DiffieHelmanGateWay implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Храним активные сессии обмена ключами
  private activeSessions = new Map<string, DiffieHellmanSession>();

  constructor(
    private readonly activeUsersService: ActiveUsersService,
    private readonly jwtService: JwtService,
  ) {}

  afterInit(server: Server) {
    // Middleware для аутентификации (аналогично ChatGateway)
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
    const userId = client.data?.userId as string | undefined;
    if (!userId) {
      client.emit('error', { message: 'Unauthorized' });
      client.disconnect(true);
      return;
    }

    // Регистрируем пользователя для DH обмена
    client.emit('dh-connected', { 
      ok: true, 
      message: 'Connected to Diffie-Hellman gateway' 
    });
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId as string | undefined;
    
    // Очищаем активные сессии для отключившегося пользователя
    this.cleanupUserSessions(userId);
  }

  /**
   * Инициирует обмен ключами Diffie-Hellman
   */
  @SubscribeMessage('initiateDH')
  handleInitiateDH(
    @MessageBody() data: { 
      chatId: string; 
      recipientId: string; 
      publicKey: string; 
    },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId as string | undefined;
    
    if (!userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    const { chatId, recipientId, publicKey } = data;
    const sessionId = this.generateSessionId(userId, recipientId, chatId);

    // Создаем новую сессию
    const session: DiffieHellmanSession = {
      initiatorId: userId,
      recipientId,
      chatId,
      stage: 1,
      initiatorPublicKey: publicKey,
      timestamp: Date.now(),
    };

    this.activeSessions.set(sessionId, session);

    // Отправляем предложение обмена ключами получателю
    const recipientSocketId = this.activeUsersService.getSocketId(recipientId);
    if (recipientSocketId) {
      this.server.to(recipientSocketId).emit('dhKeyExchangeRequest', {
        sessionId,
        fromUserId: userId,
        chatId,
        publicKey,
        stage: 1,
        message: 'User wants to start encrypted communication',
      });

      // Подтверждаем инициатору
      client.emit('dhInitiated', {
        sessionId,
        status: 'sent',
        recipientId,
        chatId,
      });
    } else {
      // Получатель не в сети
      client.emit('dhError', {
        error: 'Recipient is offline',
        recipientId,
      });
      this.activeSessions.delete(sessionId);
    }
  }

  /**
   * Принимает обмен ключами и отправляет свой публичный ключ
   */
  @SubscribeMessage('acceptDH')
  handleAcceptDH(
    @MessageBody() data: { 
      sessionId: string; 
      publicKey: string; 
    },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId as string | undefined;
    
    if (!userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    const { sessionId, publicKey } = data;
    const session = this.activeSessions.get(sessionId);

    if (!session || session.recipientId !== userId) {
      client.emit('dhError', {
        error: 'Invalid session or unauthorized',
        sessionId,
      });
      return;
    }

    // Обновляем сессию
    session.recipientPublicKey = publicKey;
    session.stage = 2;
    this.activeSessions.set(sessionId, session);

    // Отправляем публичный ключ получателя инициатору
    const initiatorSocketId = this.activeUsersService.getSocketId(session.initiatorId);
    if (initiatorSocketId) {
      this.server.to(initiatorSocketId).emit('dhKeyExchangeResponse', {
        sessionId,
        fromUserId: userId,
        chatId: session.chatId,
        publicKey,
        stage: 2,
        message: 'Key exchange accepted',
      });
    }

    // Подтверждаем получателю
    client.emit('dhAccepted', {
      sessionId,
      status: 'completed',
      initiatorId: session.initiatorId,
      chatId: session.chatId,
    });

    // Уведомляем обе стороны о завершении обмена
    setTimeout(() => {
      this.notifyKeyExchangeComplete(session);
    }, 100);
  }

  /**
   * Отклоняет обмен ключами
   */
  @SubscribeMessage('rejectDH')
  handleRejectDH(
    @MessageBody() data: { sessionId: string; reason?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId as string | undefined;
    
    if (!userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    const { sessionId, reason } = data;
    const session = this.activeSessions.get(sessionId);

    if (!session || session.recipientId !== userId) {
      client.emit('dhError', {
        error: 'Invalid session or unauthorized',
        sessionId,
      });
      return;
    }

    // Уведомляем инициатора об отклонении
    const initiatorSocketId = this.activeUsersService.getSocketId(session.initiatorId);
    if (initiatorSocketId) {
      this.server.to(initiatorSocketId).emit('dhRejected', {
        sessionId,
        recipientId: userId,
        chatId: session.chatId,
        reason: reason || 'Key exchange declined',
      });
    }

    // Удаляем сессию
    this.activeSessions.delete(sessionId);

    // Подтверждаем отклонение
    client.emit('dhRejectionSent', {
      sessionId,
      initiatorId: session.initiatorId,
    });
  }

  /**
   * Получение статуса сессии
   */
  @SubscribeMessage('getDHStatus')
  handleGetDHStatus(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId as string | undefined;
    
    if (!userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    const { sessionId } = data;
    const session = this.activeSessions.get(sessionId);

    if (!session || (session.initiatorId !== userId && session.recipientId !== userId)) {
      client.emit('dhError', {
        error: 'Session not found or unauthorized',
        sessionId,
      });
      return;
    }

    client.emit('dhStatus', {
      sessionId,
      stage: session.stage,
      chatId: session.chatId,
      initiatorId: session.initiatorId,
      recipientId: session.recipientId,
      isInitiator: session.initiatorId === userId,
      timestamp: session.timestamp,
    });
  }

  /**
   * Метод для использования из контроллера
   * Отправляет сообщение Diffie-Hellman через WebSocket
   */
  sendDiffieHellmanMessage(
    chatId: string, 
    message: DiffieHellmanMessageDto, 
    fromUserId: string
  ) {
    const { toClientId, publicKey, stage } = message;
    
    // Генерируем ID сессии
    const sessionId = this.generateSessionId(fromUserId, toClientId, chatId);
    
    if (stage === 1) {
      // Первый этап - отправка публичного ключа
      const recipientSocketId = this.activeUsersService.getSocketId(toClientId);
      if (recipientSocketId) {
        this.server.to(recipientSocketId).emit('dhKeyExchangeRequest', {
          sessionId,
          fromUserId,
          chatId,
          publicKey,
          stage,
          message: 'Key exchange initiated via API',
        });
      }
    } else if (stage === 2) {
      // Второй этап - ответ с публичным ключом
      const initiatorSocketId = this.activeUsersService.getSocketId(toClientId);
      if (initiatorSocketId) {
        this.server.to(initiatorSocketId).emit('dhKeyExchangeResponse', {
          sessionId,
          fromUserId,
          chatId,
          publicKey,
          stage,
          message: 'Key exchange response via API',
        });
      }
    }
  }

  /**
   * Генерирует уникальный ID для сессии
   */
  private generateSessionId(user1: string, user2: string, chatId: string): string {
    const sortedUsers = [user1, user2].sort();
    return `dh_${sortedUsers[0]}_${sortedUsers[1]}_${chatId}_${Date.now()}`;
  }

  /**
   * Уведомляет обе стороны о завершении обмена ключами
   */
  private notifyKeyExchangeComplete(session: DiffieHellmanSession) {
    const completeMessage = {
      sessionId: this.generateSessionId(session.initiatorId, session.recipientId, session.chatId),
      chatId: session.chatId,
      status: 'completed',
      message: 'Key exchange completed. Encrypted communication can now begin.',
    };

    // Уведомляем инициатора
    const initiatorSocketId = this.activeUsersService.getSocketId(session.initiatorId);
    if (initiatorSocketId) {
      this.server.to(initiatorSocketId).emit('dhComplete', {
        ...completeMessage,
        partnerId: session.recipientId,
        isInitiator: true,
      });
    }

    // Уведомляем получателя
    const recipientSocketId = this.activeUsersService.getSocketId(session.recipientId);
    if (recipientSocketId) {
      this.server.to(recipientSocketId).emit('dhComplete', {
        ...completeMessage,
        partnerId: session.initiatorId,
        isInitiator: false,
      });
    }

    // Удаляем сессию через некоторое время
    setTimeout(() => {
      const sessionId = this.generateSessionId(
        session.initiatorId, 
        session.recipientId, 
        session.chatId
      );
      this.activeSessions.delete(sessionId);
    }, 60000); // Удаляем через 1 минуту
  }

  /**
   * Очищает сессии пользователя при отключении
   */
  private cleanupUserSessions(userId?: string) {
    if (!userId) return;

    const sessionsToDelete: string[] = [];
    
    this.activeSessions.forEach((session, sessionId) => {
      if (session.initiatorId === userId || session.recipientId === userId) {
        // Уведомляем другую сторону об отключении
        const otherUserId = session.initiatorId === userId 
          ? session.recipientId 
          : session.initiatorId;
          
        const otherSocketId = this.activeUsersService.getSocketId(otherUserId);
        if (otherSocketId) {
          this.server.to(otherSocketId).emit('dhSessionInterrupted', {
            sessionId,
            reason: 'Partner disconnected',
            disconnectedUserId: userId,
          });
        }
        
        sessionsToDelete.push(sessionId);
      }
    });

    // Удаляем сессии
    sessionsToDelete.forEach(sessionId => {
      this.activeSessions.delete(sessionId);
    });
  }
}