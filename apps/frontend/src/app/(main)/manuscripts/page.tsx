'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookText, Clock, Edit, FileText, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import MogeConfirmPopover from '@/app/components/MogeConfirmPopover';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { getManuscripts, deleteManuscript, type Manuscript } from './api/client';
import type { ManuscriptStatus } from '@moge/types';

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

/**
 * 文稿列表页组件
 *
 * 功能:
 * - 展示所有文稿列表
 * - 支持创建、编辑、删除文稿
 * - 显示字数统计和进度
 * - 快速跳转到文稿详情和编辑页
 */
export default function ManuscriptsPage() {
  const router = useRouter();
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * 加载文稿列表
   */
  const loadManuscripts = async () => {
    try {
      setLoading(true);
      const response = await getManuscripts();
      setManuscripts(response.data);
    } catch (error) {
      console.error('Load manuscripts error:', error);
      toast.error('加载文稿列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadManuscripts();
  }, []);

  /**
   * 处理删除文稿
   */
  const handleDelete = async (manuscript: Manuscript) => {
    if (!manuscript.id) return;

    try {
      await deleteManuscript(manuscript.id);
      toast.success('删除成功');
      await loadManuscripts();
    } catch (error) {
      console.error('Delete manuscript error:', error);
      throw error;
    }
  };

  /**
   * 计算创作进度
   */
  const calculateProgress = (manuscript: Manuscript) => {
    if (!manuscript.targetWords || manuscript.targetWords === 0) return 0;
    const totalWords = manuscript.totalWords || 0;
    return Math.min(Math.round((totalWords / manuscript.targetWords) * 100), 100);
  };

  /**
   * 渲染文稿卡片
   */
  const renderManuscriptCard = (manuscript: Manuscript) => {
    const status = manuscript.status ? statusConfig[manuscript.status] : undefined;
    const progress = calculateProgress(manuscript);

    return (
      <Card
        key={manuscript.id}
        className="border p-4 backdrop-blur-xl transition hover:shadow-[var(--moge-glow-card)]"
        style={{
          backgroundColor: 'var(--moge-card-bg)',
          borderColor: 'var(--moge-card-border)',
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* 文稿标题和状态标签 */}
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-[var(--moge-text-main)]">{manuscript.name}</h3>
              {status && (
                <Badge variant={status.variant} className="text-xs">
                  {status.text}
                </Badge>
              )}
              {manuscript.type && <Badge className="text-xs">{manuscript.type}</Badge>}
            </div>

            {/* 描述信息 */}
            {manuscript.description && (
              <p className="mt-2 line-clamp-2 text-sm text-[var(--moge-text-sub)]">
                {manuscript.description}
              </p>
            )}

            {/* 字数统计 */}
            <div className="mt-3 flex items-center gap-4 text-sm">
              <span className="text-[var(--moge-text-sub)]">
                总字数:{' '}
                <span className="font-medium text-[var(--moge-text-main)]">
                  {(manuscript.totalWords || 0).toLocaleString()}
                </span>
              </span>
              <span className="text-[var(--moge-text-sub)]">
                已发布:{' '}
                <span className="font-medium text-[var(--moge-text-main)]">
                  {(manuscript.publishedWords || 0).toLocaleString()}
                </span>
              </span>
              {manuscript.targetWords && (
                <span className="text-[var(--moge-text-sub)]">
                  目标:{' '}
                  <span className="font-medium text-[var(--moge-text-main)]">
                    {manuscript.targetWords.toLocaleString()}
                  </span>
                  <span className="ml-1 text-xs">({progress}%)</span>
                </span>
              )}
            </div>

            {/* 进度条 */}
            {manuscript.targetWords && manuscript.targetWords > 0 && (
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--moge-input-bg)]">
                <div className="h-full bg-[var(--moge-accent)]" style={{ width: `${progress}%` }} />
              </div>
            )}

            {/* 标签列表 */}
            {manuscript.tags && manuscript.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {manuscript.tags.map((tag, index) => (
                  <Badge
                    key={`${manuscript.id}-${tag}-${index}`}
                    variant="secondary"
                    className="text-xs"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* 创建时间和最后编辑时间 */}
            <div className="mt-3 flex items-center gap-4 text-xs text-[var(--moge-text-muted)]">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                创建于 {dayjs(manuscript.createdAt).format('YYYY-MM-DD HH:mm')}
              </span>
              {manuscript.lastEditedAt && (
                <span className="flex items-center gap-1">
                  最后编辑 {dayjs(manuscript.lastEditedAt).fromNow()}
                </span>
              )}
            </div>
          </div>

          {/* 操作按钮组 */}
          <div className="flex items-center gap-2">
            {/* 查看详情 */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => router.push(`/manuscripts/${manuscript.id}`)}
              title="查看详情"
            >
              <FileText className="h-4 w-4" />
            </Button>

            {/* 编辑 */}
            <Button
              size="sm"
              variant="ghost"
              title="编辑文稿"
              onClick={() => router.push(`/manuscripts/${manuscript.id}`)}
            >
              <Edit className="h-4 w-4" />
            </Button>

            {/* 删除文稿 */}
            <MogeConfirmPopover
              trigger={
                <Button
                  size="sm"
                  variant="ghost"
                  title="删除"
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              }
              title="确认删除"
              description={`此操作无法撤销，确定要删除文稿「${manuscript.name}」吗？`}
              confirmText="确认删除"
              cancelText="取消"
              loadingText="删除中..."
              confirmVariant="destructive"
              onConfirm={() => handleDelete(manuscript)}
            />
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-han text-2xl font-bold text-[var(--moge-text-main)]">文稿</h1>
          <p className="mt-1 text-sm text-[var(--moge-text-sub)]">管理你的创作文稿</p>
        </div>
        <Button onClick={() => router.push('/manuscripts/create')} className="gap-2">
          <Plus className="h-4 w-4" />
          新建文稿
        </Button>
      </div>

      {/* 文稿列表 */}
      {loading ? (
        <Card
          className="border p-10 text-center backdrop-blur-xl"
          style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
        >
          <p className="text-[var(--moge-text-sub)]">加载中...</p>
        </Card>
      ) : manuscripts.length === 0 ? (
        <Card
          className="border p-10 text-center backdrop-blur-xl"
          style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
        >
          <BookText className="mx-auto h-12 w-12 text-[var(--moge-text-muted)]" />
          <p className="mt-4 text-[var(--moge-text-sub)]">暂无文稿</p>
          <p className="mt-2 text-sm text-[var(--moge-text-muted)]">
            点击右上角「新建文稿」创建第一个文稿
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {manuscripts.map((manuscript) => renderManuscriptCard(manuscript))}
        </div>
      )}
    </div>
  );
}
