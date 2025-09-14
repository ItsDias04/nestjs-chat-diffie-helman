// WebApi/Helpers/AllExceptionFilter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Socket } from 'socket.io';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctxType = host.getType<'http' | 'ws' | 'rpc'>();
    if (ctxType === 'http') {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse();
      const request = ctx.getRequest();

      let status = HttpStatus.INTERNAL_SERVER_ERROR;
      let message: any = 'Internal server error';
      let error = 'InternalServerError';

      if (exception instanceof HttpException) {
        status = exception.getStatus();
        const res = exception.getResponse();
        if (typeof res === 'string') {
          message = res;
        } else if (typeof res === 'object' && res !== null) {
          message = (res as any).message ?? (res as any).error ?? res;
          error = (res as any).error ?? exception.name;
        }
      } else if (exception instanceof Error) {
        message = exception.message;
        error = exception.name;
      }

      this.logger.error(`${request.method} ${request.url} -> ${status} ${message}`, exception instanceof Error ? exception.stack : undefined);

      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message,
        error,
      });
      return;
    }

    if (ctxType === 'ws') {
      const wsCtx = host.switchToWs();
      const client = wsCtx.getClient<Socket>();

      const payload = {
        timestamp: new Date().toISOString(),
        message: exception instanceof Error ? exception.message : 'Internal server error',
      };

      try {
        if (client && typeof client.emit === 'function') {
          // событие — можно использовать 'error' или 'exception' — в клиенте слушай соответствующее
          client.emit('exception', payload);
          // отключаем клиента (по желанию) чтобы не оставлять дефектное соединение
          try { client.disconnect(true); } catch {}
        }
      } catch (e) {
        this.logger.error('Failed to emit ws exception to client', e as any);
      }

      this.logger.error(`WS exception: ${payload.message}`, exception instanceof Error ? exception.stack : (exception as any));
      return;
    }

    // rpc / unknown
    this.logger.error('Unknown exception host', exception as any);
  }
}
