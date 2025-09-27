'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Zap, Globe, Folder, Plus, Settings } from 'lucide-react';
import Link from 'next/link';
import MogeFilter, { MogeFilterState, FilterOption, SortOption } from '@/app/components/MogeFilter';
import MogeList from '@/app/components/MogeList';

// 设定分类配置
const settingCategories = [
  { key: 'characters', label: '角色设定', icon: Users, color: 'text-blue-500' },
  { key: 'systems', label: '系统/金手指', icon: Zap, color: 'text-yellow-500' },
  { key: 'worlds', label: '世界背景', icon: Globe, color: 'text-green-500' },
  { key: 'misc', label: '辅助设定', icon: Folder, color: 'text-purple-500' },
];

// 模拟设定数据
const mockSettings = [
  {
    id: '1',
    name: '主角-张三',
    type: 'characters',
    tags: ['主角', '修仙', '热血'],
    description: '出身平凡，机缘巧合下踏上修仙之路的少年',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
    projects: ['仙侠传说', '都市修仙'], // 关联的项目
  },
  {
    id: '2',
    name: '升级系统',
    type: 'systems',
    tags: ['系统', '升级', '经验'],
    description: '通过击杀怪物和完成任务获得经验值的升级系统',
    createdAt: '2024-01-18',
    updatedAt: '2024-01-25',
    projects: ['仙侠传说'],
  },
  {
    id: '3',
    name: '修仙世界观',
    type: 'worlds',
    tags: ['修仙', '世界观', '宗门'],
    description: '以修仙为核心的世界观设定，包含各大宗门势力',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-22',
    projects: ['仙侠传说'],
  },
];

// 筛选配置
const filterOptions: FilterOption[] = [
  {
    key: 'type',
    label: '类型',
    type: 'select',
    options: settingCategories.map((cat) => cat.label),
  },
  {
    key: 'tags',
    label: '标签',
    type: 'tags',
    options: ['主角', '配角', '反派', '系统', '升级', '修仙', '都市', '世界观', '宗门'],
  },
];

// 排序配置
const sortOptions: SortOption[] = [
  { value: 'updatedAt', label: '更新时间' },
  { value: 'createdAt', label: '创建时间' },
  { value: 'name', label: '名称' },
];

export default function SettingsLibraryPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [loading] = useState(false);
  const pageSize = 10;

  // 筛选状态
  const [filters, setFilters] = useState<MogeFilterState>({
    search: '',
    type: '',
    tags: [],
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    viewMode: 'list',
  });

  // 根据筛选条件过滤设定
  const getFilteredSettings = () => {
    let filtered = [...mockSettings];

    // 搜索筛选
    if (filters.search) {
      filtered = filtered.filter(
        (setting) =>
          setting.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          setting.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // 类型筛选
    if (filters.type) {
      const typeKey = settingCategories.find((cat) => cat.label === filters.type)?.key;
      if (typeKey) {
        filtered = filtered.filter((setting) => setting.type === typeKey);
      }
    }

    // 标签筛选
    if ((filters.tags as string[]).length > 0) {
      filtered = filtered.filter((setting) =>
        (filters.tags as string[]).some((tag) => setting.tags.includes(tag))
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

  const renderSettingCard = (setting: (typeof mockSettings)[0]) => {
    const category = settingCategories.find((cat) => cat.key === setting.type);
    const Icon = category?.icon || Folder;

    return (
      <Card
        key={setting.id}
        className="cursor-pointer border p-6 transition-all duration-200 hover:shadow-[var(--moge-glow-card)]"
        style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Icon className={`h-5 w-5 ${category?.color || 'text-gray-500'}`} />
              <h3 className="font-semibold text-[var(--moge-text-main)]">{setting.name}</h3>
            </div>
            <p className="line-clamp-2 text-sm text-[var(--moge-text-sub)]">
              {setting.description}
            </p>
            <div className="mb-2 flex flex-wrap gap-1">
              {setting.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="text-xs text-[var(--moge-text-muted)]">更新于 {setting.updatedAt}</div>
          </div>

          <div className="ml-4 text-right">
            <Badge variant="outline" className="mb-2 text-xs">
              {category?.label}
            </Badge>
            <p className="text-xs text-[var(--moge-text-muted)]">
              关联项目: {setting.projects.length}
            </p>
          </div>
        </div>
      </Card>
    );
  };

  const hasActiveFilters = !!(
    filters.search ||
    filters.type ||
    (filters.tags as string[]).length > 0
  );

  return (
    <div className="mx-auto max-w-6xl">
      {/* 面包屑导航 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/settings">
            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              设定集
            </Button>
          </Link>
          <span className="text-[var(--moge-text-muted)]">/</span>
          <span className="font-medium text-[var(--moge-text-main)]">设定库</span>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          新建设定
        </Button>
      </div>

      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="font-han text-2xl font-bold text-[var(--moge-text-main)]">设定库</h1>
        <p className="mt-1 text-[var(--moge-text-sub)]">独立管理所有设定，可跨项目复用</p>
      </div>

      {/* 筛选组件 */}
      <div className="mb-6">
        <MogeFilter
          filters={filters}
          onFiltersChange={setFilters}
          filterOptions={filterOptions}
          sortOptions={sortOptions}
          searchPlaceholder="搜索设定名称或描述..."
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
        emptyIcon={<Settings className="mx-auto h-16 w-16 text-[var(--moge-text-muted)]" />}
        emptyTitle={hasActiveFilters ? '没有找到符合条件的设定' : '还没有设定'}
        emptyDescription={hasActiveFilters ? undefined : '创建您的第一个设定，开始构建设定库'}
        hasFilters={hasActiveFilters}
        showPagination={filteredSettings.length > pageSize}
        gridClassName="grid grid-cols-1 gap-4 lg:grid-cols-2"
        listClassName="grid gap-4"
      />
    </div>
  );
}
