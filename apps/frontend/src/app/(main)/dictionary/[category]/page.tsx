'use client';

import { ChangeEvent, useCallback, useRef, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Download,
  Upload,
  Share2,
  ShieldCheck,
  History,
  CopyPlus,
  Globe2,
  Layers3,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import MogeFilter, { MogeFilterState, FilterOption, SortOption } from '@/app/components/MogeFilter';
import MogeList from '@/app/components/MogeList';
import DictItemDialog from '../components/DictItemDialog';
import { toast } from 'sonner';
import type { CreateDictItemValues, UpdateDictItemValues, Dict } from '@moge/types';
import { useDictStore } from '@/stores/dictStore';
import dayjs from '@/lib/dayjs';
import MogeConfirmPopover from '@/app/components/MogeConfirmPopover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

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
  novel_eras: {
    title: '小说时代',
    description: '管理小说的时代背景分类，如现代、古代、未来、民国、架空等',
    color: 'text-yellow-500',
    icon: 'Clock',
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

const scopeTabs = [
  { value: 'ALL', label: '全部' },
  { value: 'SYSTEM', label: '系统' },
  { value: 'USER', label: '个人' },
  { value: 'PROJECT', label: '项目' },
  { value: 'COMMUNITY', label: '社区' },
] as const;

type ScopeTab = (typeof scopeTabs)[number]['value'];
type ItemScope = 'SYSTEM' | 'USER' | 'PROJECT';
type ItemShareStatus = 'PRIVATE' | 'SHARED' | 'ARCHIVED';
type VersionItem = {
  id: number;
  version: number;
  label: string;
  value: string;
  description?: string | null;
  createdAt: Date | string;
};

const scopeLabels: Record<ItemScope, string> = {
  SYSTEM: '系统',
  USER: '个人',
  PROJECT: '项目',
};

const shareStatusLabels = {
  PRIVATE: '未分享',
  SHARED: '已共享',
  ARCHIVED: '已归档',
} satisfies Record<ItemShareStatus, string>;

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
  const {
    fetchDictByType,
    fetchCommunityDict,
    createDictItem,
    updateDictItem,
    deleteDictItem,
    toggleDictItem,
    fetchDictItemVersions,
    shareDictItem,
    archiveDictShare,
    forkDictItem,
  } = useDictStore();

  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dictItems, setDictItems] = useState<Dict[]>([]);
  const [scopeTab, setScopeTab] = useState<ScopeTab>('ALL');
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);
  const [versionItem, setVersionItem] = useState<Dict | null>(null);
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const importInputRef = useRef<HTMLInputElement>(null);
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
  const loadDictItems = useCallback(async () => {
    if (!currentCategory) return;

    setLoading(true);
    try {
      const data =
        scopeTab === 'COMMUNITY'
          ? await fetchCommunityDict(categoryKey)
          : await fetchDictByType(categoryKey, {
              scope: scopeTab === 'ALL' ? undefined : scopeTab,
            });
      setDictItems(data);
    } catch (error) {
      console.error('Failed to fetch dict data:', error);
    } finally {
      setLoading(false);
    }
  }, [categoryKey, currentCategory, fetchCommunityDict, fetchDictByType, scopeTab]);

  useEffect(() => {
    void loadDictItems();
  }, [loadDictItems]);

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
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.isEnabled, filters.sortBy, filters.sortOrder, scopeTab]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  /**
   * 处理创建词条
   * 创建成功后刷新列表
   */
  const handleCreateItem = async (values: CreateDictItemValues) => {
    try {
      await createDictItem(values);
      toast.success('词条创建成功');
      await loadDictItems();
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
      await loadDictItems();
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
    try {
      await deleteDictItem(item.id);
      toast.success('词条删除成功');
      await loadDictItems();
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
      await loadDictItems();
    } catch (error) {
      console.error('Toggle dict item error:', error);
    }
  };

  const handleExport = () => {
    const payload = {
      categoryCode: categoryKey,
      categoryTitle: currentCategory.title,
      exportedAt: new Date().toISOString(),
      version: 1,
      permission: 'personal',
      items: dictItems.map(({ label, value, description, sortOrder, isEnabled }) => ({
        label,
        value,
        description,
        sortOrder,
        isEnabled,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `moge-dict-${categoryKey}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('字典已导出');
  };

  const handleShare = () => {
    handleExport();
    toast.success('已生成可分享字典文件');
  };

  const handleShareItem = async (item: Dict) => {
    try {
      await shareDictItem(item.id);
      toast.success('词条已共享到社区');
      await loadDictItems();
    } catch (error) {
      console.error('Share dict item error:', error);
    }
  };

  const handleArchiveShare = async (item: Dict) => {
    try {
      await archiveDictShare(item.id);
      toast.success('已取消社区共享');
      await loadDictItems();
    } catch (error) {
      console.error('Archive dict share error:', error);
    }
  };

  const handleFork = async (item: Dict) => {
    try {
      await forkDictItem(item.id);
      toast.success('已复制到个人字典');
      if (scopeTab === 'COMMUNITY') {
        setScopeTab('USER');
      } else {
        await loadDictItems();
      }
    } catch (error) {
      console.error('Fork dict item error:', error);
    }
  };

  const handleOpenVersions = async (item: Dict) => {
    setVersionItem(item);
    setVersionDialogOpen(true);
    try {
      const data = await fetchDictItemVersions(item.id);
      setVersions(data);
    } catch (error) {
      console.error('Fetch dict versions error:', error);
      setVersions([]);
    }
  };

  const isImportItem = (value: unknown): value is Omit<CreateDictItemValues, 'categoryCode'> => {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const item = value as Record<string, unknown>;
    return typeof item.label === 'string' && typeof item.value === 'string';
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const itemsSource =
        parsed && typeof parsed === 'object' && 'items' in parsed
          ? (parsed as { items?: unknown }).items
          : parsed;

      if (!Array.isArray(itemsSource)) {
        throw new Error('导入文件格式不正确');
      }

      const importItems = itemsSource.filter(isImportItem);
      if (importItems.length === 0) {
        throw new Error('未找到可导入词条');
      }

      let successCount = 0;
      for (const item of importItems) {
        await createDictItem({
          categoryCode: categoryKey,
          label: item.label,
          value: item.value,
          description: item.description,
          sortOrder: item.sortOrder ?? 0,
          isEnabled: item.isEnabled ?? true,
        });
        successCount += 1;
      }

      await loadDictItems();
      toast.success(`成功导入 ${successCount} 个词条`);
    } catch (error) {
      console.error('Import dict item error:', error);
    }
  };

  /**
   * 渲染词条卡片
   * 展示词条的详细信息和操作按钮
   */

  const renderScopeBadges = (item: Dict) => {
    const scope: ItemScope = item.scope ?? 'SYSTEM';
    const shareStatus = item.shareStatus as ItemShareStatus | undefined;
    return (
      <>
        <Badge variant="outline" className="gap-1 text-xs">
          {scope === 'SYSTEM' ? (
            <ShieldCheck className="h-3 w-3" />
          ) : scope === 'PROJECT' ? (
            <Layers3 className="h-3 w-3" />
          ) : (
            <Globe2 className="h-3 w-3" />
          )}
          {scopeLabels[scope]}
        </Badge>
        <Badge variant="outline" className="text-xs">
          v{item.version ?? 1}
        </Badge>
        {shareStatus && shareStatus !== 'PRIVATE' && (
          <Badge variant={shareStatus === 'SHARED' ? 'default' : 'secondary'} className="text-xs">
            {shareStatusLabels[shareStatus]}
          </Badge>
        )}
      </>
    );
  };

  const renderItemCard = (item: Dict) => {
    const isCommunityView = scopeTab === 'COMMUNITY';
    const canEdit = item.scope !== 'SYSTEM' && !isCommunityView;
    const canShare = item.scope === 'USER' && !isCommunityView;
    const canFork = isCommunityView || item.scope === 'SYSTEM';

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
              {renderScopeBadges(item)}
              <code className="rounded border bg-[var(--moge-bg)] px-2 py-1 text-xs text-[var(--moge-text-muted)]">
                {item.value}
              </code>
            </div>
            {item.description && (
              <p className="mb-3 text-sm text-[var(--moge-text-sub)]">{item.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-[var(--moge-text-muted)]">
              <span>更新于 {dayjs(item.updatedAt).format('YYYY-MM-DD HH:mm')}</span>
            </div>
          </div>

          <div className="ml-4 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              title="版本历史"
              onClick={() => void handleOpenVersions(item)}
            >
              <History className="h-4 w-4" />
            </Button>
            {canFork && (
              <Button
                variant="ghost"
                size="sm"
                title="复制到个人字典"
                onClick={() => void handleFork(item)}
              >
                <CopyPlus className="h-4 w-4" />
              </Button>
            )}
            {canShare && (
              <Button
                variant="ghost"
                size="sm"
                title={item.shareStatus === 'SHARED' ? '取消共享' : '共享到社区'}
                onClick={() =>
                  void (item.shareStatus === 'SHARED'
                    ? handleArchiveShare(item)
                    : handleShareItem(item))
                }
              >
                <Share2 className="h-4 w-4" />
              </Button>
            )}
            {canEdit && (
              <Button variant="ghost" size="sm" title="编辑" onClick={() => void handleEdit(item)}>
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                title="启用/禁用"
                onClick={() => void handleToggle(item)}
              >
                {item.isEnabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            )}
            {canEdit && (
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
            )}
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
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1">
              <ShieldCheck className="h-3 w-3" />
              系统/个人/项目权限
            </Badge>
            <Badge variant="outline" className="gap-1">
              <History className="h-3 w-3" />
              版本历史
            </Badge>
            <Badge variant="outline">社区共享</Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => void handleImport(event)}
          />
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            导出
          </Button>
          <Button variant="outline" onClick={() => importInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            导入
          </Button>
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            分享
          </Button>
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
        <Tabs value={scopeTab} onValueChange={(value) => setScopeTab(value as ScopeTab)}>
          <TabsList className="mb-4">
            {scopeTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
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
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-1">
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
                : scopeTab === 'COMMUNITY'
                  ? `社区暂无${currentCategory.title}`
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
                label: editingItem.label,
                value: editingItem.value || '',
                sortOrder: editingItem.sortOrder,
                isEnabled: editingItem.isEnabled,
                description: editingItem.description || '',
                scope: (editingItem.scope ?? 'USER') as ItemScope,
                projectId: editingItem.projectId ?? undefined,
                createdAt: dayjs(editingItem.createdAt).toISOString(),
                updatedAt: dayjs(editingItem.updatedAt).toISOString(),
              }
            : undefined
        }
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleEditItem}
      />

      <Dialog open={versionDialogOpen} onOpenChange={setVersionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {versionItem ? `${versionItem.label} 的版本历史` : '版本历史'}
            </DialogTitle>
            <DialogDescription>每次编辑会保存旧版本快照，便于回看词条演变。</DialogDescription>
          </DialogHeader>
          <div className="max-h-[420px] overflow-y-auto">
            {versions.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--moge-text-muted)]">暂无历史版本</p>
            ) : (
              <div className="space-y-4">
                {versions.map((version) => (
                  <div key={version.id} className="rounded-md border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">v{version.version}</Badge>
                        <span className="font-medium text-[var(--moge-text-main)]">
                          {version.label}
                        </span>
                        <code className="rounded bg-[var(--moge-bg)] px-2 py-1 text-xs">
                          {version.value}
                        </code>
                      </div>
                      <span className="text-xs text-[var(--moge-text-muted)]">
                        {dayjs(version.createdAt).format('YYYY-MM-DD HH:mm')}
                      </span>
                    </div>
                    {version.description && (
                      <>
                        <Separator className="my-3" />
                        <p className="text-sm text-[var(--moge-text-sub)]">{version.description}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
