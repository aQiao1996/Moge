import { Module } from '@nestjs/common';
import { OutlineController } from './outline.controller';
import { OutlineService } from './outline.service';
import { AIModule } from '../ai/ai.module';

import { SensitiveFilterModule } from '../sensitive-filter/sensitive-filter.module';

@Module({
  imports: [AIModule, SensitiveFilterModule],
  controllers: [OutlineController],
  providers: [OutlineService],
})
export class OutlineModule {}
