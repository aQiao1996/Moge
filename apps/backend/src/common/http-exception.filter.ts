import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = isHttpException ? this.getHttpExceptionMessage(exception) : '服务器内部错误';

    if (!isHttpException) {
      this.logger.error(
        '未处理的服务器异常',
        exception instanceof Error ? exception.stack : exception
      );
    }

    response.status(status).json({
      code: status,
      timestamp: new Date().toISOString(),
      path: request.path,
      method: request.method,
      message,
    });
  }

  private getHttpExceptionMessage(exception: HttpException): string {
    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (this.hasMessage(exceptionResponse)) {
      if (Array.isArray(exceptionResponse.message)) {
        return exceptionResponse.message.join(' & ');
      }

      if (typeof exceptionResponse.message === 'string') {
        return exceptionResponse.message;
      }
    }

    return exception.message;
  }

  private hasMessage(value: object): value is { message: string | string[] } {
    return 'message' in value;
  }
}
