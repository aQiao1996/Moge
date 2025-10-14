'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Calendar,
  Users,
  Zap,
  Globe,
  Folder,
  Settings,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';
import MogeFilter, { MogeFilterState, FilterOption, SortOption } from '@/app/components/MogeFilter';
import MogeList from '@/app/components/MogeList';
import MogeConfirmPopover from '@/app/components/MogeConfirmPopover';
import Link from 'next/link';
import ProjectDialog from './components/ProjectDialog';
import ProjectDetailDialog from './components/ProjectDetailDialog';
import type { CreateProjectValues, Project as ProjectType } from '@moge/types';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  type Project as ApiProject,
} from '@/api/projects.api';

interface Project {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  tags: string[];
  characters: string[];
  systems: string[];
  worlds: string[];
  misc: string[];
  createdAt: string;
  updatedAt: string;
  [key: string]: string | number | boolean | string[] | null | undefined | object;
}

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
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const pageSize = 6;

  // 筛选状态
  const [filters, setFilters] = useState<MogeFilterState>({
    search: '',
    type: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    viewMode: 'list',
  });

  /**
   * 从API加载项目数据
   */
  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await getProjects();

      // 转换API数据格式为页面所需格式
      const transformedProjects: Project[] = data.map((item: ApiProject) => ({
        id: String(item.id),
        name: item.name,
        type: item.type,
        description: item.description,
        tags: item.tags,
        characters: item.characters,
        systems: item.systems,
        worlds: item.worlds,
        misc: item.misc,
        createdAt: new Date(item.createdAt).toISOString().split('T')[0],
        updatedAt: item.updatedAt,
      }));

      setProjects(transformedProjects);
    } catch (error) {
      console.error('加载项目列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    void loadProjects();
  }, []);

  /**
   * 处理创建项目表单提交
   * @param values 项目创建表单数据
   */
  const handleCreateProject = async (values: CreateProjectValues) => {
    try {
      await createProject({
        name: values.name,
        type: values.type,
        description: values.description,
        tags: values.tags || [],
        characters: values.characters?.map(String) || [],
        systems: values.systems?.map(String) || [],
        worlds: values.worlds?.map(String) || [],
        misc: values.misc?.map(String) || [],
      });

      // 重新加载项目列表
      await loadProjects();
    } catch (error) {
      console.error('创建项目失败:', error);
      throw error;
    }
  };

  /**
   * 处理更新项目表单提交
   * @param projectId 项目ID
   * @param values 项目更新表单数据
   */
  const handleUpdateProject = async (projectId: number, values: CreateProjectValues) => {
    try {
      await updateProject(projectId, {
        name: values.name,
        type: values.type,
        description: values.description,
        tags: values.tags || [],
        characters: values.characters?.map(String) || [],
        systems: values.systems?.map(String) || [],
        worlds: values.worlds?.map(String) || [],
        misc: values.misc?.map(String) || [],
      });

      // 重新加载项目列表
      await loadProjects();
    } catch (error) {
      console.error('更新项目失败:', error);
      throw error;
    }
  };

  /**
   * 处理删除项目
   * @param project 项目数据
   */
  const handleDeleteProject = async (project: Project) => {
    try {
      await deleteProject(Number(project.id));
      // 重新加载项目列表
      await loadProjects();
    } catch (error) {
      console.error('删除项目失败:', error);
    }
  };

  /**
   * 处理查看项目详情
   * @param project 项目数据
   */
  const handleViewDetail = (project: Project) => {
    setSelectedProject(project);
    setDetailDialogOpen(true);
  };

  /**
   * 根据筛选条件过滤项目列表
   * @returns 过滤后的项目数组
   */
  const getFilteredProjects = () => {
    let filtered = [...projects];

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
    const totalSettings =
      project.characters.length +
      project.systems.length +
      project.worlds.length +
      project.misc.length;

    return (
      <Card
        key={project.id}
        className="border p-6 transition-all duration-200"
        style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
      >
        <div className="flex items-start justify-between gap-4">
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
                  角色 {project.characters.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-[var(--moge-text-muted)]" />
                <span className="text-[var(--moge-text-sub)]">系统 {project.systems.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <Globe className="h-3 w-3 text-[var(--moge-text-muted)]" />
                <span className="text-[var(--moge-text-sub)]">世界 {project.worlds.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <Folder className="h-3 w-3 text-[var(--moge-text-muted)]" />
                <span className="text-[var(--moge-text-sub)]">辅助 {project.misc.length}</span>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-[var(--moge-text-sub)]">设定总数</span>
              <span className="font-medium text-[var(--moge-text-main)]">{totalSettings}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              title="查看详情"
              onClick={() => handleViewDetail(project)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <ProjectDialog
              mode="edit"
              item={
                {
                  name: project.name,
                  type: project.type,
                  description: project.description,
                  tags: project.tags,
                  characters: project.characters,
                  systems: project.systems,
                  worlds: project.worlds,
                  misc: project.misc,
                } as unknown as ProjectType
              }
              onSubmit={async (values) => {
                await handleUpdateProject(Number(project.id), values);
              }}
              trigger={
                <Button size="sm" variant="ghost" title="编辑">
                  <Edit className="h-4 w-4" />
                </Button>
              }
            />
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
              description={`此操作无法撤销，确定要删除「${project.name}」吗？`}
              confirmText="确认删除"
              cancelText="取消"
              loadingText="删除中..."
              confirmVariant="destructive"
              onConfirm={() => handleDeleteProject(project)}
            />
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
          <ProjectDialog mode="create" onSubmit={handleCreateProject} />
        </div>
      </div>

      {/* 筛选组件 */}
      {projects.length > 0 && (
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

      {/* 项目详情弹窗 */}
      <ProjectDetailDialog
        project={
          selectedProject
            ? ({
                ...selectedProject,
                id: Number(selectedProject.id),
              } as unknown as ProjectType)
            : null
        }
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onUpdate={loadProjects}
      />
    </div>
  );
}
