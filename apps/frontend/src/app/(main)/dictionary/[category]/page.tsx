'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Search, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import MogeFilter, { MogeFilterState, FilterOption, SortOption } from '@/app/components/MogeFilter';
import MogeList from '@/app/components/MogeList';

// 字典分类配置
const dictionaryCategories = {
  'novel-types': {
    title: '小说类型',
    description: '管理小说的类型分类，如玄幻、都市、历史、科幻等',
    color: 'text-blue-500',
    icon: 'Book',
  },
  'novel-tags': {
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

// 模拟字典数据
const mockDictItems = [
  {
    id: '1',
    code: 'fantasy',
    label: '玄幻',
    value: 'fantasy',
    sortOrder: 1,
    isEnabled: true,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
    description: '以修炼、异世界为背景的小说类型',
  },
  {
    id: '2',
    code: 'urban',
    label: '都市',
    value: 'urban',
    sortOrder: 2,
    isEnabled: true,
    createdAt: '2024-01-12',
    updatedAt: '2024-01-18',
    description: '以现代都市生活为背景的小说类型',
  },
  {
    id: '3',
    code: 'historical',
    label: '历史',
    value: 'historical',
    sortOrder: 3,
    isEnabled: true,
    createdAt: '2024-01-10',
    updatedAt: '2024-01-15',
    description: '以历史背景为主的小说类型',
  },
  {
    id: '4',
    code: 'sci_fi',
    label: '科幻',
    value: 'sci_fi',
    sortOrder: 4,
    isEnabled: false,
    createdAt: '2024-01-08',
    updatedAt: '2024-01-12',
    description: '以科学技术为背景的小说类型',
  },
];

// 筛选配置
const filterOptions: FilterOption[] = [
  {
    key: 'isEnabled',
    label: '状态',
    type: 'select',
    options: ['true', 'false'],
  },
];

// 排序配置
const sortOptions: SortOption[] = [
  { value: 'sortOrder', label: '排序' },
  { value: 'updatedAt', label: '更新时间' },
  { value: 'createdAt', label: '创建时间' },
  { value: 'label', label: '标签名称' },
];

export default function DictionaryCategoryPage() {
  const params = useParams();
  const categoryKey = params.category as string;

  const [currentPage, setCurrentPage] = useState(1);
  const [loading] = useState(false);
  const pageSize = 20;

  // 获取当前分类信息
  const currentCategory = dictionaryCategories[categoryKey as keyof typeof dictionaryCategories];

  // 筛选状态
  const [filters, setFilters] = useState<MogeFilterState>({
    search: '',
    isEnabled: '',
    sortBy: 'sortOrder',
    sortOrder: 'asc',
    viewMode: 'list',
  });

  // 根据筛选条件过滤字典项
  const getFilteredItems = () => {
    let filtered = mockDictItems;

    // 搜索筛选
    if (filters.search) {
      filtered = filtered.filter(
        (item) =>
          item.label.toLowerCase().includes(filters.search.toLowerCase()) ||
          item.code.toLowerCase().includes(filters.search.toLowerCase()) ||
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

  const renderItemCard = (item: (typeof mockDictItems)[0]) => {
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
            <div className="flex items-center gap-4 text-xs text-[var(--moge-text-muted)]">
              <span>排序: {item.sortOrder}</span>
              <span>更新于 {item.updatedAt}</span>
            </div>
          </div>

          <div className="ml-4 flex gap-2">
            <Button variant="ghost" size="sm">
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              {item.isEnabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  const hasActiveFilters = !!(filters.search || filters.isEnabled);

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
    <div className="mx-auto max-w-6xl">
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

      {/* 页面标题 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-han text-2xl font-bold text-[var(--moge-text-main)]">
            {currentCategory.title}
          </h1>
          <p className="mt-1 text-[var(--moge-text-sub)]">{currentCategory.description}</p>
        </div>
        <div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            新建词条
          </Button>
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

      {/* 词条列表 */}
      <MogeList
        items={paginatedItems}
        total={filteredItems.length}
        loading={loading}
        currentPage={currentPage}
        pageSize={pageSize}
        viewMode={filters.viewMode}
        onPageChange={setCurrentPage}
        renderItem={renderItemCard}
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
        gridClassName="grid grid-cols-1 gap-4"
        listClassName="grid gap-4"
      />
    </div>
  );
}
