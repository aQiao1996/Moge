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
