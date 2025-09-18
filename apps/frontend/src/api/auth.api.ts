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

export const loginApi = async (data: LoginData): Promise<AuthResponse> => {
  const response = await httpRequest.post<AuthResponse>('/auth/login', data, {
    requiresToken: false,
  });
  return response.data;
};

export const registerApi = async (data: SignupData): Promise<AuthResponse> => {
  const response = await httpRequest.post<AuthResponse>('/auth/register', data, {
    requiresToken: false,
  });
  return response.data;
};

export const logoutApi = async (): Promise<undefined> => {
  await httpRequest.post<void>('/auth/logout');
};
