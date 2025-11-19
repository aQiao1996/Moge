/**
 * 统一搜索API
 * 用于 @ 引用系统
 */

import request from '@/lib/request';

/** 搜索结果项类型 */
export interface SearchResult {
  id: number;
  type: 'character' | 'system' | 'world' | 'misc';
  name: string;
  description: string;
  projectId: number | null;
}

/** 搜索响应类型 */
interface SearchResponse {
  success: boolean;
  data: SearchResult[];
  total: number;
}

/**
 * 统一搜索设定
 * @param q 搜索关键词
 * @param projectId 项目ID（可选）
 * @returns 搜索结果列表
 */
export async function searchSettings(q: string, projectId?: number): Promise<SearchResult[]> {
  const params = new URLSearchParams({ q });
  if (projectId) {
    params.append('projectId', projectId.toString());
  }

  const { data } = await request.get<SearchResponse>(`/search/settings?${params.toString()}`);
  return data?.data || [];
}

/**
 * 获取设定详情
 * @param type 设定类型
 * @param id 设定ID
 * @returns 设定详情
 */
export async function getSettingDetail(type: string, id: number) {
  const response = await request.get(`/search/setting?type=${type}&id=${id}`);
  return response.data;
}
