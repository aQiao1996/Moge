'use client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, Edit, FileText, Trash2 } from 'lucide-react';
import { useOutlineStore } from '@/stores/outlineStore';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import MogePagination from '@/app/components/MogePagination';
import dayjs from 'dayjs';
import { FilterState } from './OutlineFilter';
import type { Outline } from '@moge/types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import OutlineDialog from './OutlineDialog';
import MogeConfirmPopover from '@/app/components/MogeConfirmPopover';
import { statusConfig } from './constants';

interface OutlineListProps {
  filters: FilterState;
}

export default function OutlineList({ filters }: OutlineListProps) {
  const { outlines, total, loading, getOutlines, deleteOutline } = useOutlineStore();
  const [pageNum, setPageNum] = useState(1);
  const [pageSize] = useState(5);
  const router = useRouter();

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingOutline, setEditingOutline] = useState<Outline | null>(null);

  useEffect(() => {
    const params = {
      pageNum,
      pageSize,
      search: filters.search || undefined,
      type: filters.type || undefined,
      era: filters.era || undefined,
      status: filters.status || undefined,
      tags: filters.tags.length > 0 ? filters.tags : undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    };

    void getOutlines(params);
  }, [
    getOutlines,
    pageNum,
    pageSize,
    filters.search,
    filters.type,
    filters.era,
    filters.status,
    filters.tags,
    filters.sortBy,
    filters.sortOrder,
  ]);

  // 当筛选条件改变时，重置到第一页
  useEffect(() => {
    setPageNum(1);
  }, [
    filters.search,
    filters.type,
    filters.era,
    filters.tags,
    filters.status,
    filters.sortBy,
    filters.sortOrder,
  ]);

  const handleEdit = (outline: Outline) => {
    setEditingOutline(outline);
    setEditDialogOpen(true);
  };

  const handleDelete = async (outline: Outline) => {
    if (!outline.id) return;

    try {
      await deleteOutline(outline.id);
      toast.success('删除成功');
    } catch (error) {
      toast.error('删除失败');
      console.error('Delete outline error:', error);
      throw error; // 重新抛出错误，让 MogeConfirmPopover 处理
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4">
        {[...Array<number>(3)].map((_, i) => (
          <Card
            key={i}
            className="border p-4 backdrop-blur-xl"
            style={{
              backgroundColor: 'var(--moge-card-bg)',
              borderColor: 'var(--moge-card-border)',
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-40 rounded-md" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-3/4 rounded-md" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (outlines.length === 0 && !loading) {
    return (
      <Card
        className="border p-10 text-center backdrop-blur-xl"
        style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
      >
        <BookOpen className="mx-auto h-12 w-12 text-[var(--moge-text-muted)]" />
        <p className="mt-4 text-[var(--moge-text-sub)]">
          {filters.search ||
          filters.type ||
          filters.era ||
          filters.tags.length > 0 ||
          filters.status
            ? '没有找到符合条件的大纲'
            : '暂无大纲，点击右上角「新增大纲」创建第一条'}
        </p>
      </Card>
    );
  }

  const renderOutlineCard = (outline: Outline) => {
    const status = statusConfig[outline.status as keyof typeof statusConfig];
    return (
      <Card
        key={outline.id}
        className="border p-4 backdrop-blur-xl transition hover:shadow-[var(--moge-glow-card)]"
        style={{
          backgroundColor: 'var(--moge-card-bg)',
          borderColor: 'var(--moge-card-border)',
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-[var(--moge-text-main)]">{outline.name}</h3>
              {status && (
                <Badge variant={status.variant} className="text-xs">
                  {status.text}
                </Badge>
              )}
              <Badge className="text-xs">{outline.type}</Badge>
              {outline.era && (
                <Badge variant="outline" className="text-xs">
                  {outline.era}
                </Badge>
              )}
            </div>
            {outline.remark && (
              <p className="mt-2 line-clamp-2 text-sm text-[var(--moge-text-sub)]">
                {outline.remark}
              </p>
            )}
            {outline.tags && outline.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {outline.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            <div className="mt-3 flex items-center gap-4 text-xs text-[var(--moge-text-muted)]">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {dayjs(outline.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => router.push(`/outline/${outline.id}`)}
              title="查看内容"
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              title="编辑基本信息"
              onClick={() => handleEdit(outline)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <MogeConfirmPopover
              trigger={
                <Button size="sm" variant="ghost" title="删除">
                  <Trash2 className="h-4 w-4" />
                </Button>
              }
              title="确认删除"
              description={`此操作无法撤销，确定要删除大纲「${outline.name}」吗？`}
              confirmText="确认删除"
              cancelText="取消"
              loadingText="删除中..."
              confirmVariant="destructive"
              onConfirm={() => handleDelete(outline)}
            />
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* 列表或网格视图 */}
      <div className={filters.viewMode === 'grid' ? 'auto-fit-grid grid gap-4' : 'grid gap-4'}>
        {outlines.map(renderOutlineCard)}
      </div>

      {/* 分页 */}
      <MogePagination
        currentPage={pageNum}
        totalPages={Math.ceil(total / pageSize)}
        onPageChange={setPageNum}
        showTotal={true}
        totalItems={total}
      />

      {/* 编辑对话框 */}
      <OutlineDialog
        mode="edit"
        outline={editingOutline ?? undefined}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </div>
  );
}
