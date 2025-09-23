import httpRequest from '@/lib/request';
import type {
  CreateOutlineValues,
  Outline,
  OutlineContent,
  OutlineWithStructure,
  UpdateOutlineContentValues,
  UpdateOutlineValues,
} from '@moge/types';

interface GetOutlinesResponse {
  list: Outline[];
  total: number;
}

interface GetOutlinesParams {
  pageNum?: number;
  pageSize?: number;
  search?: string;
  type?: string;
  era?: string;
  tags?: string[];
  sortBy?: 'name' | 'createdAt' | 'type';
  sortOrder?: 'asc' | 'desc';
}

export const createOutlineApi = async (data: CreateOutlineValues): Promise<Outline> => {
  const response = await httpRequest.post<Outline>('/outline', data);
  return response.data;
};

export const getOutlinesApi = async (params: GetOutlinesParams): Promise<GetOutlinesResponse> => {
  // 过滤掉 undefined、null、空字符串和空数组
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      if (value === undefined || value === null || value === '') {
        return false;
      }
      if (Array.isArray(value) && value.length === 0) {
        return false;
      }
      return true;
    })
  );

  const response = await httpRequest.get<GetOutlinesResponse>('/outline', filteredParams);
  return response.data;
};

export const getOutlineByIdApi = async (id: string): Promise<Outline> => {
  const response = await httpRequest.get<Outline>(`/outline/${id}`);
  return response.data;
};

// 获取大纲详情（包含完整的卷、章节和内容结构）
export const getOutlineDetailApi = async (id: string): Promise<OutlineWithStructure> => {
  const response = await httpRequest.get<OutlineWithStructure>(`/outline/${id}/detail`);
  return response.data;
};

// 保留旧的 API 以兼容现有代码，但标记为已废弃
/** @deprecated 使用 getOutlineWithStructureApi 替代 */
export const getOutlineContentApi = async (id: string): Promise<OutlineContent | null> => {
  try {
    const response = await httpRequest.get<OutlineContent>(`/outline/${id}/content`);
    return response.data;
  } catch {
    // 如果内容不存在，返回 null
    return null;
  }
};

export const updateOutlineContentApi = async (
  id: string,
  data: UpdateOutlineContentValues
): Promise<OutlineContent> => {
  const response = await httpRequest.put<OutlineContent>(`/outline/${id}/content`, data);
  return response.data;
};

export const updateOutlineApi = async (id: string, data: UpdateOutlineValues): Promise<Outline> => {
  const response = await httpRequest.patch<Outline>(`/outline/${id}`, data);
  return response.data;
};

export const deleteOutlineApi = async (id: string): Promise<void> => {
  await httpRequest.delete(`/outline/${id}`);
};
