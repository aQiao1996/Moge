import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AiJobsController } from './ai-jobs.controller';
import { AiJobsService } from './ai-jobs.service';

@Module({
  imports: [PrismaModule],
  controllers: [AiJobsController],
  providers: [AiJobsService],
  exports: [AiJobsService],
})
export class AiJobsModule {}
