import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from './Data/Entities/Chat';
import { User } from './Data/Entities/User';
import { Message } from './Data/Entities/Message';
import { Invite } from './Data/Entities/Invite';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './BL/Services/AuthService';
import { JwtStrategy } from './WebApi/Helpers/JwtStrategy';
import { UserService } from './BL/Services/UserService';
import { ChatService } from './BL/Services/ChatService';
import { UserController } from './WebApi/Controllers/UserController';
import { AuthController } from './WebApi/Controllers/AuthController';
import { ChatController } from './WebApi/Controllers/ChatController';
import { MessageService } from './BL/Services/MessageService';
import { ChatGateway } from './WebApi/GateWays/ChatGateWay';
import { MessageController } from './WebApi/Controllers/MessageController';
import { InviteController } from './WebApi/Controllers/InviteController';
import { InviteService } from './BL/Services/InviteService';
import { ActiveUsersService } from './BL/Singelton/Services/ActiveUsersService';
import { DiffieHelmanGateWay } from './WebApi/GateWays/DiffieHelmanGateWay';

import { FiatSessionsService } from './BL/Singelton/Services/FiatSessionsService';
import { FiatService } from './BL/Services/FiatService';
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'SuperAdmin',
      database: 'chat_db',
      entities: [Chat, User, Message, Invite],
      synchronize: true,
    }),

    PassportModule,
    JwtModule.register({
      secret: 'your_jwt_secret',
      // signOptions: { expiresIn: '1d' },
    }),
    TypeOrmModule.forFeature([Chat, User, Message, Invite]),
    // FiatSessionsModule,
  ],
  providers: [
    AuthService,
    JwtStrategy,
    UserService,
    ChatService,
    InviteService,
    MessageService,
    ChatGateway,
    ActiveUsersService,
    DiffieHelmanGateWay,
    FiatSessionsService,
    FiatService
  ],
  exports: [
    AuthService,
    UserService,
    ChatService,
    MessageService,
    InviteService,
    ActiveUsersService,
  ],

  controllers: [
    UserController,
    AuthController,
    ChatController,
    MessageController,
    InviteController,
  ],
})
export class AppModule {}
