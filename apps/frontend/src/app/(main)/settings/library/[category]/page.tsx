'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Users,
  Zap,
  Globe,
  Folder,
  Plus,
  Edit,
  Trash2,
  Link as LinkIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import MogeFilter, { MogeFilterState, FilterOption, SortOption } from '@/app/components/MogeFilter';
import MogeList from '@/app/components/MogeList';
import CharacterDialog from '@/app/(main)/settings/components/CharacterDialog';
import SystemDialog from '@/app/(main)/settings/components/SystemDialog';
import WorldDialog from '@/app/(main)/settings/components/WorldDialog';
import MiscDialog from '@/app/(main)/settings/components/MiscDialog';
import MogeConfirmPopover from '@/app/components/MogeConfirmPopover';
import { getSettingsByCategory, deleteCharacter, type CharacterSetting } from '@/api/settings.api';
import { type Character } from '@moge/types';

// 设定分类配置
const settingCategories = [
  { key: 'characters', label: '角色设定', icon: Users, color: 'text-blue-500' },
  { key: 'systems', label: '系统/金手指', icon: Zap, color: 'text-yellow-500' },
  { key: 'worlds', label: '世界背景', icon: Globe, color: 'text-green-500' },
  { key: 'misc', label: '辅助设定', icon: Folder, color: 'text-purple-500' },
];

export default function CategorySettingsPage() {
  const params = useParams();
  const category = params.category as string;

  const [settings, setSettings] = useState<CharacterSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingSetting, setEditingSetting] = useState<CharacterSetting | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const pageSize = 10;

  // 获取当前分类信息
  const currentCategory = settingCategories.find((cat) => cat.key === category);
  const CategoryIcon = currentCategory?.icon || Folder;

  // 筛选状态
  const [filters, setFilters] = useState<MogeFilterState>({
    search: '',
    tags: [],
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    viewMode: 'list',
  });

  // 加载设定列表
  useEffect(() => {
    void loadSettings();
  }, [category]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getSettingsByCategory(
        category as 'characters' | 'systems' | 'worlds' | 'misc'
      );
      setSettings(data as CharacterSetting[]);
    } catch (error) {
      console.error('加载设定列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 筛选配置
  const filterOptions: FilterOption[] = [
    {
      key: 'tags',
      label: '标签',
      type: 'tags',
      options: Array.from(new Set(settings.flatMap((s) => s.tags || []))),
    },
  ];

  // 排序配置
  const sortOptions: SortOption[] = [
    { value: 'updatedAt', label: '更新时间' },
    { value: 'createdAt', label: '创建时间' },
    { value: 'name', label: '名称' },
  ];

  // 根据筛选条件过滤设定
  const getFilteredSettings = () => {
    let filtered = [...settings];

    // 搜索筛选
    if (filters.search) {
      filtered = filtered.filter(
        (setting) =>
          setting.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          (setting.background || '').toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // 标签筛选
    if ((filters.tags as string[]).length > 0) {
      filtered = filtered.filter((setting) =>
        (filters.tags as string[]).some((tag) => (setting.tags || []).includes(tag))
      );
    }

    // 排序
    filtered.sort((a, b) => {
      const aValue = a[filters.sortBy as keyof typeof a] as string;
      const bValue = b[filters.sortBy as keyof typeof b] as string;

      const comparison = aValue.localeCompare(bValue);
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  };

  const filteredSettings = getFilteredSettings();
  const paginatedSettings = filteredSettings.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // 处理编辑操作
  const handleEdit = (setting: CharacterSetting) => {
    setEditingSetting(setting);
    setEditDialogOpen(true);
  };

  // 处理编辑对话框关闭
  const handleEditDialogChange = (open: boolean) => {
    setEditDialogOpen(open);
    if (!open) {
      // 对话框关闭时刷新列表
      void loadSettings();
      setEditingSetting(null);
    }
  };

  // 处理创建对话框关闭
  const handleCreateDialogChange = (open: boolean) => {
    setCreateDialogOpen(open);
    if (!open) {
      // 对话框关闭时刷新列表
      void loadSettings();
    }
  };

  // 处理删除操作
  const handleDelete = async (setting: CharacterSetting) => {
    try {
      await deleteCharacter(setting.id);
      toast.success('删除成功');
      void loadSettings();
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  // 查看关联项目
  const handleViewProjects = (setting: CharacterSetting) => {
    // TODO: 打开关联项目弹框
    console.log('查看关联项目:', setting);
  };

  const renderSettingCard = (setting: CharacterSetting) => {
    const settingCategory = settingCategories.find((cat) => cat.key === category);
    const Icon = settingCategory?.icon || Folder;

    // 格式化日期
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('zh-CN');
    };

    return (
      <Card
        key={setting.id}
        className="border p-6 transition-all duration-200"
        style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Icon className={`h-5 w-5 ${settingCategory?.color || 'text-gray-500'}`} />
              <h3 className="font-semibold text-[var(--moge-text-main)]">{setting.name}</h3>
            </div>
            <p className="mb-3 line-clamp-2 text-sm text-[var(--moge-text-sub)]">
              {setting.background || setting.type || '暂无描述'}
            </p>
            <div className="mb-2 flex flex-wrap gap-1">
              {(setting.tags || []).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs text-[var(--moge-text-muted)]">
                更新于 {formatDate(setting.updatedAt)}
              </div>
              <div className="text-xs text-[var(--moge-text-muted)]">关联项目: 0</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleViewProjects(setting)}
              title="查看关联项目"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleEdit(setting)} title="编辑">
              <Edit className="h-4 w-4" />
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
              description={`此操作无法撤销，确定要删除「${setting.name}」吗？`}
              confirmText="确认删除"
              cancelText="取消"
              loadingText="删除中..."
              confirmVariant="destructive"
              onConfirm={() => handleDelete(setting)}
            />
          </div>
        </div>
      </Card>
    );
  };

  const hasActiveFilters = !!(filters.search || (filters.tags as string[]).length > 0);

  if (!currentCategory) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-[var(--moge-text-sub)]">未找到对应的设定分类</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* 面包屑导航 */}
      <div className="mb-6 flex items-center gap-2">
        <Link href="/settings">
          <Button variant="ghost" size="sm" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            设定集
          </Button>
        </Link>
        <span className="text-[var(--moge-text-muted)]">/</span>
        <Link href="/settings/library">
          <Button variant="ghost" size="sm" className="text-[var(--moge-text-main)]">
            设定库
          </Button>
        </Link>
        <span className="text-[var(--moge-text-muted)]">/</span>
        <span className="font-medium text-[var(--moge-text-main)]">{currentCategory.label}</span>
      </div>

      {/* 页面标题 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CategoryIcon className={`h-8 w-8 ${currentCategory.color}`} />
          <div>
            <h1 className="font-han text-2xl font-bold text-[var(--moge-text-main)]">
              {currentCategory.label}
            </h1>
            <p className="mt-1 text-[var(--moge-text-sub)]">
              管理所有{currentCategory.label}，可跨项目复用
            </p>
          </div>
        </div>
        {category === 'characters' ? (
          <>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              新建{currentCategory.label}
            </Button>
            <CharacterDialog
              mode="create"
              open={createDialogOpen}
              onOpenChange={handleCreateDialogChange}
            />
          </>
        ) : category === 'systems' ? (
          <SystemDialog mode="create" />
        ) : category === 'worlds' ? (
          <WorldDialog mode="create" />
        ) : category === 'misc' ? (
          <MiscDialog mode="create" />
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            新建{currentCategory.label}
          </Button>
        )}
      </div>

      {/* 筛选组件 */}
      <div className="mb-6">
        <MogeFilter
          filters={filters}
          onFiltersChange={setFilters}
          filterOptions={filterOptions}
          sortOptions={sortOptions}
          searchPlaceholder={`搜索${currentCategory.label}名称或描述...`}
          showViewMode={true}
          showSort={true}
        />
      </div>

      {/* 设定列表 */}
      <MogeList
        items={paginatedSettings}
        total={filteredSettings.length}
        loading={loading}
        currentPage={currentPage}
        pageSize={pageSize}
        viewMode={filters.viewMode}
        onPageChange={setCurrentPage}
        renderItem={renderSettingCard}
        emptyIcon={<CategoryIcon className="mx-auto h-16 w-16 text-[var(--moge-text-muted)]" />}
        emptyTitle={
          hasActiveFilters
            ? `没有找到符合条件的${currentCategory.label}`
            : `还没有${currentCategory.label}`
        }
        emptyDescription={
          hasActiveFilters ? undefined : `创建您的第一个${currentCategory.label}，开始构建设定库`
        }
        hasFilters={hasActiveFilters}
        showPagination={filteredSettings.length > pageSize}
        gridClassName="grid grid-cols-1 gap-4 lg:grid-cols-2"
        listClassName="grid gap-4"
      />

      {/* 编辑对话框 */}
      {category === 'characters' && editingSetting && (
        <CharacterDialog
          mode="edit"
          character={editingSetting as Character & { id?: string | number }}
          open={editDialogOpen}
          onOpenChange={handleEditDialogChange}
        />
      )}
    </div>
  );
}
