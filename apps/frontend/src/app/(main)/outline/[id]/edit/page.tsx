'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import MdEditor from '@/app/components/MdEditor';
import {
  getOutlineByIdApi,
  getOutlineContentApi,
  updateOutlineContentApi,
} from '@/api/outline.api';
import { EventSourcePolyfill } from 'event-source-polyfill';
import type { Outline } from '@moge/types';
import { useAuthStore } from '@/stores/authStore';

export default function OutlineEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [outline, setOutline] = useState<Outline | null>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const handleSave = async () => {
    if (!id) return;

    try {
      setSaving(true);
      await updateOutlineContentApi(id, { content });
      toast.success('保存成功');
    } catch (error) {
      toast.error('保存失败');
      console.error('Save content error:', error);
    } finally {
      setSaving(false);
    }
  };

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
        const parsed: unknown = JSON.parse(event.data as string);
        if (parsed && typeof parsed === 'object' && 'error' in parsed) {
          const errorObj = parsed as Record<string, unknown>;
          const error = errorObj.error as Record<string, unknown> | undefined;
          if (error && typeof error.message === 'string') {
            toast.error(error.message);
            errorHandled = true;
            // 不追加内容，只返回。流将被__DONE__关闭。
            return;
          }
        }
      } catch (error) {
        console.log('🚀 ~ page.tsx:112 ~ handleGenerate ~ error:', error);
      }

      if (event.data === '__DONE__') {
        eventSource.close();
        setIsGenerating(false);
        if (!errorHandled) {
          toast.success('生成完成！');
        }
        return;
      }

      // 拼接流
      setContent((prev) => prev + event.data);
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
          <Button
            onClick={() => void handleGenerate()}
            disabled={isGenerating || saving}
            variant="outline"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {isGenerating ? '生成中...' : '智能生成'}
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving || isGenerating}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>

      {/* 编辑器 */}
      <Card className="p-6" style={{ minHeight: 600 }}>
        {content ? (
          <MdEditor
            value={content}
            onChange={setContent}
            placeholder="开始编写你的大纲内容..."
            height={600}
            className="border-0"
          />
        ) : (
          <div className="flex h-[550px] flex-col items-center justify-center text-center">
            <div className="space-y-4">
              <p className="text-muted-foreground">
                当前大纲内容为空，开始手动编写或让 AI 为你生成。
              </p>
              <Button onClick={() => void handleGenerate()} disabled={isGenerating}>
                <Sparkles className="mr-2 h-4 w-4" />
                {isGenerating ? '生成中...' : '🚀 智能生成'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
