import httpRequest from '@/lib/httpRequest';
import type { LoginValues, SignupValues } from '@moge/types';

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

export const loginApi = async (data: LoginValues): Promise<AuthResponse> => {
  const response = await httpRequest.post<AuthResponse>('/api/auth/login', data);
  return response.data;
};

export const registerApi = async (data: SignupValues): Promise<AuthResponse> => {
  const response = await httpRequest.post<AuthResponse>('/api/auth/register', data);
  return response.data;
};

export const logoutApi = async (): Promise<undefined> => {
  await httpRequest.post<void>('/api/auth/logout');
};
