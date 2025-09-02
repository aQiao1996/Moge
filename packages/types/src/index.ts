export interface User {
  id: number;
  name: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  code: number;
}
