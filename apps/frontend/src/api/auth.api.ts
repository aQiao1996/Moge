/**
 * 认证相关 API 接口
 * 提供用户登录、注册、登出功能
 */
import httpRequest from '@/lib/request';
import type { LoginData, SignupData } from '@moge/types';

interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    name: string;
    avatarUrl: string;
  };
}

/**
 * 用户登录接口
 * @param data 登录数据（用户名/邮箱 + 密码）
 * @returns 认证响应（token 和用户信息）
 */
export const loginApi = async (data: LoginData): Promise<AuthResponse> => {
  const response = await httpRequest.post<AuthResponse>('/auth/login', data, {
    requiresToken: false,
  });
  return response.data;
};

/**
 * 用户注册接口
 * @param data 注册数据（用户名 + 密码 + 确认密码）
 * @returns 认证响应（token 和用户信息）
 */
export const registerApi = async (data: SignupData): Promise<AuthResponse> => {
  const response = await httpRequest.post<AuthResponse>('/auth/register', data, {
    requiresToken: false,
  });
  return response.data;
};

/**
 * 用户登出接口
 * @returns 无返回值
 */
export const logoutApi = async (): Promise<undefined> => {
  await httpRequest.post<void>('/auth/logout');
};
