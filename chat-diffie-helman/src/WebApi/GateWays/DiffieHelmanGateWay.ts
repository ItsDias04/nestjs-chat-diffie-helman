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
export class DiffieHelmanGateWay implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

  afterInit(server: any) {
    throw new Error('Method not implemented.');
  }
  handleConnection(client: any, ...args: any[]) {
        throw new Error('Method not implemented.');
    }
    handleDisconnect(client: any) {
        throw new Error('Method not implemented.');
    }

}