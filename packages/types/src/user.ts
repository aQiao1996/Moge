/**
 * 更新个人信息输入
 */
export interface UpdateProfileInput {
  name?: string;
  email?: string;
  avatarUrl?: string;
}

/**
 * 用户信息接口
 */
export interface User {
  id: string;
  username: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}
