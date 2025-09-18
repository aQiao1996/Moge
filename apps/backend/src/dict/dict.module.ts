import { Module } from '@nestjs/common';
import { DictService } from './dict.service';
import { DictController } from './dict.controller';

@Module({
  controllers: [DictController],
  providers: [DictService],
})
export class DictModule {}
