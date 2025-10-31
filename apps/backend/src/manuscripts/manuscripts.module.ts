import { Module } from '@nestjs/common';
import { ManuscriptsController } from './manuscripts.controller';
import { ManuscriptsService } from './manuscripts.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * 文稿模块
 */
@Module({
  imports: [PrismaModule],
  controllers: [ManuscriptsController],
  providers: [ManuscriptsService],
  exports: [ManuscriptsService],
})
export class ManuscriptsModule {}
