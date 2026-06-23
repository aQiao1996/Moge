import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ManuscriptsService } from './manuscripts.service';

@Injectable()
export class ManuscriptsSchedulerService {
  private readonly logger = new Logger(ManuscriptsSchedulerService.name);

  constructor(private readonly manuscriptsService: ManuscriptsService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async publishDueChapters() {
    const result = await this.manuscriptsService.publishAllDueScheduledChapters();

    if (result.count > 0) {
      this.logger.log(`已发布 ${result.count} 个到期定时章节`);
    }
  }
}
