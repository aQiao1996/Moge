'use client';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from '@/components/ui/pagination';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

/**
 * 分页组件的属性接口
 */
export interface MogePaginationProps {
  currentPage: number; // 当前页码
  totalPages: number; // 总页数
  onPageChange: (page: number) => void; // 页码变化时的回调函数
  showTotal?: boolean; // 是否显示总记录数和总页数信息
  totalItems?: number; // 总记录数
}

/**
 * 通用分页组件
 * 提供了页码导航、上一页/下一页功能,并能自适应地显示省略号。
 */
export default function MogePagination({
  currentPage,
  totalPages,
  onPageChange,
  showTotal = false,
  totalItems,
}: MogePaginationProps) {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    onPageChange(page);
  };

  const renderPageNumbers = () => {
    const items = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handlePageClick(i);
              }}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handlePageClick(1);
            }}
            isActive={currentPage === 1}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          items.push(
            <PaginationItem key={i}>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handlePageClick(i);
                }}
                isActive={currentPage === i}
              >
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
      }

      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handlePageClick(totalPages);
              }}
              isActive={currentPage === totalPages}
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      {showTotal && totalItems && (
        <p className="text-sm text-[var(--moge-text-muted)]">
          共 {totalItems} 条记录，第 {currentPage} / {totalPages} 页
        </p>
      )}
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handlePrevious();
              }}
              className={`w-20 gap-1 px-2.5 sm:pl-2.5 ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
              aria-label="Go to previous page"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              <span className="hidden sm:block">上一页</span>
            </PaginationLink>
          </PaginationItem>
          {renderPageNumbers()}
          <PaginationItem>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleNext();
              }}
              className={`w-20 gap-1 px-2.5 sm:pr-2.5 ${currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}`}
              aria-label="Go to next page"
            >
              <span className="hidden sm:block">下一页</span>
              <ChevronRightIcon className="h-4 w-4" />
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
