'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, Users, Zap, Globe, Folder, Settings } from 'lucide-react';
import MogeFilter, { MogeFilterState, FilterOption, SortOption } from '@/app/components/MogeFilter';
import MogeList from '@/app/components/MogeList';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProjectDialog from './components/ProjectDialog';
import type { CreateProjectValues } from '@moge/types';

interface Project {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  settings: {
    characters: number;
    systems: number;
    worlds: number;
    misc: number;
  };
  [key: string]: string | number | boolean | string[] | null | undefined | object;
}

// 模拟小说项目数据
const mockProjects: Project[] = [
  {
    id: '1',
    name: '仙侠传说',
    type: '仙侠',
    createdAt: '2024-01-15',
    settings: {
      characters: 8,
      systems: 3,
      worlds: 5,
      misc: 12,
    },
  },
  {
    id: '2',
    name: '都市修仙',
    type: '都市',
    createdAt: '2024-02-20',
    settings: {
      characters: 12,
      systems: 5,
      worlds: 3,
      misc: 8,
    },
  },
  {
    id: '3',
    name: '末世求生',
    type: '科幻',
    createdAt: '2024-03-10',
    settings: {
      characters: 6,
      systems: 2,
      worlds: 4,
      misc: 7,
    },
  },
];

// 筛选配置
const filterOptions: FilterOption[] = [
  {
    key: 'type',
    label: '类型',
    type: 'select',
    options: ['仙侠', '都市', '科幻', '玄幻', '历史'],
    placeholder: '选择类型',
  },
];

// 排序配置
const sortOptions: SortOption[] = [
  { value: 'createdAt', label: '创建时间' },
  { value: 'name', label: '名称' },
  { value: 'type', label: '类型' },
];

/**
 * 设定集首页组件
 * 显示所有小说项目的管理界面，支持项目筛选、搜索和创建
 */
export default function SettingsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [loading] = useState(false);
  const pageSize = 6;
  const router = useRouter();

  // 筛选状态
  const [filters, setFilters] = useState<MogeFilterState>({
    search: '',
    type: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    viewMode: 'list',
  });

  /**
   * 处理项目卡片点击事件
   * @param projectId 项目ID
   */
  const handleProjectClick = (projectId: string) => {
    router.push(`/settings/${projectId}`);
  };

  /**
   * 处理创建项目表单提交
   * @param values 项目创建表单数据
   */
  const handleCreateProject = (values: CreateProjectValues) => {
    console.log('Creating project:', values);
    // TODO: 实现创建项目的API调用
  };

  /**
   * 根据筛选条件过滤项目列表
   * @returns 过滤后的项目数组
   */
  const getFilteredProjects = () => {
    let filtered = [...mockProjects];

    // 搜索筛选
    if (filters.search) {
      filtered = filtered.filter((project) =>
        project.name.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // 类型筛选
    if (filters.type) {
      filtered = filtered.filter((project) => project.type === filters.type);
    }

    // 排序
    filtered.sort((a, b) => {
      const aValue = a[filters.sortBy as keyof Project] as string;
      const bValue = b[filters.sortBy as keyof Project] as string;

      const comparison = aValue.localeCompare(bValue);
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  };

  const filteredProjects = getFilteredProjects();
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  /**
   * 渲染项目卡片组件
   * @param project 项目数据
   * @returns 项目卡片JSX元素
   */
  const renderProjectCard = (project: Project) => {
    const totalSettings = Object.values(project.settings).reduce((sum, count) => sum + count, 0);

    return (
      <Card
        key={project.id}
        className="cursor-pointer border p-6 transition-all duration-200 hover:shadow-[var(--moge-glow-card)]"
        style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
        onClick={() => handleProjectClick(project.id)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[var(--moge-primary-400)]" />
              <h3 className="font-semibold text-[var(--moge-text-main)]">{project.name}</h3>
            </div>
            <div className="mb-3 flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {project.type}
              </Badge>
              <span className="flex items-center gap-1 text-xs text-[var(--moge-text-muted)]">
                <Calendar className="h-3 w-3" />
                {project.createdAt}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-[var(--moge-text-muted)]" />
                <span className="text-[var(--moge-text-sub)]">
                  角色 {project.settings.characters}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-[var(--moge-text-muted)]" />
                <span className="text-[var(--moge-text-sub)]">系统 {project.settings.systems}</span>
              </div>
              <div className="flex items-center gap-1">
                <Globe className="h-3 w-3 text-[var(--moge-text-muted)]" />
                <span className="text-[var(--moge-text-sub)]">世界 {project.settings.worlds}</span>
              </div>
              <div className="flex items-center gap-1">
                <Folder className="h-3 w-3 text-[var(--moge-text-muted)]" />
                <span className="text-[var(--moge-text-sub)]">辅助 {project.settings.misc}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--moge-text-sub)]">设定总数</span>
            <span className="font-medium text-[var(--moge-text-main)]">{totalSettings}</span>
          </div>
        </div>
      </Card>
    );
  };

  const hasActiveFilters = !!(filters.search || filters.type);

  return (
    <div className="mx-auto max-w-6xl">
      {/* 标题和功能入口 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-han text-2xl font-bold text-[var(--moge-text-main)]">设定集</h1>
          <p className="mt-1 text-[var(--moge-text-sub)]">管理您的小说设定，构建完整的创作世界</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/settings/library">
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              设定库
            </Button>
          </Link>
          {mockProjects.length > 0 && (
            <ProjectDialog mode="create" onSubmit={handleCreateProject} />
          )}
        </div>
      </div>

      {/* 筛选组件 */}
      {mockProjects.length > 0 && (
        <div className="mb-6">
          <MogeFilter
            filters={filters}
            onFiltersChange={setFilters}
            filterOptions={filterOptions}
            sortOptions={sortOptions}
            searchPlaceholder="搜索小说项目名称..."
            showViewMode={true}
            showSort={true}
          />
        </div>
      )}

      {/* 项目列表 */}
      <MogeList
        items={paginatedProjects}
        total={filteredProjects.length}
        loading={loading}
        currentPage={currentPage}
        pageSize={pageSize}
        viewMode={filters.viewMode}
        onPageChange={setCurrentPage}
        renderItem={renderProjectCard}
        emptyIcon={<BookOpen className="mx-auto h-16 w-16 text-[var(--moge-text-muted)]" />}
        emptyTitle={hasActiveFilters ? '没有找到符合条件的项目' : '还没有小说项目'}
        emptyDescription={hasActiveFilters ? undefined : '创建您的第一个小说项目，开始构建设定集'}
        hasFilters={hasActiveFilters}
        showPagination={filteredProjects.length > pageSize}
        gridClassName="grid grid-cols-1 gap-4 lg:grid-cols-2"
        listClassName="grid gap-4"
      />

      {/* 空状态时的创建按钮 */}
      {mockProjects.length === 0 && (
        <div className="mt-6 text-center">
          <ProjectDialog mode="create" onSubmit={handleCreateProject} />
        </div>
      )}
    </div>
  );
}
