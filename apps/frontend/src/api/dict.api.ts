import httpRequest from '@/lib/request';
import type { Dict, CreateDictItemValues, UpdateDictItemValues } from '@moge/types';

export const getDictApi = (type: string) => {
  return httpRequest.get<Dict[]>('/dict', { params: { type } });
};

export const getDictStatisticsApi = () => {
  return httpRequest.get<{ categoryCode: string; count: number }[]>('/dict/statistics');
};

export const createDictItemApi = (data: CreateDictItemValues) => {
  return httpRequest.post<Dict>('/dict', data);
};

export const updateDictItemApi = (id: number, data: UpdateDictItemValues) => {
  return httpRequest.put<Dict>(`/dict/${id}`, data);
};

export const deleteDictItemApi = (id: number) => {
  return httpRequest.delete(`/dict/${id}`);
};

export const toggleDictItemApi = (id: number, isEnabled: boolean) => {
  return httpRequest.patch<Dict>(`/dict/${id}/toggle`, { isEnabled });
};
