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
interface SearchListResponse {
  items: SearchResult[];
  total: number;
}

export interface BacklinkItem {
  id: number;
  type: 'outline_chapter' | 'manuscript_chapter';
  title: string;
  parentTitle: string;
  updatedAt: string;
}

interface BacklinkListResponse {
  items: BacklinkItem[];
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

  const { data } = await request.get<SearchListResponse>(`/search/settings?${params.toString()}`);
  return data.items;
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

/**
 * 获取设定反向链接
 * @param type 设定类型
 * @param id 设定ID
 * @returns 引用了该设定的大纲/文稿章节
 */
export async function getBacklinks(
  type: 'character' | 'system' | 'world' | 'misc',
  id: number
): Promise<BacklinkItem[]> {
  const params = new URLSearchParams({ type, id: id.toString() });
  const { data } = await request.get<BacklinkListResponse>(`/search/backlinks?${params}`);
  return data.items;
}
