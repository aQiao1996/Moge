import httpRequest from '@/lib/httpRequest';
import type { ProfileValues } from '@moge/types';

interface ProfileResponse {
  id: string;
  username: string;
  email: string;
  name: string;
  avatarUrl: string;
}

export const updateProfileApi = async (data: ProfileValues): Promise<ProfileResponse> => {
  const response = await httpRequest.post<ProfileResponse>('/api/user/profile', data);
  return response.data;
};
