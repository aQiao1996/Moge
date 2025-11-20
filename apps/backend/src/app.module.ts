import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      isGlobal: true,
    }),
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
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
