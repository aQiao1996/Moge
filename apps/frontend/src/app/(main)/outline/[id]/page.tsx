/**
 * 大纲详情查看页
 *
 * 功能：
 * - 查看大纲内容
 * - 智能生成大纲
 * - 保存大纲内容
 * - 导航到编辑页
 *
 * 重构说明：
 * - 使用自定义 hooks 管理状态和逻辑
 * - 拆分组件降低复杂度
 * - 提高可维护性和可测试性
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createOutlineGenerateJobApi } from '@/api/outline.api';
import { getAiJob } from '@/api/workspace.api';
import { useOutlineData } from '@/app/(main)/outline/hooks/useOutlineData';
import { useOutlineSave } from '@/app/(main)/outline/hooks/useOutlineSave';
import { statusConfig } from '@/app/(main)/outline/constants/statusConfig';
import OutlineStructureSidebar, {
  type ChapterEditData,
} from '@/app/(main)/outline/components/OutlineStructureSidebar';
import OutlineHeader from '@/app/(main)/outline/[id]/components/OutlineHeader';
import OutlineContentViewer from '@/app/(main)/outline/[id]/components/OutlineContentViewer';
import OutlineSettingsPanel from '@/app/(main)/outline/[id]/components/OutlineSettingsPanel';
import { useDictStore } from '@/stores/dictStore';
import { getDictLabel } from '@/app/(main)/outline/utils/dictUtils';
import { toast } from 'sonner';
import type { AiJob } from '@moge/types';

const ACTIVE_AI_JOB_STATUSES = new Set<AiJob['status']>(['PENDING', 'QUEUED', 'RUNNING']);
const OUTLINE_GENERATE_JOB_POLL_INTERVAL_MS = 2000;

export default function OutlineViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // 字典数据
  const { novelTypes, novelEras, fetchNovelTypes, fetchNovelEras } = useDictStore();

  // 加载字典数据
  useEffect(() => {
    void fetchNovelTypes();
    void fetchNovelEras();
  }, [fetchNovelTypes, fetchNovelEras]);

  // 数据加载
  const { outlineData, loading, expandedVolumes, toggleVolume, refreshData } = useOutlineData({
    outlineId: id,
    autoLoad: true,
  });

  // 保存逻辑
  const { isSaving, saveContent } = useOutlineSave({
    outlineId: id,
    outlineData,
    onSuccess: () => {
      void refreshData();
    },
  });

  // 本地状态
  const [selectedContent, setSelectedContent] = useState<string>('');
  const [selectedTitle, setSelectedTitle] = useState<string>('');
  const [isStructureSidebarOpen, setStructureSidebarOpen] = useState(true);
  const [isCreatingGenerateJob, setCreatingGenerateJob] = useState(false);
  const [generateJobId, setGenerateJobId] = useState<number | null>(null);

  // 初始化默认选中大纲总览
  useEffect(() => {
    if (outlineData?.content?.content) {
      setSelectedContent(outlineData.content.content);
      setSelectedTitle('大纲总览');
    }
  }, [outlineData]);

  // 事件处理
  const handleSelectContent = (content: string, title: string) => {
    setSelectedContent(content);
    setSelectedTitle(title);
  };

  const handleBack = () => {
    router.push('/outline');
  };

  const handleEdit = () => {
    router.push(`/outline/${id}/edit`);
  };

  const handleSave = async () => {
    await saveContent(selectedContent);
  };

  const handleGenerateJobFinished = useCallback(
    async (job: AiJob) => {
      setGenerateJobId(null);

      if (job.status === 'SUCCESS') {
        toast.success('大纲生成完成');
        await refreshData();
        setSelectedTitle('大纲总览');
        return;
      }

      if (job.status === 'FAILED') {
        console.error('大纲生成任务失败:', job.errorMessage);
        return;
      }

      if (job.status === 'CANCELED') {
        toast.info('大纲生成任务已取消');
      }
    },
    [refreshData]
  );

  useEffect(() => {
    if (!generateJobId) {
      return undefined;
    }

    let disposed = false;

    const pollGenerateJob = async () => {
      try {
        const job = await getAiJob(generateJobId);

        if (!ACTIVE_AI_JOB_STATUSES.has(job.status) && !disposed) {
          await handleGenerateJobFinished(job);
        }
      } catch (error) {
        console.error('查询大纲生成任务失败:', error);
      }
    };

    void pollGenerateJob();
    const timer = window.setInterval(() => {
      void pollGenerateJob();
    }, OUTLINE_GENERATE_JOB_POLL_INTERVAL_MS);

    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, [generateJobId, handleGenerateJobFinished]);

  const handleGenerate = async () => {
    try {
      setCreatingGenerateJob(true);
      const job = await createOutlineGenerateJobApi(id);
      if (!job.id) {
        throw new Error('创建大纲生成任务未返回任务 ID');
      }

      toast.success(`大纲生成任务已创建 #${job.id}`);
      setGenerateJobId(job.id);
    } catch (error) {
      console.error('创建大纲生成任务失败:', error);
    } finally {
      setCreatingGenerateJob(false);
    }
  };

  // 加载状态
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

  // 数据不存在
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
      <OutlineHeader
        outlineData={outlineData}
        statusConfig={statusConfig}
        typeLabel={getDictLabel(novelTypes, outlineData.type)}
        eraLabel={getDictLabel(novelEras, outlineData.era)}
        selectedContent={selectedContent}
        selectedTitle={selectedTitle}
        isGenerating={isCreatingGenerateJob || generateJobId !== null}
        isSaving={isSaving}
        onBack={handleBack}
        onGenerate={() => void handleGenerate()}
        onSave={() => void handleSave()}
        onEdit={handleEdit}
      />

      {/* 主要内容区域 */}
      <div className="flex flex-1 flex-col gap-6 overflow-hidden lg:flex-row">
        {/* 左侧导航栏 */}
        <OutlineStructureSidebar
          mode="view"
          outlineData={outlineData}
          activeItemTitle={selectedTitle}
          onSelectItem={(type: string, title: string, data: unknown) => {
            if (type === 'overview') {
              handleSelectContent(data as string, title);
            } else if (type === 'chapter') {
              handleSelectContent((data as ChapterEditData).content, title);
            }
          }}
          expandedVolumes={expandedVolumes}
          onToggleVolume={toggleVolume}
          isOpen={isStructureSidebarOpen}
          onToggle={() => setStructureSidebarOpen(!isStructureSidebarOpen)}
          onRefresh={() => void refreshData()}
        />

        {/* 右侧内容区域 */}
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="content" className="flex h-full flex-col">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="content">大纲内容</TabsTrigger>
              <TabsTrigger value="settings">关联设定</TabsTrigger>
            </TabsList>

            {/* 大纲内容 Tab */}
            <TabsContent value="content" className="flex-1 overflow-hidden">
              <OutlineContentViewer
                selectedTitle={selectedTitle}
                selectedContent={selectedContent}
                isGenerating={isCreatingGenerateJob || generateJobId !== null}
              />
            </TabsContent>

            {/* 关联设定 Tab */}
            <TabsContent value="settings" className="flex-1 overflow-y-auto">
              <Card className="h-full p-6">
                <OutlineSettingsPanel outlineId={id} onUpdate={refreshData} />
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
