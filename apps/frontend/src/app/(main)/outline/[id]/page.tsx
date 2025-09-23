'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Edit, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import MdViewer from '@/app/components/MdViewer';
import { getOutlineByIdApi, getOutlineContentApi } from '@/api/outline.api';
import { EventSourcePolyfill } from 'event-source-polyfill';
import type { Outline } from '@moge/types';
import { useAuthStore } from '@/stores/authStore';

export default function OutlineViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [outline, setOutline] = useState<Outline | null>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const [outlineData, contentData] = await Promise.all([
          getOutlineByIdApi(id),
          getOutlineContentApi(id),
        ]);

        setOutline(outlineData);
        setContent(contentData?.content ?? '');
      } catch (error) {
        toast.error('加载大纲数据失败');
        console.error('Load outline data error:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [id]);

  const handleGenerate = async () => {
    if (!id) return;

    if (content) {
      const confirmed = await new Promise((resolve) => {
        toast.warning('智能生成会覆盖当前内容，确定要继续吗？', {
          action: {
            label: '确定',
            onClick: () => resolve(true),
          },
          onDismiss: () => resolve(false),
          onAutoClose: () => resolve(false),
        });
      });
      if (!confirmed) {
        return;
      }
    }

    setIsGenerating(true);
    setContent('');
    toast.info('正在生成大纲内容，请稍候...');

    const token = useAuthStore.getState().token;
    const baseUrl = process.env.NEXT_APP_BASE_URL ?? '';

    const eventSource = new EventSourcePolyfill(
      `${baseUrl}/moge-api/outline/${id}/generate-stream`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    let errorHandled = false;

    eventSource.onmessage = function (this, event) {
      try {
        // 确保 event.data 存在且是字符串
        if (!event.data) {
          console.error('EventSource data is missing');
          return;
        }

        // 明确处理 event.data 的类型
        let eventData: string;
        if (typeof event.data === 'string') {
          eventData = event.data;
        } else {
          // 如果不是字符串，尝试转换
          eventData = String(event.data);
        }

        const parsed = JSON.parse(eventData) as { type?: string; data?: string };
        const { type, data } = parsed;

        // 处理内容数据
        if (type === 'content') {
          // 检查是否是错误消息
          if (data && typeof data === 'string') {
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
                  toast.error(errorObj.error.message);
                  errorHandled = true;
                  return;
                }
              }
            } catch {
              // 不是 JSON 格式，说明是正常内容
            }

            // 拼接正常内容
            setContent((prev) => prev + data);
          }
          return;
        }

        // 处理完成信号
        if (type === 'complete') {
          eventSource.close();
          setIsGenerating(false);
          if (!errorHandled) {
            toast.success('生成完成！');
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
        toast.error('生成时发生网络错误');
      }
      eventSource.close();
      setIsGenerating(false);
    };
  };

  const handleEdit = () => {
    router.push(`/outline/${id}/edit`);
  };

  const handleBack = () => {
    router.push('/outline');
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="bg-muted h-12 rounded-md" />
          <div className="bg-muted h-96 rounded-md" />
        </div>
      </div>
    );
  }

  if (!outline) {
    return (
      <div className="container mx-auto max-w-6xl p-6">
        <Card className="p-10 text-center">
          <p className="text-muted-foreground">大纲不存在</p>
          <Button onClick={handleBack} className="mt-4">
            返回列表
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl p-6">
      {/* 头部 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{outline.name}</h1>
            <p className="text-muted-foreground text-sm">
              {outline.type} · {outline.era} · {outline.status}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => void handleGenerate()} disabled={isGenerating} variant="outline">
            <Sparkles className="mr-2 h-4 w-4" />
            {isGenerating ? '生成中...' : '智能生成'}
          </Button>
          <Button onClick={handleEdit} disabled={!content || isGenerating}>
            <Edit className="mr-2 h-4 w-4" />
            编辑
          </Button>
        </div>
      </div>

      {/* 内容展示 */}
      <Card className="p-6" style={{ minHeight: 600 }}>
        {content ? (
          <MdViewer md={content} />
        ) : (
          <div className="flex h-[550px] flex-col items-center justify-center text-center">
            <div className="space-y-4">
              <p className="text-muted-foreground">
                当前大纲内容为空，点击上方按钮开始生成或编辑内容。
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
