import { Catch, HttpException, ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import type { Request, Response } from 'express';

// * 使用Catch装饰器捕获HttpException异常 全局异常捕获
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  // catch方法用于处理异常
  catch(exception: HttpException, host: ArgumentsHost) {
    // 获取HTTP上下文
    const ctx = host.switchToHttp();
    // 获取响应对象
    const response = ctx.getResponse<Response>();
    // 获取请求对象
    const request = ctx.getRequest<Request>();
    // 获取异常的状态码
    const status = exception.getStatus();
    // 获取详细的报错信息 main.ts 中使用了 app.useGlobalPipes(new ValidationPipe())
    // https://nest.nodejs.cn/techniques/validation 详细介绍
    // exception.getResponse() 如果类型是 string 时 , 和 exception.message 是一样的
    const message = (exception.getResponse() as { message: string[] })?.message?.join?.(' & ');
    // 设置响应的状态码和JSON内容
    response.status(status).json({
      code: status,
      timestamp: new Date().toISOString(),
      path: request.path, //  request.url 会显示全部 比如 /login?nickname=panghu&password=123
      method: request.method,
      message: message || exception.message,
    });
  }
}
