/**
 * 工作台API
 */

import request from '@/lib/request';

/** 工作台汇总数据类型 */
export interface WorkspaceSummary {
  recentProjects: Array<{
    id: number;
    name: string;
    type: string;
    description?: string;
    updatedAt: string;
  }>;
  recentOutlines: Array<{
    id: number;
    name: string;
    type: string;
    status: string;
    updatedAt: string;
  }>;
  recentManuscripts: Array<{
    id: number;
    name: string;
    status: string;
    totalWords: number;
    lastEditedAt?: string;
    lastEditedChapterId?: number;
  }>;
  stats: {
    todayWords: number;
    weekWords: number;
    totalWords: number;
    projectCount: number;
    manuscriptCount: number;
  };
}

/** 写作统计数据类型 */
export interface WritingStats {
  todayWords: number;
  weekWords: number;
  totalWords: number;
}

/**
 * 获取工作台汇总数据
 */
export async function getWorkspaceSummary(): Promise<WorkspaceSummary> {
  const response = await request.get<{ success: boolean; data: WorkspaceSummary }>(
    '/workspace/summary'
  );
  return response.data.data;
}

/**
 * 获取写作统计
 */
export async function getWritingStats(): Promise<WritingStats> {
  const response = await request.get<{ success: boolean; data: WritingStats }>('/workspace/stats');
  return response.data.data;
}
