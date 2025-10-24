import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  /**
   * 处理认证错误,将英文错误消息转换为中文
   */
  handleRequest<TUser = unknown>(err: Error | null, user: TUser, info: Error | null): TUser {
    // 如果有错误或没有用户信息,抛出中文错误
    if (err || !user) {
      // 处理JWT相关的错误消息
      if (info) {
        const errorMessage = info.message || '';

        // JWT过期
        if (errorMessage.includes('jwt expired') || errorMessage.includes('TokenExpiredError')) {
          throw new UnauthorizedException('登录已过期，请重新登录');
        }

        // JWT格式错误
        if (errorMessage.includes('jwt malformed') || errorMessage.includes('JsonWebTokenError')) {
          throw new UnauthorizedException('登录凭证无效，请重新登录');
        }

        // JWT签名无效
        if (errorMessage.includes('invalid signature')) {
          throw new UnauthorizedException('登录凭证无效，请重新登录');
        }

        // 没有提供token
        if (errorMessage.includes('No auth token')) {
          throw new UnauthorizedException('未提供登录凭证，请先登录');
        }
      }

      // 默认错误消息
      throw err || new UnauthorizedException('身份验证失败，请重新登录');
    }

    return user;
  }
}
