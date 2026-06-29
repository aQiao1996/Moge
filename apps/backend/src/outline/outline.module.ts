import { Module } from '@nestjs/common';
import { OutlineController } from './outline.controller';
import { OutlineService } from './outline.service';
import { AIModule } from '../ai/ai.module';
import { SensitiveFilterModule } from '../sensitive-filter/sensitive-filter.module';
import { MarkdownParserService } from './markdown-parser.service';
import { AiJobsModule } from '../ai-jobs/ai-jobs.module';

@Module({
  imports: [AIModule, SensitiveFilterModule, AiJobsModule],
  controllers: [OutlineController],
  providers: [OutlineService, MarkdownParserService],
  exports: [OutlineService],
})
export class OutlineModule {}
