import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * 公共路由装饰器
 * @description 用于标记不需要 JWT 认证的公共接口
 * @param isPublic 是否公开, 默认为 true
 */
export const Public = (isPublic = true) => SetMetadata(IS_PUBLIC_KEY, isPublic);
