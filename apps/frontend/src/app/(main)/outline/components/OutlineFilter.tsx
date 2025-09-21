'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Filter, RotateCcw, SortAsc, SortDesc, Grid3X3, List } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import { Outline } from '@moge/types';

export interface FilterState {
  search: string;
  type: string;
  era: string;
  tags: string[];
  status: string;
  sortBy: 'name' | 'createdAt' | 'type';
  sortOrder: 'asc' | 'desc';
  viewMode: 'list' | 'grid';
}

export interface OutlineFilterProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableTypes: string[];
  availableEras: string[];
  availableTags: string[];
}

export default function OutlineFilter({
  filters,
  onFiltersChange,
  availableTypes,
  availableEras,
  availableTags,
}: OutlineFilterProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search);

  const updateFilters = (updates: Partial<FilterState>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  // 更新视图模式（不触发 API 请求）
  const updateViewMode = (viewMode: 'list' | 'grid') => {
    onFiltersChange({ ...filters, viewMode });
  };

  // 执行搜索
  const performSearch = useCallback(() => {
    if (searchInput !== filters.search) {
      updateFilters({ search: searchInput });
    }
  }, [searchInput, filters.search, updateFilters]);

  // 处理回车键搜索
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  const resetFilters = useCallback(() => {
    onFiltersChange({
      search: '',
      type: '',
      era: '',
      tags: [],
      status: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      viewMode: 'list',
    });
    setSearchInput(''); // 同时清空搜索输入
    setIsFilterOpen(false); // 关闭筛选面板
  }, [onFiltersChange]);

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];
    updateFilters({ tags: newTags });
  };

  const removeTag = (tag: string) => {
    updateFilters({ tags: filters.tags.filter((t) => t !== tag) });
  };

  const hasActiveFilters = !!(
    filters.search ||
    searchInput.trim() || // 包括还未搜索的输入
    filters.type ||
    filters.era ||
    filters.tags.length > 0 ||
    filters.status
  );

  // 同步外部搜索值变化
  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  return (
    <div className="space-y-4">
      {/* 搜索栏和主要控制 */}
      <div className="flex items-center gap-3">
        <div className="relative flex flex-1 items-center">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--moge-text-muted)]" />
          <Input
            placeholder="搜索大纲名称或备注..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="pl-10 pr-20"
          />
          <Button
            size="sm"
            onClick={performSearch}
            className="absolute right-1 top-1/2 -translate-y-1/2"
            disabled={searchInput === filters.search}
          >
            搜索
          </Button>
        </div>

        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={hasActiveFilters ? 'border-blue-500 bg-blue-50' : ''}
            >
              <Filter className="mr-2 h-4 w-4" />
              筛选
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                  {
                    [filters.type, filters.era, filters.status, ...filters.tags].filter(Boolean)
                      .length
                  }
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">筛选条件</h4>
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <RotateCcw className="mr-1 h-4 w-4" />
                  重置
                </Button>
              </div>

              {/* 类型筛选 */}
              <div>
                <label className="mb-2 block text-sm font-medium">类型</label>
                <Select
                  value={filters.type || undefined}
                  onValueChange={(value) => updateFilters({ type: value === 'all' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    {availableTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 时代筛选 */}
              <div>
                <label className="mb-2 block text-sm font-medium">时代</label>
                <Select
                  value={filters.era || undefined}
                  onValueChange={(value) => updateFilters({ era: value === 'all' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择时代" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部时代</SelectItem>
                    {availableEras.map((era) => (
                      <SelectItem key={era} value={era}>
                        {era}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 状态筛选 */}
              <div>
                <label className="mb-2 block text-sm font-medium">状态</label>
                <Select
                  value={filters.status}
                  onValueChange={(value) =>
                    updateFilters({
                      status: (value === 'all' ? '' : value) as Outline['status'] | '',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="DRAFT">草稿</SelectItem>
                    <SelectItem value="PUBLISHED">已完成</SelectItem>
                    <SelectItem value="DISCARDED">已放弃</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 标签筛选 */}
              <div>
                <label className="mb-2 block text-sm font-medium">标签</label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <Button
                      key={tag}
                      variant={filters.tags.includes(tag) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleTag(tag)}
                      className="h-7 text-xs"
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* 排序控制 */}
        <Select
          value={filters.sortBy}
          onValueChange={(value: 'name' | 'createdAt' | 'type') => updateFilters({ sortBy: value })}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">创建时间</SelectItem>
            <SelectItem value="name">名称</SelectItem>
            <SelectItem value="type">类型</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={() =>
            updateFilters({
              sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
            })
          }
          title={`当前排序: ${filters.sortOrder === 'asc' ? '升序' : '降序'}`}
        >
          {filters.sortOrder === 'asc' ? (
            <SortAsc className="h-4 w-4" />
          ) : (
            <SortDesc className="h-4 w-4" />
          )}
        </Button>

        {/* 视图切换 */}
        <div className="flex h-9 rounded-md border">
          <Button
            variant={filters.viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => updateViewMode('list')}
            className="rounded-r-none"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={filters.viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => updateViewMode('grid')}
            className="rounded-l-none"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
        </div>

        {/* 主重置按钮 - 始终显示 */}
        <Button
          variant="outline"
          size="sm"
          onClick={resetFilters}
          className="h-9"
          disabled={!hasActiveFilters}
        >
          <RotateCcw className="mr-1 h-4 w-4" />
          重置
        </Button>
      </div>

      {/* 已选标签显示 */}
      {filters.tags.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--moge-text-muted)]">已选标签:</span>
          {filters.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => removeTag(tag)}
            >
              {tag} ×
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
