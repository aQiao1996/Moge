/**
 * 用户信息接口
 */
export interface User {
  id: string;
  username: string;
  email?: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 登录请求参数
 */
export interface LoginParams {
  username: string;
  password: string;
}

/**
 * 注册请求参数
 */
export interface RegisterParams {
  username: string;
  password: string;
  email?: string;
  name?: string;
}

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
