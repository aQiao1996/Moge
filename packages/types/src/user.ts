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
