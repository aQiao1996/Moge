'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import MogePagination from '@/app/components/MogePagination';
import { ReactNode } from 'react';

/**
 * 列表项数据接口
 */
export interface MogeListItem {
  id: string | number;
  [key: string]: string | number | boolean | string[] | null | undefined | object;
}

/**
 * 列表组件属性接口
 */
export interface MogeListProps<T extends MogeListItem> {
  items: T[];
  total: number;
  loading: boolean;
  currentPage: number;
  pageSize: number;
  viewMode: 'list' | 'grid';
  onPageChange: (page: number) => void;
  renderItem: (item: T) => ReactNode;
  emptyIcon?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  hasFilters?: boolean;
  showPagination?: boolean;
  gridClassName?: string;
  listClassName?: string;
}

/**
 * 通用列表组件
 * 支持列表和网格两种视图模式，提供加载状态、空状态、分页等功能
 * @param props 组件属性
 */
export default function MogeList<T extends MogeListItem>({
  items,
  total,
  loading,
  currentPage,
  pageSize,
  viewMode,
  onPageChange,
  renderItem,
  emptyIcon,
  emptyTitle = '暂无数据',
  emptyDescription,
  hasFilters = false,
  showPagination = true,
  gridClassName = 'auto-fit-grid grid gap-4',
  listClassName = 'grid gap-4',
}: MogeListProps<T>) {
  // 加载状态
  if (loading) {
    return (
      <div className={viewMode === 'grid' ? gridClassName : listClassName}>
        {[...Array<number>(3)].map((_, i) => (
          <Card
            key={i}
            className="border p-4 backdrop-blur-xl"
            style={{
              backgroundColor: 'var(--moge-card-bg)',
              borderColor: 'var(--moge-card-border)',
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-40 rounded-md" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-3/4 rounded-md" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // 空状态
  if (items.length === 0 && !loading) {
    return (
      <Card
        className="border p-10 text-center backdrop-blur-xl"
        style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
      >
        {emptyIcon}
        <h3 className="mt-4 text-lg font-semibold text-[var(--moge-text-main)]">{emptyTitle}</h3>
        {emptyDescription && (
          <p className="mt-2 text-[var(--moge-text-sub)]">
            {hasFilters ? '没有找到符合条件的数据' : emptyDescription}
          </p>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 列表或网格视图 */}
      <div className={viewMode === 'grid' ? gridClassName : listClassName}>
        {items.map(renderItem)}
      </div>

      {/* 分页 */}
      {showPagination && (
        <MogePagination
          currentPage={currentPage}
          totalPages={Math.ceil(total / pageSize)}
          onPageChange={onPageChange}
          showTotal={true}
          totalItems={total}
        />
      )}
    </div>
  );
}
