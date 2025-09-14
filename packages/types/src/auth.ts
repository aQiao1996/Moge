import type { User } from './user';

/**
 * 认证响应结果
 */
export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
  expiresIn?: number;
  message?: string;
}

/**
 * 刷新令牌响应
 */
export interface RefreshTokenResponse {
  token: string;
  refreshToken?: string;
  expiresIn?: number;
}
