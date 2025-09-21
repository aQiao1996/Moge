// apps/backend/src/ai/ai.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIService } from './ai.service';

@Module({
  imports: [ConfigModule], // 依赖 NestJS 的配置模块来读取 API Key
  providers: [AIService],
  exports: [AIService], // 导出 AIService，让其他模块可以使用
})
export class AIModule {}
