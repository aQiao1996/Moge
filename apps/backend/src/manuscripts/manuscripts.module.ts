import { Module } from '@nestjs/common';
import { ManuscriptsController } from './manuscripts.controller';
import { ManuscriptsService } from './manuscripts.service';
import { ManuscriptsSchedulerService } from './manuscripts-scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AIModule } from '../ai/ai.module';

/**
 * 文稿模块
 */
@Module({
  imports: [PrismaModule, AIModule],
  controllers: [ManuscriptsController],
  providers: [ManuscriptsService, ManuscriptsSchedulerService],
  exports: [ManuscriptsService],
})
export class ManuscriptsModule {}
