/**
 * 文稿详情页
 *
 * 功能:
 * - 展示文稿基本信息和统计数据
 * - 展示卷章树形结构
 * - 快速跳转到章节编辑
 * - 管理卷章结构(创建、编辑、删除、排序)
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookText,
  Edit,
  ArrowLeft,
  FileText,
  Clock,
  Target,
  FolderPlus,
  FilePlus,
} from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { getManuscript, createVolume, createChapter, type Manuscript } from '../api/client';
import type { ManuscriptStatus } from '@moge/types';
import ChapterTree from '../components/ChapterTree';
import CreateItemDialog from '@/app/(main)/outline/components/CreateItemDialog';
import { useDictStore } from '@/stores/dictStore';
import { getDictLabel } from '@/app/(main)/outline/utils/dictUtils';
import ExportButton from '@/components/ExportButton';

dayjs.extend(relativeTime);

/**
 * 文稿状态配置
 */
const statusConfig: Record<
  ManuscriptStatus,
  { text: string; variant: 'secondary' | 'default' | 'outline' | 'destructive' }
> = {
  DRAFT: { text: '草稿', variant: 'secondary' },
  IN_PROGRESS: { text: '进行中', variant: 'default' },
  COMPLETED: { text: '已完结', variant: 'outline' },
  PUBLISHED: { text: '已发布', variant: 'outline' },
  ABANDONED: { text: '已放弃', variant: 'destructive' },
};

export default function ManuscriptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [manuscript, setManuscript] = useState<Manuscript | null>(null);
  const [loading, setLoading] = useState(true);
  const [createVolumeDialogOpen, setCreateVolumeDialogOpen] = useState(false);
  const [createChapterDialogOpen, setCreateChapterDialogOpen] = useState(false);

  // 从字典 store 获取小说类型数据
  const { novelTypes, fetchNovelTypes } = useDictStore();

  /**
   * 组件挂载时加载小说类型
   */
  useEffect(() => {
    void fetchNovelTypes();
  }, [fetchNovelTypes]);

  /**
   * 加载文稿数据
   */
  const loadManuscript = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await getManuscript(Number(id));
      setManuscript(response.data);
    } catch (error) {
      console.error('Load manuscript error:', error);
      toast.error('加载文稿失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadManuscript();
  }, [loadManuscript]);

  /**
   * 处理返回
   */
  const handleBack = () => {
    router.push('/manuscripts');
  };

  /**
   * 处理继续编辑 - 跳转到最后编辑的章节或第一个章节
   */
  const handleEdit = () => {
    if (!manuscript) return;

    // 如果有最后编辑的章节,直接跳转到编辑器
    if (manuscript.lastEditedChapterId) {
      router.push(`/manuscripts/${id}/edit?chapter=${manuscript.lastEditedChapterId}`);
    } else {
      // 否则找到第一个章节
      const firstChapter = manuscript.chapters?.[0] || manuscript.volumes?.[0]?.chapters?.[0];
      if (firstChapter?.id) {
        router.push(`/manuscripts/${id}/edit?chapter=${firstChapter.id}`);
      } else {
        // 如果没有章节,显示提示
        toast.error('请先创建章节');
      }
    }
  };

  /**
   * 处理创建卷
   */
  const handleCreateVolume = async (data: { title: string; description?: string }) => {
    if (!manuscript) return;

    try {
      await createVolume({
        manuscriptId: manuscript.id,
        title: data.title,
        description: data.description,
      });
      toast.success('创建卷成功');
      await loadManuscript();
    } catch (error) {
      console.error('Create volume error:', error);
      toast.error('创建卷失败');
      throw error;
    }
  };

  /**
   * 处理创建章节(无卷章节)
   */
  const handleCreateChapter = async (data: { title: string; description?: string }) => {
    if (!manuscript) return;

    try {
      await createChapter({
        manuscriptId: manuscript.id,
        title: data.title,
      });
      toast.success('创建章节成功');
      await loadManuscript();
    } catch (error) {
      console.error('Create chapter error:', error);
      toast.error('创建章节失败');
      throw error;
    }
  };

  /**
   * 计算创作进度
   */
  const calculateProgress = (manuscriptData: Manuscript) => {
    if (!manuscriptData.targetWords || manuscriptData.targetWords === 0) return 0;
    const totalWords = manuscriptData.totalWords || 0;
    return Math.min(Math.round((totalWords / manuscriptData.targetWords) * 100), 100);
  };

  /**
   * 渲染统计卡片
   */
  const renderStatsCard = (
    icon: React.ReactNode,
    label: string,
    value: string | number,
    description?: string
  ) => {
    return (
      <Card
        className="border p-4 backdrop-blur-xl"
        style={{
          backgroundColor: 'var(--moge-card-bg)',
          borderColor: 'var(--moge-card-border)',
        }}
      >
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-[var(--moge-input-bg)] p-2 text-[var(--moge-accent)]">
            {icon}
          </div>
          <div className="flex-1">
            <p className="text-sm text-[var(--moge-text-sub)]">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--moge-text-main)]">{value}</p>
            {description && (
              <p className="mt-1 text-xs text-[var(--moge-text-muted)]">{description}</p>
            )}
          </div>
        </div>
      </Card>
    );
  };

  // 加载状态
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-12 rounded-md bg-[var(--moge-input-bg)]" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="h-32 rounded-md bg-[var(--moge-input-bg)]" />
            <div className="h-32 rounded-md bg-[var(--moge-input-bg)]" />
            <div className="h-32 rounded-md bg-[var(--moge-input-bg)]" />
            <div className="h-32 rounded-md bg-[var(--moge-input-bg)]" />
          </div>
          <div className="h-96 rounded-md bg-[var(--moge-input-bg)]" />
        </div>
      </div>
    );
  }

  // 数据不存在
  if (!manuscript) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <Card
          className="border p-10 text-center backdrop-blur-xl"
          style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
        >
          <BookText className="mx-auto h-12 w-12 text-[var(--moge-text-muted)]" />
          <p className="mt-4 text-[var(--moge-text-sub)]">文稿不存在</p>
          <Button onClick={handleBack} className="mt-4">
            返回列表
          </Button>
        </Card>
      </div>
    );
  }

  const status = manuscript.status ? statusConfig[manuscript.status] : undefined;
  const progress = calculateProgress(manuscript);
  const volumeCount = manuscript.volumes?.length || 0;
  const chapterCount = manuscript.chapters?.length || 0;

  return (
    <div className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden p-6">
      {/* 头部信息 */}
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-[var(--moge-text-main)]">
                  {manuscript.name}
                </h1>
                {status && (
                  <Badge variant={status.variant} className="text-xs">
                    {status.text}
                  </Badge>
                )}
                {manuscript.type && (
                  <Badge className="text-xs">{getDictLabel(novelTypes, manuscript.type)}</Badge>
                )}
              </div>
              {manuscript.description && (
                <p className="mt-1 text-sm text-[var(--moge-text-sub)]">{manuscript.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {manuscript.id && (
              <ExportButton
                type="manuscript"
                id={manuscript.id}
                name={manuscript.name}
                variant="outline"
              />
            )}
            <Button onClick={handleEdit} className="gap-2">
              <Edit className="h-4 w-4" />
              继续编辑
            </Button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {renderStatsCard(
            <FileText className="h-5 w-5" />,
            '总字数',
            (manuscript.totalWords || 0).toLocaleString(),
            `已发布: ${(manuscript.publishedWords || 0).toLocaleString()}`
          )}
          {renderStatsCard(
            <Target className="h-5 w-5" />,
            '目标字数',
            manuscript.targetWords ? manuscript.targetWords.toLocaleString() : '未设置',
            manuscript.targetWords ? `进度: ${progress}%` : undefined
          )}
          {renderStatsCard(
            <BookText className="h-5 w-5" />,
            '卷数',
            volumeCount,
            `共 ${chapterCount} 章节`
          )}
          {renderStatsCard(
            <Clock className="h-5 w-5" />,
            '最后编辑',
            manuscript.lastEditedAt ? dayjs(manuscript.lastEditedAt).fromNow() : '从未编辑',
            manuscript.lastEditedAt
              ? dayjs(manuscript.lastEditedAt).format('YYYY-MM-DD HH:mm')
              : undefined
          )}
        </div>

        {/* 进度条 */}
        {manuscript.targetWords && manuscript.targetWords > 0 && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-[var(--moge-text-sub)]">创作进度</span>
              <span className="font-medium text-[var(--moge-text-main)]">{progress}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--moge-input-bg)]">
              <div
                className="h-full bg-gradient-to-r from-[var(--moge-accent)] to-[var(--moge-accent-secondary)] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="structure" className="flex h-full flex-col">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="structure">卷章结构</TabsTrigger>
            <TabsTrigger value="settings">关联设定</TabsTrigger>
            <TabsTrigger value="stats">统计分析</TabsTrigger>
          </TabsList>

          {/* 卷章结构 Tab */}
          <TabsContent value="structure" className="flex-1 overflow-y-auto">
            <Card
              className="border p-6 backdrop-blur-xl"
              style={{
                backgroundColor: 'var(--moge-card-bg)',
                borderColor: 'var(--moge-card-border)',
              }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--moge-text-main)]">卷章结构</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setCreateVolumeDialogOpen(true)}
                  >
                    <FolderPlus className="h-4 w-4" />
                    新建卷
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setCreateChapterDialogOpen(true)}
                  >
                    <FilePlus className="h-4 w-4" />
                    新建章节
                  </Button>
                </div>
              </div>

              {/* 卷章列表 */}
              {volumeCount === 0 && chapterCount === 0 ? (
                <div className="py-20 text-center">
                  <BookText className="mx-auto h-12 w-12 text-[var(--moge-text-muted)]" />
                  <p className="mt-4 text-[var(--moge-text-sub)]">暂无卷章结构</p>
                  <p className="mt-2 text-sm text-[var(--moge-text-muted)]">
                    点击上方按钮创建第一个卷或章节
                  </p>
                </div>
              ) : (
                <ChapterTree
                  manuscript={manuscript}
                  onRefresh={() => {
                    void loadManuscript();
                  }}
                />
              )}
            </Card>
          </TabsContent>

          {/* 关联设定 Tab */}
          <TabsContent value="settings" className="flex-1 overflow-y-auto">
            <Card
              className="border p-6 backdrop-blur-xl"
              style={{
                backgroundColor: 'var(--moge-card-bg)',
                borderColor: 'var(--moge-card-border)',
              }}
            >
              <h2 className="mb-4 text-lg font-semibold text-[var(--moge-text-main)]">关联设定</h2>
              <p className="text-sm text-[var(--moge-text-muted)]">关联设定面板待实现...</p>
            </Card>
          </TabsContent>

          {/* 统计分析 Tab */}
          <TabsContent value="stats" className="flex-1 overflow-y-auto">
            <Card
              className="border p-6 backdrop-blur-xl"
              style={{
                backgroundColor: 'var(--moge-card-bg)',
                borderColor: 'var(--moge-card-border)',
              }}
            >
              <h2 className="mb-4 text-lg font-semibold text-[var(--moge-text-main)]">统计分析</h2>
              <p className="text-sm text-[var(--moge-text-muted)]">统计分析面板待实现...</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* 创建卷对话框 */}
      <CreateItemDialog
        open={createVolumeDialogOpen}
        onOpenChange={setCreateVolumeDialogOpen}
        type="volume"
        onConfirm={handleCreateVolume}
        volumeCount={manuscript?.volumes?.length || 0}
      />

      {/* 创建章节对话框 */}
      <CreateItemDialog
        open={createChapterDialogOpen}
        onOpenChange={setCreateChapterDialogOpen}
        type="chapter"
        onConfirm={handleCreateChapter}
        chapterCount={manuscript?.chapters?.length || 0}
      />
    </div>
  );
}
