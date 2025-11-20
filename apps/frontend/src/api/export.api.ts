/**
 * 导出API
 */

import request from '@/lib/request';

export interface ExportPreviewResponse {
  content: string;
  format: 'txt' | 'markdown';
}

/**
 * 导出单个章节为TXT（下载文件）
 */
export async function exportChapterToTxt(chapterId: number): Promise<void> {
  const url = `/export/chapter/${chapterId}/txt`;

  // 直接使用fetch进行blob下载
  const response = await fetch(`/moge-api${url}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('auth-token') || ''}`,
    },
  });

  if (!response.ok) {
    throw new Error('导出失败');
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `chapter_${chapterId}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}

/**
 * 导出整个文稿为TXT（下载文件）
 */
export async function exportManuscriptToTxt(
  manuscriptId: number,
  options?: {
    includeMetadata?: boolean;
    preserveFormatting?: boolean;
  }
): Promise<void> {
  const params = new URLSearchParams();
  if (options?.includeMetadata) params.append('includeMetadata', 'true');
  if (options?.preserveFormatting) params.append('preserveFormatting', 'true');

  const url = `/export/manuscript/${manuscriptId}/txt?${params.toString()}`;

  // 直接使用fetch进行blob下载
  const response = await fetch(`/moge-api${url}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('auth-token') || ''}`,
    },
  });

  if (!response.ok) {
    throw new Error('导出失败');
  }

  // 从响应头获取文件名
  const contentDisposition = response.headers.get('content-disposition');
  let filename = `manuscript_${manuscriptId}.txt`;
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
    if (filenameMatch) {
      filename = decodeURIComponent(filenameMatch[1]);
    }
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}

/**
 * 导出整个文稿为Markdown（下载文件）
 */
export async function exportManuscriptToMarkdown(manuscriptId: number): Promise<void> {
  const url = `/export/manuscript/${manuscriptId}/markdown`;

  // 直接使用fetch进行blob下载
  const response = await fetch(`/moge-api${url}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('auth-token') || ''}`,
    },
  });

  if (!response.ok) {
    throw new Error('导出失败');
  }

  // 从响应头获取文件名
  const contentDisposition = response.headers.get('content-disposition');
  let filename = `manuscript_${manuscriptId}.md`;
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
    if (filenameMatch) {
      filename = decodeURIComponent(filenameMatch[1]);
    }
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}

/**
 * 批量导出章节
 */
export async function exportChaptersBatch(
  chapterIds: number[],
  format?: 'txt' | 'markdown'
): Promise<{ [chapterId: number]: string }> {
  const response = await request.post<{ [chapterId: number]: string }>('/export/chapters/batch', {
    chapterIds,
    format: format || 'txt',
  });
  return response.data;
}

/**
 * 预览导出内容
 */
export async function previewExport(
  type: 'chapter' | 'manuscript',
  id: number,
  format?: 'txt' | 'markdown'
): Promise<ExportPreviewResponse> {
  const response = await request.get<ExportPreviewResponse>(`/export/preview/${type}/${id}`, {
    format: format || 'txt',
  });
  return response.data;
}
