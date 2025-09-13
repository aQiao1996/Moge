import { callTrpcApi } from './client';
import type { User, LoginParams, RegisterParams, AuthResponse } from '@moge/types';

/**
 * 认证相关 API
 */
export const authApi = {
  /**
   * 用户登录
   * @param params 登录参数
   * @returns 登录结果
   */
  async login(params: LoginParams): Promise<AuthResponse> {
    const result = await callTrpcApi('auth.login', params);
    return result as AuthResponse;
  },

  /**
   * 用户注册
   * @param params 注册参数
   * @returns 注册结果
   */
  async register(params: RegisterParams): Promise<AuthResponse> {
    const result = await callTrpcApi('auth.register', params);
    return result as AuthResponse;
  },

  /**
   * 获取当前用户信息
   * @param token 认证令牌
   * @returns 用户信息
   */
  async getCurrentUser(token: string): Promise<User> {
    const result = await callTrpcApi('auth.me', undefined, token);
    return result as User;
  },

  /**
   * 刷新令牌
   * @param token 当前令牌
   * @returns 新的令牌信息
   */
  async refreshToken(token: string): Promise<{ token: string }> {
    const result = await callTrpcApi('auth.refresh', undefined, token);
    return result as { token: string };
  },

  /**
   * 用户登出
   * @param token 认证令牌
   */
  async logout(token: string): Promise<void> {
    await callTrpcApi('auth.logout', undefined, token);
  },
};
