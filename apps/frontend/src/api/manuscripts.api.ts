/**
 * 文稿相关 API
 */

import request from '@/lib/request';

export interface ChapterVersion {
  id: number;
  contentId: number;
  version: number;
  content: string;
  createdAt: string;
}

export interface UserStats {
  totalWords: number;
  publishedWords: number;
  totalChapters: number;
  publishedChapters: number;
  totalManuscripts: number;
  completedManuscripts: number;
  inProgressManuscripts: number;
  dailyStats: Record<string, number>;
}

/**
 * 获取章节版本历史
 */
export async function getChapterVersions(chapterId: number): Promise<ChapterVersion[]> {
  const response = await request.get(`/manuscripts/chapters/${chapterId}/versions`);
  return response.data as ChapterVersion[];
}

/**
 * 恢复章节到指定版本
 */
export async function restoreChapterVersion(chapterId: number, version: number) {
  const response = await request.post(
    `/manuscripts/chapters/${chapterId}/versions/${version}/restore`
  );
  return response.data;
}

/**
 * 获取用户的写作统计数据
 */
export async function getUserStats(): Promise<UserStats> {
  const response = await request.get('/manuscripts/stats');
  return response.data as UserStats;
}
