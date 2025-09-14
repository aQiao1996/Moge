import { Module } from '@nestjs/common';
import { TrpcService } from './trpc.service';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';

/**
 * tRPC 模块
 * 提供 tRPC 服务和路由配置
 */
@Module({
  imports: [AuthModule, UserModule],
  providers: [TrpcService],
  exports: [TrpcService],
})
export class TrpcModule {}
