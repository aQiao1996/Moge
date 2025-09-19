'use client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, Edit, Trash2 } from 'lucide-react';
import { useOutlineStore } from '@/stores/outlineStore';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

export interface Outline {
  id: string;
  name: string;
  type: string;
  era?: string;
  conflict?: string;
  tags?: string[];
  remark?: string;
}

export default function OutlineList() {
  const { outlines, total, loading, getOutlines } = useOutlineStore();
  const [pageNum, setPageNum] = useState(1);
  const [pageSize] = useState(10);

  useEffect(() => {
    void getOutlines({ pageNum, pageSize });
  }, [getOutlines, pageNum, pageSize]);

  if (loading) {
    return (
      <div className="grid gap-4">
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

  if (outlines.length === 0) {
    return (
      <Card
        className="border p-10 text-center backdrop-blur-xl"
        style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
      >
        <BookOpen className="mx-auto h-12 w-12 text-[var(--moge-text-muted)]" />
        <p className="mt-4 text-[var(--moge-text-sub)]">
          暂无大纲，点击右上角「新增大纲」创建第一条
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {outlines.map((it) => (
        <Card
          key={it.id}
          className="border p-4 backdrop-blur-xl transition hover:shadow-[var(--moge-glow-card)]"
          style={{
            backgroundColor: 'var(--moge-card-bg)',
            borderColor: 'var(--moge-card-border)',
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                {/* 小说名称 */}
                <h3 className="font-semibold text-[var(--moge-text-main)]">{it.name}</h3>
                {/* 小说类型 */}
                <Badge className="text-xs">{it.type}</Badge>
                {/* 小说时代 */}
                {it.era && (
                  <Badge variant="outline" className="text-xs">
                    {it.era}
                  </Badge>
                )}
              </div>
              {/* 小说备注 */}
              {it.remark && (
                <p className="mt-2 line-clamp-2 text-sm text-[var(--moge-text-sub)]">{it.remark}</p>
              )}
              {/* 小说标签 */}
              {it.tags && it.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {it.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center gap-4 text-xs text-[var(--moge-text-muted)]">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
            {/* 操作组 */}
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost">
                <Edit className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" onClick={() => setPageNum((prev) => prev - 1)} />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">{total}</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" onClick={() => setPageNum((prev) => prev + 1)} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
