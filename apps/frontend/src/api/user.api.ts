/**
 * 用户管理相关 API 接口
 * 提供用户资料更新和密码修改功能
 */
import httpRequest from '@/lib/request';
import type { ProfileValues, ChangePasswordData } from '@moge/types';

interface ProfileResponse {
  id: string;
  username: string;
  email: string;
  name: string;
  avatarUrl: string;
}

/**
 * 更新用户资料
 * @param data 用户资料数据
 * @returns 更新后的用户资料
 */
export const updateProfileApi = async (data: ProfileValues): Promise<ProfileResponse> => {
  const response = await httpRequest.post<ProfileResponse>('/user/profile', data);
  return response.data;
};

/**
 * 修改用户密码
 * @param data 密码修改数据（旧密码、新密码）
 */
export const changePasswordApi = async (data: ChangePasswordData): Promise<void> => {
  await httpRequest.post('/auth/change-password', data);
};
