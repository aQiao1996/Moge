import { Module } from '@nestjs/common';
import { ManuscriptsController } from './manuscripts.controller';
import { ManuscriptsService } from './manuscripts.service';
import { ManuscriptsSchedulerService } from './manuscripts-scheduler.service';
import { ManuscriptAiContextService } from './manuscript-ai-context.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AIModule } from '../ai/ai.module';
import { AiJobsModule } from '../ai-jobs/ai-jobs.module';

/**
 * 文稿模块
 */
@Module({
  imports: [PrismaModule, AIModule, AiJobsModule],
  controllers: [ManuscriptsController],
  providers: [ManuscriptsService, ManuscriptsSchedulerService, ManuscriptAiContextService],
  exports: [ManuscriptsService],
})
export class ManuscriptsModule {}
