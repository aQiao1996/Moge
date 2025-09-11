import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    console.log('🚀 ~ PrismaService ~ 数据库连接成功');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
