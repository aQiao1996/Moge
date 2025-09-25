import httpRequest from '@/lib/request';
import type { ProfileValues, PasswordData } from '@moge/types';

interface ProfileResponse {
  id: string;
  username: string;
  email: string;
  name: string;
  avatarUrl: string;
}

export const updateProfileApi = async (data: ProfileValues): Promise<ProfileResponse> => {
  const response = await httpRequest.post<ProfileResponse>('/user/profile', data);
  return response.data;
};

export const changePasswordApi = async (data: PasswordData): Promise<void> => {
  await httpRequest.post('/auth/change-password', data);
};
