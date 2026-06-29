import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { DictModule } from './dict/dict.module';
import { OutlineModule } from './outline/outline.module';
import { SettingsModule } from './settings/settings.module';
import { ProjectsModule } from './projects/projects.module';
import { ManuscriptsModule } from './manuscripts/manuscripts.module';
import { SearchModule } from './search/search.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { ExportModule } from './export/export.module';
import { AiJobsModule } from './ai-jobs/ai-jobs.module';
import { AI_JOB_PROCESSORS, AiJobsWorkerService } from './ai-jobs/ai-jobs-worker.service';
import { AppAiJobProcessorsService } from './ai-jobs/app-ai-job-processors.service';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RateLimitMiddleware } from './common/rate-limit.middleware';
import { SecurityHeadersMiddleware } from './common/security-headers.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}.local`,
        '.env.local',
        `.env.${process.env.NODE_ENV || 'development'}`,
      ],
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UserModule,
    DictModule,
    OutlineModule,
    SettingsModule,
    ProjectsModule,
    ManuscriptsModule,
    SearchModule,
    WorkspaceModule,
    ExportModule,
    AiJobsModule,
  ],
  controllers: [AppController],
  providers: [
    AppAiJobProcessorsService,
    {
      provide: AI_JOB_PROCESSORS,
      useExisting: AppAiJobProcessorsService,
    },
    AiJobsWorkerService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityHeadersMiddleware, RateLimitMiddleware).forRoutes('*');
  }
}
