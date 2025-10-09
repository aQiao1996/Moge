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

/**
 * 筛选器状态接口
 */
export interface MogeFilterState {
  search: string; // 搜索关键词
  sortBy: string; // 排序字段
  sortOrder: 'asc' | 'desc'; // 排序顺序
  viewMode: 'list' | 'grid'; // 视图模式
  [key: string]: string | string[]; // 其他动态筛选条件
}

/**
 * 筛选选项配置接口
 */
export interface FilterOption {
  key: string; // 对应MogeFilterState中的键名
  label: string; // 筛选条件的显示标签
  type: 'select' | 'tags'; // 筛选类型: 下拉选择或标签选择
  options: string[] | { value: string | boolean; label: string }[]; // 可用选项
  placeholder?: string; // select类型的占位符
}

/**
 * 排序选项配置接口
 */
export interface SortOption {
  value: string; // 排序字段值
  label: string; // 排序选项的显示标签
}

/**
 * 筛选器组件属性接口
 */
export interface MogeFilterProps {
  filters: MogeFilterState; // 当前的筛选状态
  onFiltersChange: (filters: MogeFilterState) => void; // 筛选状态变更时的回调函数
  filterOptions?: FilterOption[]; // 筛选选项的配置数组
  sortOptions?: SortOption[]; // 排序选项的配置数组
  searchPlaceholder?: string; // 搜索框的占位符文本
  showViewMode?: boolean; // 是否显示视图模式切换按钮
  showSort?: boolean; // 是否显示排序控制
}

/**
 * 通用筛选器组件
 * 提供搜索、筛选、排序、视图切换等可组合的功能。
 */
export default function MogeFilter({
  filters,
  onFiltersChange,
  filterOptions = [],
  sortOptions = [],
  searchPlaceholder = '搜索...',
  showViewMode = true,
  showSort = true,
}: MogeFilterProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search);

  const updateFilters = (updates: Partial<MogeFilterState>) => {
    const newFilters = { ...filters, ...updates };
    // 确保没有undefined值
    Object.keys(newFilters).forEach((key) => {
      if (newFilters[key] === undefined) {
        if (key === 'tags' || Array.isArray(filters[key])) {
          newFilters[key] = [];
        } else {
          newFilters[key] = '';
        }
      }
    });
    onFiltersChange(newFilters as MogeFilterState);
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
  }, [searchInput, filters.search]);

  // 处理回车键搜索
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  const resetFilters = useCallback(() => {
    const defaultFilters: MogeFilterState = {
      search: '',
      sortBy: sortOptions[0]?.value || 'createdAt',
      sortOrder: 'desc',
      viewMode: 'list',
    };

    // 重置所有筛选字段
    filterOptions.forEach((option) => {
      if (option.type === 'tags') {
        defaultFilters[option.key] = [];
      } else {
        defaultFilters[option.key] = '';
      }
    });

    onFiltersChange(defaultFilters);
    setSearchInput('');
    setIsFilterOpen(false);
  }, [onFiltersChange, filterOptions, sortOptions]);

  const toggleTag = (filterKey: string, tag: string) => {
    const currentTags = (filters[filterKey] as string[]) || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t: string) => t !== tag)
      : [...currentTags, tag];
    updateFilters({ [filterKey]: newTags });
  };

  const removeTag = (filterKey: string, tag: string) => {
    const currentTags = (filters[filterKey] as string[]) || [];
    updateFilters({ [filterKey]: currentTags.filter((t: string) => t !== tag) });
  };

  const hasActiveFilters = !!(
    filters.search ||
    searchInput.trim() ||
    filterOptions.some((option) => {
      const value = filters[option.key];
      return option.type === 'tags' ? (value as string[])?.length > 0 : value;
    })
  );

  // 计算激活的筛选条件数量
  const activeFilterCount = filterOptions.reduce((count, option) => {
    const value = filters[option.key];
    if (option.type === 'tags') {
      return count + ((value as string[])?.length || 0);
    } else {
      return count + (value ? 1 : 0);
    }
  }, 0);

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
            placeholder={searchPlaceholder}
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

        {filterOptions.length > 0 && (
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
                    {activeFilterCount}
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

                {filterOptions.map((option) => (
                  <div key={option.key}>
                    <label className="mb-2 block text-sm font-medium">{option.label}</label>
                    {option.type === 'select' ? (
                      <Select
                        value={(filters[option.key] as string) || undefined}
                        onValueChange={(value) =>
                          updateFilters({ [option.key]: value === 'all' ? '' : value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={option.placeholder || `选择${option.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全部{option.label}</SelectItem>
                          {option.options.map((opt) => {
                            const optValue = typeof opt === 'string' ? opt : String(opt.value);
                            const optLabel = typeof opt === 'string' ? opt : opt.label;
                            return (
                              <SelectItem key={optValue} value={optValue}>
                                {optLabel}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {option.options.map((tag) => {
                          const tagValue = typeof tag === 'string' ? tag : String(tag.value);
                          const tagLabel = typeof tag === 'string' ? tag : tag.label;
                          return (
                            <Button
                              key={tagValue}
                              variant={
                                (filters[option.key] as string[])?.includes(tagValue)
                                  ? 'default'
                                  : 'outline'
                              }
                              size="sm"
                              onClick={() => toggleTag(option.key, tagValue)}
                              className="h-7 text-xs"
                            >
                              {tagLabel}
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* 排序控制 */}
        {showSort && sortOptions.length > 0 && (
          <>
            <Select
              value={filters.sortBy}
              onValueChange={(value) => updateFilters({ sortBy: value })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
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
          </>
        )}

        {/* 视图切换 */}
        {showViewMode && (
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
        )}

        {/* 主重置按钮 - 始终显示 */}
        <Button variant="outline" size="sm" onClick={resetFilters} className="h-9">
          <RotateCcw className="mr-1 h-4 w-4" />
          重置
        </Button>
      </div>

      {/* 已选标签显示 */}
      {filterOptions.some(
        (option) => option.type === 'tags' && (filters[option.key] as string[])?.length > 0
      ) && (
        <div className="space-y-2">
          {filterOptions
            .filter(
              (option) => option.type === 'tags' && (filters[option.key] as string[])?.length > 0
            )
            .map((option) => (
              <div key={option.key} className="flex items-center gap-2">
                <span className="text-sm text-[var(--moge-text-muted)]">已选{option.label}:</span>
                {(filters[option.key] as string[]).map((tag: string) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeTag(option.key, tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
