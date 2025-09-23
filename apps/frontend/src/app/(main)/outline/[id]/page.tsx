'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ArrowLeft,
  Edit,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Book,
  FileText,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import MdViewer from '@/app/components/MdViewer';
import { getOutlineDetailApi, updateOutlineContentApi } from '@/api/outline.api';
import { EventSourcePolyfill } from 'event-source-polyfill';
import type { OutlineWithStructure } from '@moge/types';
import { useAuthStore } from '@/stores/authStore';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

export default function OutlineViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [outlineData, setOutlineData] = useState<OutlineWithStructure | null>(null);
  const [selectedContent, setSelectedContent] = useState<string>('');
  const [selectedTitle, setSelectedTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedVolumes, setExpandedVolumes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await getOutlineDetailApi(id);
        setOutlineData(data);

        // 默认显示大纲总体内容
        if (data.content?.content) {
          setSelectedContent(data.content.content);
          setSelectedTitle('大纲总览');
        }

        // 默认展开所有卷
        const volumeIds = new Set(
          data.volumes?.map((v) => v.id).filter((id): id is string => Boolean(id)) || []
        );
        setExpandedVolumes(volumeIds);
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

    if (selectedContent) {
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
    setSelectedContent('');
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

            setSelectedContent((prev) => prev + data);
          }
          return;
        }

        if (type === 'complete') {
          eventSource.close();
          setIsGenerating(false);
          // 生成完成后自动选中大纲总览
          setSelectedTitle('大纲总览');
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

  const handleSave = async () => {
    if (!id || !selectedContent || selectedTitle !== '大纲总览') {
      toast.warning('只能保存大纲总览内容');
      return;
    }

    try {
      setIsSaving(true);
      await updateOutlineContentApi(id, { content: selectedContent });
      toast.success('保存成功！');

      // 重新加载数据以更新版本号等信息
      const data = await getOutlineDetailApi(id);
      setOutlineData(data);
    } catch (error) {
      toast.error('保存失败，请重试');
      console.error('Save content error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    router.push(`/outline/${id}/edit`);
  };

  const handleBack = () => {
    router.push('/outline');
  };

  const toggleVolumeExpansion = (volumeId: string) => {
    setExpandedVolumes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(volumeId)) {
        newSet.delete(volumeId);
      } else {
        newSet.add(volumeId);
      }
      return newSet;
    });
  };

  const handleSelectContent = (content: string, title: string) => {
    setSelectedContent(content);
    setSelectedTitle(title);
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="bg-muted h-12 rounded-md" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <div className="bg-muted h-96 rounded-md" />
            <div className="bg-muted h-96 rounded-md lg:col-span-3" />
          </div>
        </div>
      </div>
    );
  }

  if (!outlineData) {
    return (
      <div className="container mx-auto max-w-7xl p-6">
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
    <div className="container mx-auto flex h-full max-w-7xl flex-col overflow-hidden p-6">
      {/* 头部 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{outlineData.name}</h1>
            <p className="text-muted-foreground text-sm">
              {outlineData.type} · {outlineData.era} · {outlineData.status}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => void handleGenerate()} disabled={isGenerating} variant="outline">
            <Sparkles className="mr-2 h-4 w-4" />
            {isGenerating ? '生成中...' : '智能生成'}
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={isSaving || isGenerating || !selectedContent || selectedTitle !== '大纲总览'}
            variant="outline"
            title={
              isSaving
                ? '保存中...'
                : isGenerating
                  ? '生成中，请等待...'
                  : !selectedContent
                    ? '暂无内容可保存'
                    : selectedTitle !== '大纲总览'
                      ? '只能保存大纲总览内容'
                      : '保存大纲内容'
            }
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? '保存中...' : '保存'}
          </Button>
          <Button onClick={handleEdit} disabled={isGenerating}>
            <Edit className="mr-2 h-4 w-4" />
            编辑
          </Button>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="grid flex-1 grid-cols-1 gap-6 overflow-hidden lg:grid-cols-4">
        {/* 左侧导航栏 */}
        <Card className="overflow-y-auto p-4">
          <h3 className="mb-4 font-semibold">大纲结构</h3>
          <div className="space-y-2">
            {/* 大纲总览 */}
            <Button
              variant="ghost"
              className={cn(
                'h-auto w-full justify-start p-2 text-left',
                selectedTitle === '大纲总览' && 'bg-accent'
              )}
              onClick={() => handleSelectContent(outlineData?.content?.content || '', '大纲总览')}
            >
              <Book className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="truncate">大纲总览</span>
            </Button>

            {/* 无卷的直接章节 */}
            {outlineData?.chapters?.map((chapter) => (
              <Button
                key={chapter.id}
                variant="ghost"
                className={cn(
                  'h-auto w-full justify-start p-2 text-left',
                  selectedTitle === chapter.title && 'bg-accent'
                )}
                onClick={() =>
                  handleSelectContent(chapter.content?.content || '', chapter.title || '')
                }
              >
                <FileText className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">{chapter.title}</span>
              </Button>
            )) || null}

            {/* 卷和章节 */}
            {outlineData?.volumes?.map((volume) => (
              <Collapsible
                key={volume.id}
                open={expandedVolumes.has(volume.id || '')}
                onOpenChange={() => toggleVolumeExpansion(volume.id || '')}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="h-auto w-full justify-start p-2 text-left">
                    {expandedVolumes.has(volume.id || '') ? (
                      <ChevronDown className="mr-2 h-4 w-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="mr-2 h-4 w-4 flex-shrink-0" />
                    )}
                    <span className="truncate font-medium">{volume.title}</span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="ml-6 space-y-1">
                  {volume.chapters?.map((chapter) => (
                    <Button
                      key={chapter.id}
                      variant="ghost"
                      className={cn(
                        'h-auto w-full justify-start p-2 text-left',
                        selectedTitle === chapter.title && 'bg-accent'
                      )}
                      onClick={() =>
                        handleSelectContent(chapter.content?.content || '', chapter.title || '')
                      }
                    >
                      <FileText className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{chapter.title}</span>
                    </Button>
                  )) || null}
                </CollapsibleContent>
              </Collapsible>
            )) || null}
          </div>
        </Card>

        {/* 右侧内容展示区域 */}
        <Card className="overflow-y-auto p-6 lg:col-span-3">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{selectedTitle || '选择内容查看'}</h2>
          </div>

          {selectedContent ? (
            <MdViewer md={selectedContent} />
          ) : (
            <div className="flex h-[550px] flex-col items-center justify-center text-center">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  {selectedTitle ? '该部分内容为空' : '请从左侧选择要查看的内容'}
                </p>
                {selectedTitle && (
                  <p className="text-muted-foreground text-sm">
                    点击上方"智能生成"按钮生成内容，或点击"编辑"按钮手动编辑。
                  </p>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
