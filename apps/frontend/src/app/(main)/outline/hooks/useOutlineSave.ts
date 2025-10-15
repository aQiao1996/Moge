/**
 * 大纲保存 Hook
 *
 * 功能：
 * - 保存大纲内容
 * - 自动更新大纲状态（草稿 -> 已完成）
 * - 错误处理和加载状态管理
 */
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { updateOutlineContentApi, updateOutlineApi } from '@/api/outline.api';
import type { OutlineWithStructure } from '@moge/types';

interface UseOutlineSaveOptions {
  /** 大纲 ID */
  outlineId: string;
  /** 大纲数据 */
  outlineData: OutlineWithStructure | null;
  /** 保存成功回调 */
  onSuccess?: () => void;
}

interface UseOutlineSaveReturn {
  /** 是否正在保存 */
  isSaving: boolean;
  /** 保存大纲内容 */
  saveContent: (content: string) => Promise<void>;
}

/**
 * 大纲保存 Hook
 *
 * @example
 * const { isSaving, saveContent } = useOutlineSave({
 *   outlineId: '123',
 *   outlineData,
 *   onSuccess: () => console.log('保存成功'),
 * });
 */
export function useOutlineSave({
  outlineId,
  outlineData,
  onSuccess,
}: UseOutlineSaveOptions): UseOutlineSaveReturn {
  const [isSaving, setIsSaving] = useState(false);

  const saveContent = useCallback(
    async (content: string) => {
      if (!outlineId || !content) {
        toast.warning('内容为空，无法保存');
        return;
      }

      try {
        setIsSaving(true);
        await updateOutlineContentApi(outlineId, { content });

        // 如果当前状态是草稿且有内容，自动变更为已完成状态
        if (outlineData?.status === 'DRAFT' && content.trim()) {
          await updateOutlineApi(outlineId, { status: 'PUBLISHED' });
        }

        toast.success('保存成功！');
        onSuccess?.();
      } catch (error) {
        toast.error('保存失败，请重试');
        console.error('Save content error:', error);
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [outlineId, outlineData?.status, onSuccess]
  );

  return {
    isSaving,
    saveContent,
  };
}
