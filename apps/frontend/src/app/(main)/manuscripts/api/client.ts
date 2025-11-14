import { get, post, put, del } from '@/lib/request';
import type {
  Manuscript,
  ManuscriptVolume,
  ManuscriptChapter,
  ManuscriptChapterContent,
  CreateManuscriptValues,
  UpdateManuscriptValues,
  CreateVolumeValues,
  UpdateVolumeValues,
  CreateChapterValues,
  UpdateChapterValues,
  SaveChapterContentValues,
  ManuscriptSettings,
} from '@moge/types';

// ==================== Manuscript APIs ====================

/**
 * 创建文稿
 */
export async function createManuscript(data: CreateManuscriptValues) {
  return post<Manuscript>('/manuscripts', data);
}

/**
 * 从大纲创建文稿
 */
export async function createManuscriptFromOutline(outlineId: number) {
  return post<Manuscript>(`/manuscripts/from-outline/${outlineId}`);
}

/**
 * 获取所有文稿
 */
export async function getManuscripts() {
  return get<Manuscript[]>('/manuscripts');
}

/**
 * 获取单个文稿
 */
export async function getManuscript(id: number) {
  return get<Manuscript>(`/manuscripts/${id}`);
}

/**
 * 更新文稿
 */
export async function updateManuscript(id: number, data: UpdateManuscriptValues) {
  return put<Manuscript>(`/manuscripts/${id}`, data);
}

/**
 * 删除文稿（软删除）
 */
export async function deleteManuscript(id: number) {
  return del<void>(`/manuscripts/${id}`);
}

/**
 * 获取文稿设定
 */
export async function getManuscriptSettings(id: number) {
  return get<ManuscriptSettings>(`/manuscripts/${id}/settings`);
}

// ==================== Volume APIs ====================

/**
 * 创建卷
 */
export async function createVolume(data: CreateVolumeValues) {
  return post<ManuscriptVolume>('/manuscripts/volumes', data);
}

/**
 * 更新卷
 */
export async function updateVolume(volumeId: number, data: UpdateVolumeValues) {
  return put<ManuscriptVolume>(`/manuscripts/volumes/${volumeId}`, data);
}

/**
 * 删除卷
 */
export async function deleteVolume(volumeId: number) {
  return del<void>(`/manuscripts/volumes/${volumeId}`);
}

/**
 * 批量更新卷排序
 */
export async function reorderVolumes(volumeIds: number[]) {
  return put<{ success: boolean }>('/manuscripts/volumes/reorder', { volumeIds });
}

// ==================== Chapter APIs ====================

/**
 * 创建章节
 */
export async function createChapter(data: CreateChapterValues) {
  return post<ManuscriptChapter>('/manuscripts/chapters', data);
}

/**
 * 更新章节
 */
export async function updateChapter(chapterId: number, data: UpdateChapterValues) {
  return put<ManuscriptChapter>(`/manuscripts/chapters/${chapterId}`, data);
}

/**
 * 删除章节
 */
export async function deleteChapter(chapterId: number) {
  return del<void>(`/manuscripts/chapters/${chapterId}`);
}

/**
 * 获取章节内容
 */
export async function getChapterContent(chapterId: number) {
  return get<ManuscriptChapterContent>(`/manuscripts/chapters/${chapterId}/content`);
}

/**
 * 保存章节内容
 */
export async function saveChapterContent(chapterId: number, data: SaveChapterContentValues) {
  return put<ManuscriptChapterContent>(`/manuscripts/chapters/${chapterId}/content`, data);
}

/**
 * 发布章节
 */
export async function publishChapter(chapterId: number) {
  return post<ManuscriptChapter>(`/manuscripts/chapters/${chapterId}/publish`);
}

/**
 * 取消发布章节
 */
export async function unpublishChapter(chapterId: number) {
  return post<ManuscriptChapter>(`/manuscripts/chapters/${chapterId}/unpublish`);
}

/**
 * 批量发布章节
 */
export async function batchPublishChapters(chapterIds: number[]) {
  return post<{ success: boolean; count: number }>('/manuscripts/chapters/batch-publish', {
    chapterIds,
  });
}

/**
 * 批量更新章节排序
 */
export async function reorderChapters(chapterIds: number[]) {
  return put<{ success: boolean }>('/manuscripts/chapters/reorder', { chapterIds });
}

// ==================== AI APIs ====================

/**
 * AI 续写章节
 */
export async function aiContinueChapter(chapterId: number, customPrompt?: string) {
  return post<{ text: string }>(
    `/manuscripts/chapters/${chapterId}/ai/continue`,
    { customPrompt },
    { timeout: 30000 } // 增加超时时间到 30 秒，因为 AI 生成需要更长时间
  );
}

/**
 * AI 润色文本
 */
export async function aiPolishText(chapterId: number, text: string, customPrompt?: string) {
  return post<{ text: string }>(
    `/manuscripts/chapters/${chapterId}/ai/polish`,
    { text, customPrompt },
    { timeout: 30000 } // 增加超时时间到 30 秒，因为 AI 生成需要更长时间
  );
}

/**
 * AI 扩写文本
 */
export async function aiExpandText(chapterId: number, text: string, customPrompt?: string) {
  return post<{ text: string }>(
    `/manuscripts/chapters/${chapterId}/ai/expand`,
    { text, customPrompt },
    { timeout: 30000 } // 增加超时时间到 30 秒，因为 AI 生成需要更长时间
  );
}

// Re-export types for convenience
export type {
  Manuscript,
  ManuscriptVolume,
  ManuscriptChapter,
  ManuscriptChapterContent,
  CreateManuscriptValues,
  UpdateManuscriptValues,
  CreateVolumeValues,
  UpdateVolumeValues,
  CreateChapterValues,
  UpdateChapterValues,
  SaveChapterContentValues,
  ManuscriptSettings,
};
