export interface User {
  id: number;
  username: string;
  email?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  code: number;
}
