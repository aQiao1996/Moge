'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import MogeFilter, { MogeFilterState, FilterOption, SortOption } from '@/app/components/MogeFilter';
import MogeList from '@/app/components/MogeList';
import DictItemDialog from '../components/DictItemDialog';
import { toast } from 'sonner';
import type { CreateDictItemValues, UpdateDictItemValues, Dict } from '@moge/types';
import { useDictStore } from '@/stores/dictStore';
import dayjs from 'dayjs';
import MogeConfirmPopover from '@/app/components/MogeConfirmPopover';

/**
 * 字典分类配置
 * 定义各分类的展示信息
 */
const dictionaryCategories = {
  novel_types: {
    title: '小说类型',
    description: '管理小说的类型分类，如玄幻、都市、历史、科幻等',
    color: 'text-blue-500',
    icon: 'Book',
  },
  novel_tags: {
    title: '小说标签',
    description: '管理小说标签库，按题材、风格、情节、角色等维度分类',
    color: 'text-green-500',
    icon: 'Tags',
  },
  terminology: {
    title: '专业术语',
    description: '管理各行业专业词汇、技术名词、古风用语等',
    color: 'text-purple-500',
    icon: 'Terminal',
  },
  templates: {
    title: '模板库',
    description: '管理常用的剧情桥段、对话模板、场景描述等',
    color: 'text-orange-500',
    icon: 'FileText',
  },
};

// 筛选配置：支持按状态筛选
const filterOptions: FilterOption[] = [
  {
    key: 'isEnabled',
    label: '状态',
    type: 'select',
    options: [
      { value: true, label: '启用' },
      { value: false, label: '禁用' },
    ],
  },
];

// 排序配置：支持多种排序方式
const sortOptions: SortOption[] = [
  { value: 'sortOrder', label: '排序' },
  { value: 'updatedAt', label: '更新时间' },
  { value: 'createdAt', label: '创建时间' },
  { value: 'label', label: '标签名称' },
];

/**
 * 字典分类详情页组件
 *
 * 功能：
 * - 展示指定分类下的所有词条
 * - 支持搜索、筛选、排序
 * - 支持创建、编辑、删除、启用/禁用词条
 * - 支持列表/网格视图切换
 * - 分页展示
 */
export default function DictionaryCategoryPage() {
  const params = useParams();
  const categoryKey = params.category as string;
  const { fetchDictByType, createDictItem, updateDictItem, deleteDictItem, toggleDictItem } =
    useDictStore();

  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dictItems, setDictItems] = useState<Dict[]>([]);
  const pageSize = 8;

  // 编辑对话框状态
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Dict | null>(null);

  // 获取当前分类信息
  const currentCategory = dictionaryCategories[categoryKey as keyof typeof dictionaryCategories];

  /**
   * 获取字典数据
   * 根据分类类型从后端获取词条列表
   */
  useEffect(() => {
    const fetchData = async () => {
      if (!currentCategory) return;

      setLoading(true);
      try {
        const data = await fetchDictByType(categoryKey);
        setDictItems(data);
      } catch (error) {
        console.error('Failed to fetch dict data:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [currentCategory, fetchDictByType]);

  // 筛选状态
  const [filters, setFilters] = useState<MogeFilterState>({
    search: '',
    isEnabled: '',
    sortBy: 'sortOrder',
    sortOrder: 'asc',
    viewMode: 'list',
  });

  /**
   * 根据筛选条件过滤字典项
   * 支持搜索、状态筛选和多种排序方式
   */
  const getFilteredItems = () => {
    let filtered = dictItems;

    // 搜索筛选
    if (filters.search) {
      filtered = filtered.filter(
        (item) =>
          item.label.toLowerCase().includes(filters.search.toLowerCase()) ||
          item.code.toLowerCase().includes(filters.search.toLowerCase()) ||
          (item.value && item.value.toLowerCase().includes(filters.search.toLowerCase())) ||
          (item.description &&
            item.description.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }

    // 状态筛选
    if (filters.isEnabled) {
      filtered = filtered.filter((item) => item.isEnabled.toString() === filters.isEnabled);
    }

    // 排序
    filtered.sort((a, b) => {
      const aValue = a[filters.sortBy as keyof typeof a] as string | number;
      const bValue = b[filters.sortBy as keyof typeof b] as string | number;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return filters.sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
      }

      const comparison = aValue.toString().localeCompare(bValue.toString());
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  };

  const filteredItems = getFilteredItems();
  const paginatedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  /**
   * 处理创建词条
   * 创建成功后刷新列表
   */
  const handleCreateItem = async (values: CreateDictItemValues) => {
    try {
      await createDictItem(values);
      toast.success('词条创建成功');
      // 刷新列表数据
      const data = await fetchDictByType(categoryKey);
      setDictItems(data);
    } catch (error) {
      console.error('Create dict item error:', error);
    }
  };

  /**
   * 处理编辑词条
   * 更新成功后刷新列表并关闭对话框
   */
  const handleEditItem = async (values: UpdateDictItemValues) => {
    if (!editingItem) return;

    try {
      await updateDictItem(editingItem.id, values);
      toast.success('词条更新成功');
      setEditDialogOpen(false);
      setEditingItem(null);
      // 刷新列表数据
      const data = await fetchDictByType(categoryKey);
      setDictItems(data);
    } catch (error) {
      console.error('Update dict item error:', error);
    }
  };

  /**
   * 处理编辑按钮点击
   * 打开编辑对话框并设置当前编辑项
   */
  const handleEdit = (item: Dict) => {
    setEditingItem(item);
    setEditDialogOpen(true);
  };

  /**
   * 处理删除词条
   * 删除成功后刷新列表
   */
  const handleDelete = async (item: Dict) => {
    if (!confirm(`确定要删除词条"${item.label}"吗？`)) {
      return;
    }

    try {
      await deleteDictItem(item.id);
      toast.success('词条删除成功');
      // 刷新列表数据
      const data = await fetchDictByType(categoryKey);
      setDictItems(data);
    } catch (error) {
      console.error('Delete dict item error:', error);
    }
  };

  /**
   * 处理启用/禁用切换
   * 切换成功后刷新列表
   */
  const handleToggle = async (item: Dict) => {
    try {
      await toggleDictItem(item.id, !item.isEnabled);
      toast.success(`词条已${!item.isEnabled ? '启用' : '禁用'}`);
      // 刷新列表数据
      const data = await fetchDictByType(categoryKey);
      setDictItems(data);
    } catch (error) {
      console.error('Toggle dict item error:', error);
    }
  };

  /**
   * 渲染词条卡片
   * 展示词条的详细信息和操作按钮
   */

  const renderItemCard = (item: Dict) => {
    return (
      <Card
        key={item.id}
        className="cursor-pointer border p-6 transition-all duration-200 hover:shadow-[var(--moge-glow-card)]"
        style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              <h3 className="font-semibold text-[var(--moge-text-main)]">{item.label}</h3>
              <Badge variant={item.isEnabled ? 'default' : 'secondary'} className="text-xs">
                {item.isEnabled ? '启用' : '禁用'}
              </Badge>
              <code className="rounded border bg-[var(--moge-bg)] px-2 py-1 text-xs text-[var(--moge-text-muted)]">
                {item.code}
              </code>
            </div>
            {item.description && (
              <p className="mb-3 text-sm text-[var(--moge-text-sub)]">{item.description}</p>
            )}
            {item.value && item.value !== item.code && item.value !== item.label && (
              <p className="mb-3 text-sm text-[var(--moge-text-sub)]">
                <span className="text-[var(--moge-text-muted)]">存储值: </span>
                <code className="rounded bg-[var(--moge-bg)] px-1 py-0.5 text-xs">
                  {item.value}
                </code>
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-[var(--moge-text-muted)]">
              <span>更新于 {dayjs(item.updatedAt).format('YYYY-MM-DD HH:mm')}</span>
            </div>
          </div>

          <div className="ml-4 flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => void handleEdit(item)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void handleToggle(item)}>
              {item.isEnabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
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
              description={`此操作无法撤销，确定要删除词条「${item.label}」吗？`}
              confirmText="确认删除"
              cancelText="取消"
              loadingText="删除中..."
              confirmVariant="destructive"
              onConfirm={() => handleDelete(item)}
            />
          </div>
        </div>
      </Card>
    );
  };

  const hasActiveFilters = !!(filters.search || filters.isEnabled);

  // 分类不存在时的提示
  if (!currentCategory) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-[var(--moge-text-sub)]">未找到对应的字典分类</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* 面包屑导航 */}
      <div className="mb-6 flex items-center gap-2">
        <Link href="/dictionary">
          <Button variant="ghost" size="sm" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            字典管理
          </Button>
        </Link>
        <span className="text-[var(--moge-text-muted)]">/</span>
        <span className="font-medium text-[var(--moge-text-main)]">{currentCategory.title}</span>
      </div>

      {/* 页面标题区 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-han text-2xl font-bold text-[var(--moge-text-main)]">
            {currentCategory.title}
          </h1>
          <p className="mt-1 text-[var(--moge-text-sub)]">{currentCategory.description}</p>
        </div>

        {/* 创建词条按钮 */}
        <div>
          <DictItemDialog
            mode="create"
            categoryCode={categoryKey}
            categoryTitle={currentCategory.title}
            onSubmit={handleCreateItem}
          />
        </div>
      </div>

      {/* 筛选组件 */}
      <div className="mb-6">
        <MogeFilter
          filters={filters}
          onFiltersChange={setFilters}
          filterOptions={filterOptions}
          sortOptions={sortOptions}
          searchPlaceholder={`搜索${currentCategory.title}...`}
          showViewMode={true}
          showSort={true}
        />
      </div>

      {/* 词条列表 - 可滚动区域 */}
      <div className="min-h-0 flex-1 overflow-y-auto px-1">
        <div className="mx-auto max-w-6xl">
          <MogeList
            items={paginatedItems.map((item) => ({ ...item, id: item.id.toString() }))}
            total={filteredItems.length}
            loading={loading}
            currentPage={currentPage}
            pageSize={pageSize}
            viewMode={filters.viewMode}
            onPageChange={setCurrentPage}
            renderItem={(item) => renderItemCard({ ...item, id: parseInt(item.id) } as Dict)}
            emptyIcon={<Search className="mx-auto h-16 w-16 text-[var(--moge-text-muted)]" />}
            emptyTitle={
              hasActiveFilters
                ? `没有找到符合条件的${currentCategory.title}`
                : `还没有${currentCategory.title}`
            }
            emptyDescription={
              hasActiveFilters ? undefined : `创建您的第一个${currentCategory.title}词条`
            }
            hasFilters={hasActiveFilters}
            showPagination={filteredItems.length > pageSize}
            gridClassName="auto-fit-grid grid gap-4"
            listClassName="grid gap-4"
          />
        </div>
      </div>

      {/* 编辑对话框 */}
      <DictItemDialog
        mode="edit"
        categoryCode={categoryKey}
        categoryTitle={currentCategory.title}
        item={
          editingItem
            ? {
                id: editingItem.id,
                categoryCode: editingItem.categoryCode,
                code: editingItem.code,
                label: editingItem.label,
                value: editingItem.value || '',
                sortOrder: editingItem.sortOrder,
                isEnabled: editingItem.isEnabled,
                description: editingItem.description || '',
                createdAt: dayjs(editingItem.createdAt).toISOString(),
                updatedAt: dayjs(editingItem.updatedAt).toISOString(),
              }
            : undefined
        }
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleEditItem}
      />
    </div>
  );
}
