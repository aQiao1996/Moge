import httpRequest from '@/lib/request';
import type { CreateOutlineValues } from '@moge/types';

interface OutlineItem {
  id: string;
  name: string;
  type: string;
  era?: string;
  conflict?: string;
  tags?: string[];
  remark?: string;
}

export const createOutlineApi = async (data: CreateOutlineValues): Promise<OutlineItem> => {
  const response = await httpRequest.post<OutlineItem>('/outline', data);
  return response.data;
};

export const getOutlinesApi = async (): Promise<OutlineItem[]> => {
  const response = await httpRequest.get<OutlineItem[]>('/outline');
  return response.data;
};
