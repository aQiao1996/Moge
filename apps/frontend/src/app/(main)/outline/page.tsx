'use client';

import { useState, useEffect } from 'react';
import OutlineDialog from './components/OutlineDialog';
import { useOutlineStore } from '@/stores/outlineStore';
import { useDictStore } from '@/stores/dictStore';
import MogeFilter, { MogeFilterState, FilterOption, SortOption } from '@/app/components/MogeFilter';
import MogeList from '@/app/components/MogeList';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, Edit, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import MogeConfirmPopover from '@/app/components/MogeConfirmPopover';
import { statusConfig } from '@/app/(main)/outline/constants/statusConfig';
import dayjs from 'dayjs';
import type { Outline } from '@moge/types';

/**
 * 扩展 Outline 接口以确保 id 是必需的
 * 用于列表渲染时的类型安全
 */
interface OutlineWithId extends Omit<Outline, 'id'> {
  id: string;
  [key: string]: string | number | boolean | string[] | null | undefined | object | Date;
}

/**
 * 大纲列表页组件
 *
 * 功能：
 * - 展示所有大纲列表
 * - 支持搜索、筛选(类型、时代、状态、标签)、排序
 * - 支持创建、编辑、删除大纲
 * - 支持列表/网格视图切换
 * - 分页展示
 * - 快速跳转到大纲详情和编辑页
 */
export default function Home() {
  const { outlines, total, loading, getOutlines, deleteOutline } = useOutlineStore();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const router = useRouter();

  // 编辑对话框状态
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingOutline, setEditingOutline] = useState<OutlineWithId | null>(null);

  // 筛选状态
  const [filters, setFilters] = useState<MogeFilterState>({
    search: '',
    type: '',
    era: '',
    tags: [],
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    viewMode: 'list',
  });

  // 从字典 store 获取筛选数据
  const { novelTypes, fetchNovelTypes } = useDictStore();
  const availableTypes = novelTypes.map((t: { label: string }) => t.label);

  // TODO: 时代和标签应该从字典或实际大纲数据中动态提取
  const availableEras = ['现代', '古代', '未来', '民国', '架空'];
  const availableTags = ['热血', '爽文', '系统', '重生', '穿越', '修仙', '商战'];

  // 组件挂载时加载小说类型
  useEffect(() => {
    void fetchNovelTypes();
  }, [fetchNovelTypes]);

  // 筛选配置：支持类型、时代、状态、标签筛选
  const filterOptions: FilterOption[] = [
    {
      key: 'type',
      label: '类型',
      type: 'select',
      options: availableTypes,
    },
    {
      key: 'era',
      label: '时代',
      type: 'select',
      options: availableEras,
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      options: ['草稿', '已完成', '已放弃'],
    },
    {
      key: 'tags',
      label: '标签',
      type: 'tags',
      options: availableTags,
    },
  ];

  // 排序配置：支持按创建时间、名称、类型排序
  const sortOptions: SortOption[] = [
    { value: 'createdAt', label: '创建时间' },
    { value: 'name', label: '名称' },
    { value: 'type', label: '类型' },
  ];

  /**
   * 获取大纲列表数据
   * 根据筛选条件和分页参数从后端获取数据
   */
  useEffect(() => {
    // 状态映射：前端显示文本 -> 后端枚举值
    const statusMap: Record<string, string> = {
      草稿: 'DRAFT',
      已完成: 'PUBLISHED',
      已放弃: 'DISCARDED',
    };

    const params = {
      pageNum: currentPage,
      pageSize,
      search: filters.search || undefined,
      type: (filters.type as string) || undefined,
      era: (filters.era as string) || undefined,
      status: (() => {
        if (!filters.status) return undefined;
        const statusValue = filters.status as string;
        return statusMap[statusValue] ?? statusValue;
      })(),
      tags: (filters.tags as string[]).length > 0 ? (filters.tags as string[]) : undefined,
      sortBy: filters.sortBy as 'createdAt' | 'name' | 'type',
      sortOrder: filters.sortOrder,
    };

    void getOutlines(params);
  }, [
    getOutlines,
    currentPage,
    pageSize,
    filters.search,
    filters.type,
    filters.era,
    filters.status,
    filters.tags,
    filters.sortBy,
    filters.sortOrder,
  ]);

  /**
   * 当筛选条件改变时，重置到第一页
   * 避免筛选后仍停留在不存在的页码
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [
    filters.search,
    filters.type,
    filters.era,
    filters.tags,
    filters.status,
    filters.sortBy,
    filters.sortOrder,
  ]);

  /**
   * 处理编辑大纲
   * 打开编辑对话框并设置当前编辑项
   */
  const handleEdit = (outline: OutlineWithId) => {
    setEditingOutline(outline);
    setEditDialogOpen(true);
  };

  /**
   * 处理删除大纲
   * 删除成功后自动刷新列表
   */
  const handleDelete = async (outline: OutlineWithId) => {
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

  /**
   * 渲染大纲卡片
   * 展示大纲的详细信息和操作按钮
   */
  const renderOutlineCard = (outline: OutlineWithId) => {
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
            {/* 大纲标题和状态标签 */}
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

            {/* 备注信息 */}
            {outline.remark && (
              <p className="mt-2 line-clamp-2 text-sm text-[var(--moge-text-sub)]">
                {outline.remark}
              </p>
            )}

            {/* 标签列表 */}
            {outline.tags && outline.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {outline.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* 创建时间 */}
            <div className="mt-3 flex items-center gap-4 text-xs text-[var(--moge-text-muted)]">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {dayjs(outline.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </span>
            </div>
          </div>

          {/* 操作按钮组 */}
          <div className="flex items-center gap-2">
            {/* 查看内容 */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => router.push(`/outline/${outline.id}`)}
              title="查看内容"
            >
              <FileText className="h-4 w-4" />
            </Button>

            {/* 编辑基本信息 */}
            <Button
              size="sm"
              variant="ghost"
              title="编辑基本信息"
              onClick={() => handleEdit(outline)}
            >
              <Edit className="h-4 w-4" />
            </Button>

            {/* 删除大纲 */}
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

  const hasActiveFilters = !!(
    filters.search ||
    filters.type ||
    filters.era ||
    (filters.tags as string[]).length > 0 ||
    filters.status
  );

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-han text-2xl font-bold text-[var(--moge-text-main)]">我的大纲</h1>
        </div>
        <OutlineDialog mode="create" />
      </div>

      {/* 筛选组件 */}
      <div className="mb-6">
        <MogeFilter
          filters={filters}
          onFiltersChange={setFilters}
          filterOptions={filterOptions}
          sortOptions={sortOptions}
          searchPlaceholder="搜索大纲名称或备注..."
          showViewMode={true}
          showSort={true}
        />
      </div>

      {/* 大纲列表 */}
      <MogeList<OutlineWithId>
        items={outlines.filter((outline): outline is OutlineWithId => !!outline.id)}
        total={total}
        loading={loading}
        currentPage={currentPage}
        pageSize={pageSize}
        viewMode={filters.viewMode}
        onPageChange={setCurrentPage}
        renderItem={renderOutlineCard}
        emptyIcon={<BookOpen className="mx-auto h-12 w-12 text-[var(--moge-text-muted)]" />}
        emptyTitle="暂无大纲"
        emptyDescription={hasActiveFilters ? undefined : '点击右上角「新增大纲」创建第一条'}
        hasFilters={hasActiveFilters}
        showPagination={true}
        gridClassName="auto-fit-grid grid gap-4"
        listClassName="grid gap-4"
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
