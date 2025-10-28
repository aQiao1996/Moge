import { post, del } from '@/lib/request';

/**
 * 创建新卷
 */
export async function createVolume(
  outlineId: string,
  data: { title: string; description?: string }
) {
  return post(`/outline/${outlineId}/volume`, data);
}

/**
 * 创建直接章节（无卷）
 */
export async function createChapter(outlineId: string, data: { title: string; content?: string }) {
  return post(`/outline/${outlineId}/chapter`, data);
}

/**
 * 在指定卷下创建章节
 */
export async function createChapterInVolume(
  outlineId: string,
  volumeId: string,
  data: { title: string; content?: string }
) {
  return post(`/outline/${outlineId}/volume/${volumeId}/chapter`, data);
}

/**
 * 删除卷
 */
export async function deleteVolume(outlineId: string, volumeId: string) {
  return del(`/outline/${outlineId}/volume/${volumeId}`);
}

/**
 * 删除章节
 */
export async function deleteChapter(outlineId: string, chapterId: string) {
  return del(`/outline/${outlineId}/chapter/${chapterId}`);
}
