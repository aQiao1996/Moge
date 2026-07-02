import type { ApiResponse } from './api';

const numericCodeResponse: ApiResponse<{ ok: true }> = {
  code: 200,
  message: 'success',
  data: { ok: true },
};

void numericCodeResponse;
