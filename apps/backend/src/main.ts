import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import * as express from 'express';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { ResponseInterceptor } from './common/response.interceptor';

async function bootstrap() {
  // * 环境日志
  // const logger = new Logger("main.ts");
  // logger.log(`🚀 ~ main.ts ~ 当前运行环境: ${process.env.NODE_ENV || "环境错误"}`, process.env.DATABASE_NAME);

  // * 使用 express 作为默认框架
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true, // cors 处理跨域 或者直接 app.enableCors();
    // logger: ["error", "warn"], // 启用日志 禁用为false 数组中的值可以是 'log'、'fatal'、'error'、'warn'、'debug' 和 'verbose' 的任意组合
  });

  // 可以直接访问文件 如：http://localhost:3000/public/uploads/36T4NJ0P3UQCIU3GFRMARZ.jpeg
  // * 配置 public 文件夹为静态目录，以达到可直接访问下面文件的目的
  const rootDir = join(__dirname, '..');
  app.use('/public', express.static(join(rootDir, 'public')));

  // * 注册全局过滤器处理HTTP异常
  app.useGlobalFilters(new HttpExceptionFilter());

  // * 注册全局成功响应拦截器
  app.useGlobalInterceptors(new ResponseInterceptor());

  // * ValidationPipe 使用 class-validator npm包及其声明式验证装饰器。
  // https://nest.nodejs.cn/techniques/validation
  app.useGlobalPipes(new ValidationPipe());

  // * 注册全局守卫 执行在 拦截器 之前 执行在 中间件 之后
  // app.useGlobalGuards(new AuthGuard());

  // * 配置 Swagger 文档
  const config = new DocumentBuilder()
    .setTitle('MOGE API')
    .setDescription('MOGE 项目的 REST API 文档')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: '输入 JWT token',
        in: 'header',
      },
      'JWT-auth'
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // 持久化授权信息
      docExpansion: 'none', // 默认折叠所有端点
      filter: true, // 启用过滤器
      showRequestDuration: true, // 显示请求持续时间
      tryItOutEnabled: true, // 默认启用 "Try it out"
      requestSnippetsEnabled: true, // 启用请求代码片段
      requestSnippets: {
        generators: {
          curl_bash: { title: 'cURL (bash)', syntax: 'bash' },
          curl_powershell: { title: 'cURL (PowerShell)', syntax: 'powershell' },
          curl_cmd: { title: 'cURL (CMD)', syntax: 'bash' },
        },
        defaultExpanded: false,
        languages: null,
      },
    },
    customSiteTitle: 'MOGE API 文档',
    customCss: `
      .swagger-ui .topbar { background-color: #1976d2; }
      .swagger-ui .topbar .link { color: white; }
      .swagger-ui .scheme-container { background-color: #1976d2; padding: 10px; margin-bottom: 20px; border-radius: 4px; }
      .swagger-ui .scheme-container .schemes { color: white; }
    `,
  });

  await app.listen(process.env.PORT || 8888, () => {
    console.log(`🚀 ~ main.ts ~ 启动成功,端口号: ${process.env.PORT || 8888}`);
    console.log(`🚀 ~ main.ts ~ 当前运行环境: ${process.env.NODE_ENV || '环境错误'}`);
    console.log(`🚀 ~ main.ts ~ 当前数据库类型: ${process.env.DATABASE_TYPE || '数据库类型错误'}`);
    console.log(
      `🚀 ~ main.ts ~ 当前数据库名称: ${process.env.DATABASE_USERNAME || '数据库名称错误'}`
    );
    console.log(`🚀 ~ HTTP API ~ http://localhost:${process.env.PORT || 8888}/api`);
    console.log(`🚀 ~ Swagger API Docs ~ http://localhost:${process.env.PORT || 8888}/api/docs`);
  });
}
void bootstrap();
