import {
  Catch,
  ArgumentsHost,
  WsExceptionFilter,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch(WsException)
export class GlobalWsExceptionFilter implements WsExceptionFilter {
  catch(exception: WsException, host: ArgumentsHost) {
    const ctx = host.switchToWs();
    const client = ctx.getClient<Socket>();

    const error =
      exception.getError() instanceof Object
        ? exception.getError()
        : { message: exception.getError() };

    // Отправляем клиенту стандартное событие
    client.emit('error', {
      event: 'exception',
        data: { error },
    });
  }
}
