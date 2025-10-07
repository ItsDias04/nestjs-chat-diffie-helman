import { JwtService } from '@nestjs/jwt';
import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ActiveUsersService } from 'src/BL/Singelton/Services/ActiveUsersService';
import { DiffieHellmanMessageDto } from '../../DTO/DiffieHellmanMessageDto';
import { ChatService } from 'src/BL/Services/ChatService';

interface DiffieHellmanSession {
  chatId: string;
  stage: number;
  activeUsers: Set<string>;
  data?: any; // optional data per-session (can store intermediates if needed)
  timestamp: number; // last activity timestamp
}

@WebSocketGateway({
  cors: true,
  namespace: '/diffie-hellman',
})
export class DiffieHelmanGateWay
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  // Map chatId -> DH session
  private activeSessions = new Map<string, DiffieHellmanSession>();

  // Map userId -> set of socket ids (to support multiple devices/tabs)
  private userSockets = new Map<string, Set<string>>();

  constructor(
    // private readonly activeUsersService: ActiveUsersService,
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  afterInit(server: any) {
    // auth middleware for namespace
    server.use(async (socket: Socket & { data?: any }, next) => {
      try {
        const handshake: any = socket.handshake;
        const authHeader =
          handshake?.auth?.token ?? handshake?.headers?.authorization;

        if (!authHeader) {
          return next(new Error('Unauthorized: token not provided'));
        }

        const token =
          typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
            ? authHeader.slice(7)
            : authHeader;

        const payload = await this.jwtService
          .verifyAsync(token)
          .catch(() => null);
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

    // Register socket id under user
    const set = this.userSockets.get(userId) ?? new Set<string>();
    set.add(client.id);
    this.userSockets.set(userId, set);

    client.emit('dh-connected', {
      ok: true,
      message: 'Connected to Diffie-Hellman gateway',
    });
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId as string | undefined;
    if (!userId) return;

    // Remove socket id from userSockets
    const set = this.userSockets.get(userId);
    if (set) {
      set.delete(client.id);
      if (set.size === 0) this.userSockets.delete(userId);
      else this.userSockets.set(userId, set);
    }

    // Remove user from any active sessions they were part of
    for (const [chatId, session] of this.activeSessions.entries()) {
      if (session.activeUsers.has(userId)) {
        session.activeUsers.delete(userId);
        session.timestamp = Date.now();
        // If session empty, cleanup
        if (session.activeUsers.size === 0) {
          this.activeSessions.delete(chatId);
        } else {
          this.activeSessions.set(chatId, session);
        }
      }
    }
  }

  // Client tells server: join DH exchange for chatId
  @SubscribeMessage('dh-join')
  async handleJoin(
    @MessageBody() payload: { chatId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data?.userId as string | undefined;
    if (!userId) {
      client.emit('dh-error', { message: 'Unauthorized' });
      return;
    }
    if (!payload?.chatId) {
      client.emit('dh-error', { message: 'chatId required' });
      return;
    }

    // add to or create session
    const chatId = payload.chatId;
    let session = this.activeSessions.get(chatId);
    if (!session) {
      session = {
        chatId,
        stage: 0,
        activeUsers: new Set<string>(),
        timestamp: Date.now(),
      };
      this.activeSessions.set(chatId, session);
    }

    session.activeUsers.add(userId);
    session.timestamp = Date.now();
    this.activeSessions.set(chatId, session);

    // join socket.io room for convenience
    client.join(`dh:${chatId}`);
    console.debug(
      'activeUsers',
      JSON.stringify(session.activeUsers, null, 2),
      session.activeUsers,
    );
    console.debug(
      'activeSessions',
      JSON.stringify(this.activeSessions, null, 2),
      this.activeSessions,
    );

    client.emit('dh-joined', {
      ok: true,
      chatId,
      message: 'Joined Diffie-Hellman session for chat',
      // message: session.activeUsers
    });

    const activeUsers = session.activeUsers;

    this.server
      .to(`dh:${chatId}`)
      .emit('dh-chatUsersUpdate', { chatId, users: Array.from(activeUsers) });
  }

  // Client leaves DH exchange for chatId
  @SubscribeMessage('dh-leave')
  async handleLeave(
    @MessageBody() payload: { chatId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data?.userId as string | undefined;
    if (!userId || !payload?.chatId) return;

    const chatId = payload.chatId;
    const session = this.activeSessions.get(chatId);
    if (!session) return;

    session.activeUsers.delete(userId);
    session.timestamp = Date.now();
    client.leave(`dh:${chatId}`);

    if (session.activeUsers.size === 0) this.activeSessions.delete(chatId);
    else this.activeSessions.set(chatId, session);

    client.emit('dh-left', { ok: true, chatId });
  }

  // Main message route: forward DH payload to specific user within same chat
  @SubscribeMessage('dh-send')
  async handleDhSend(
    @MessageBody() message: DiffieHellmanMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data?.userId as string | undefined;

    console.debug('message', JSON.stringify(message, null, 2));
    console.debug('client', JSON.stringify(client.data, null, 2));
    // Basic validation
    if (!userId) {
      client.emit('dh-error', { message: 'Unauthorized' });
      return;
    }

    if (!message?.chatId || !message?.fromClientId || !message?.toClientId) {
      client.emit('dh-error', { message: 'Invalid payload' });
      return;
    }

    // Must come from the authenticated user
    if (message.fromClientId !== userId) {
      client.emit('dh-error', { message: 'fromClientId mismatch' });
      return;
    }

    const session = this.activeSessions.get(message.chatId);
    if (!session) {
      client.emit('dh-error', { message: 'No active session for this chat' });
      return;
    }

    // Both parties must be part of the session
    if (!session.activeUsers.has(message.fromClientId)) {
      client.emit('dh-error', { message: 'Sender not in session' });
      return;
    }
    if (!session.activeUsers.has(message.toClientId)) {
      client.emit('dh-error', { message: 'Recipient not in session' });
      return;
    }
    console.debug(
      '################info##############',
      JSON.stringify(session.activeUsers, null, 2),
      JSON.stringify(message.fromClientId, null, 2),
      JSON.stringify(message.toClientId, null, 2),
      '################info##############',
    );

    session.timestamp = Date.now();
    this.activeSessions.set(message.chatId, session);

    // Forward message to recipient's sockets
    const recipientSockets =
      this.userSockets.get(message.toClientId) ?? new Set();
    if (recipientSockets.size === 0) {
      client.emit('dh-error', { message: 'Recipient not connected' });
      return;
    }
    console.debug('recipientSockets', recipientSockets);

    const payloadToSend = {
      chatId: message.chatId,
      fromClientId: message.fromClientId,
      toClientId: message.toClientId,
      publicKey: message.publicKey,
      stage: message.stage,
      serverTimestamp: Date.now(),
    };

    for (const sid of recipientSockets) {
      // const sock = this.server.sockets.sockets.get(sid);
      // if (sock && sock.connected && sock.rooms.has(`dh:${message.chatId}`)) {
      // sock.emit('dh-message', payloadToSend);
      // console.debug('--------------------------------------');
      // console.debug('sock.rooms', sock.rooms);

      const sock = (this.server.sockets as any).get(sid) as Socket | undefined;
      if (sock && sock.connected) {
        console.debug('--------------------------------------');
        console.debug('sock.rooms', sock.rooms);
        sock.emit('dh-message', payloadToSend);
      }
    }

    // confirm to sender
    client.emit('dh-sent', {
      ok: true,
      to: message.toClientId,
      chatId: message.chatId,
    });
  }

  // @SubscribeMessage('')

  // OPTIONAL: Periodic cleanup could be added (not implemented as an interval here) —
  // remove sessions older than e.g. 10 minutes. If you need that, add a setInterval on init.
}
