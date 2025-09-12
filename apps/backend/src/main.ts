import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import * as express from 'express';
import { ValidationPipe } from '@nestjs/common';
import * as trpcExpress from '@trpc/server/adapters/express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { ResponseInterceptor } from './common/response.interceptor';
import { TrpcService } from './trpc/trpc.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
  });

  const rootDir = join(__dirname, '..');
  app.use('/public', express.static(join(rootDir, 'public')));

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalPipes(new ValidationPipe());

  const trpcService = app.get(TrpcService);

  app.use(
    '/trpc',
    trpcExpress.createExpressMiddleware({
      router: trpcService.appRouter,
      createContext: trpcService.createContext,
    })
  );

  await app.listen(process.env.PORT || 8888, () => {
    console.log(`🚀 ~ main.ts ~ 启动成功,端口号: ${process.env.PORT || 8888}`);
    console.log(`🚀 ~ main.ts ~ 当前运行环境: ${process.env.NODE_ENV || '环境错误'}`);
    console.log(`🚀 ~ main.ts ~ 当前数据库类型: ${process.env.DATABASE_TYPE || '数据库类型错误'}`);
    console.log(
      `🚀 ~ main.ts ~ 当前数据库名称: ${process.env.DATABASE_USERNAME || '数据库名称错误'}`
    );
    console.log(`🚀 ~ tRPC API ~ http://localhost:${process.env.PORT || 8888}/trpc`);
  });
}
void bootstrap();
