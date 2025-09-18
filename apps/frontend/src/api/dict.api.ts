import httpRequest from '@/lib/request';
import type { Dict } from '@moge/types';

export const getDictApi = (type: string) => {
  return httpRequest.get<Dict[]>('/dict', { params: { type } });
};
