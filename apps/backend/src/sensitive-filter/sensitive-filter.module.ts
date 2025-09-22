import { Module } from '@nestjs/common';
import { SensitiveFilterService } from './sensitive-filter.service';

@Module({
  providers: [SensitiveFilterService],
  exports: [SensitiveFilterService],
})
export class SensitiveFilterModule {}
