/**
 * 大纲智能生成 Hook
 *
 * 功能：
 * - 使用 SSE (Server-Sent Events) 流式生成大纲内容
 * - 实时更新生成进度
 * - 错误处理和状态管理
 */
import { useState, useCallback } from 'react';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

interface UseOutlineGenerateOptions {
  /** 大纲 ID */
  outlineId: string;
  /** 生成完成回调 */
  onComplete?: () => void;
  /** 生成错误回调 */
  onError?: (error: string) => void;
}

interface UseOutlineGenerateReturn {
  /** 是否正在生成 */
  isGenerating: boolean;
  /** 当前生成的内容 */
  content: string;
  /** 开始生成 */
  generate: () => void;
  /** 重置状态 */
  reset: () => void;
}

/**
 * 大纲智能生成 Hook
 *
 * @example
 * const { isGenerating, content, generate } = useOutlineGenerate({
 *   outlineId: '123',
 *   onComplete: () => console.log('生成完成'),
 * });
 */
export function useOutlineGenerate({
  outlineId,
  onComplete,
  onError,
}: UseOutlineGenerateOptions): UseOutlineGenerateReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState('');

  const reset = useCallback(() => {
    setContent('');
    setIsGenerating(false);
  }, []);

  const generate = useCallback(() => {
    if (!outlineId) {
      toast.error('大纲 ID 缺失');
      return;
    }

    setIsGenerating(true);
    setContent('');
    toast.info('正在生成大纲内容，请稍候...');

    const token = useAuthStore.getState().token;
    const baseUrl = process.env.NEXT_APP_BASE_URL ?? '';

    const eventSource = new EventSourcePolyfill(
      `${baseUrl}/moge-api/outline/${outlineId}/generate-stream`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    let errorHandled = false;

    eventSource.onmessage = function (this, event) {
      try {
        if (!event.data) {
          console.error('EventSource data is missing');
          return;
        }

        let eventData: string;
        if (typeof event.data === 'string') {
          eventData = event.data;
        } else {
          eventData = String(event.data);
        }

        const parsed = JSON.parse(eventData) as { type?: string; data?: string };
        const { type, data } = parsed;

        if (type === 'content') {
          if (data && typeof data === 'string') {
            // 检查是否是错误消息
            try {
              const errorCheck = JSON.parse(data) as unknown;
              if (
                errorCheck &&
                typeof errorCheck === 'object' &&
                errorCheck !== null &&
                'error' in errorCheck
              ) {
                const errorObj = errorCheck as { error?: { message?: string } };
                if (errorObj.error && typeof errorObj.error.message === 'string') {
                  const errorMessage = errorObj.error.message;
                  toast.error(errorMessage);
                  onError?.(errorMessage);
                  errorHandled = true;
                  return;
                }
              }
            } catch {
              // 不是 JSON 格式，说明是正常内容
            }

            setContent((prev) => prev + data);
          }
          return;
        }

        if (type === 'complete') {
          eventSource.close();
          setIsGenerating(false);
          if (!errorHandled) {
            toast.success('生成完成！');
            onComplete?.();
          }
          return;
        }
      } catch (error) {
        console.error('Failed to parse EventSource message:', error);
      }
    };

    eventSource.onerror = function (this, error) {
      console.error('EventSource failed:', error);
      if (!errorHandled) {
        const errorMessage = '生成时发生网络错误';
        toast.error(errorMessage);
        onError?.(errorMessage);
      }
      eventSource.close();
      setIsGenerating(false);
    };
  }, [outlineId, onComplete, onError]);

  return {
    isGenerating,
    content,
    generate,
    reset,
  };
}
