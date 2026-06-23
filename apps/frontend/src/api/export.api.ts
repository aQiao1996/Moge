/**
 * 导出API
 */

import request from '@/lib/request';

export interface ExportPreviewResponse {
  content: string;
  format: 'txt' | 'markdown';
}

export interface BatchExportFailure {
  chapterId: number;
  message: string;
}

export interface BatchExportResponse {
  items: { [chapterId: number]: string };
  failures: BatchExportFailure[];
  total: number;
  successCount: number;
  failureCount: number;
}

interface ExportErrorResponse {
  message?: string;
}

async function downloadExportFile(url: string, fallbackFilename: string): Promise<void> {
  const response = await fetch(`/moge-api${url}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('auth-token') || ''}`,
    },
  });

  if (!response.ok) {
    throw new Error(await getExportErrorMessage(response, '导出失败'));
  }

  const contentDisposition = response.headers.get('content-disposition');
  let filename = fallbackFilename;
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

async function getExportErrorMessage(response: Response, fallback: string): Promise<string> {
  const contentType = response.headers.get('content-type');

  try {
    if (contentType?.includes('application/json')) {
      const payload = (await response.json()) as ExportErrorResponse;
      if (payload.message) {
        return payload.message;
      }
    } else {
      const text = await response.text();
      if (text) {
        return text;
      }
    }
  } catch {
    // 忽略解析错误，回退到兜底文案
  }

  return fallback;
}

/**
 * 导出单个章节为TXT（下载文件）
 */
export async function exportChapterToTxt(chapterId: number): Promise<void> {
  await downloadExportFile(`/export/chapter/${chapterId}/txt`, `chapter_${chapterId}.txt`);
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

  await downloadExportFile(
    `/export/manuscript/${manuscriptId}/txt?${params.toString()}`,
    `manuscript_${manuscriptId}.txt`
  );
}

/**
 * 导出整个文稿为Markdown（下载文件）
 */
export async function exportManuscriptToMarkdown(manuscriptId: number): Promise<void> {
  await downloadExportFile(
    `/export/manuscript/${manuscriptId}/markdown`,
    `manuscript_${manuscriptId}.md`
  );
}

/**
 * 导出整个文稿为EPUB（下载文件）
 */
export async function exportManuscriptToEpub(manuscriptId: number): Promise<void> {
  await downloadExportFile(
    `/export/manuscript/${manuscriptId}/epub`,
    `manuscript_${manuscriptId}.epub`
  );
}

/**
 * 导出整个文稿为DOCX（下载文件）
 */
export async function exportManuscriptToDocx(manuscriptId: number): Promise<void> {
  await downloadExportFile(
    `/export/manuscript/${manuscriptId}/docx`,
    `manuscript_${manuscriptId}.docx`
  );
}

/**
 * 批量导出章节
 */
export async function exportChaptersBatch(
  chapterIds: number[],
  format?: 'txt' | 'markdown'
): Promise<BatchExportResponse> {
  const response = await request.post<BatchExportResponse>('/export/chapters/batch', {
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
