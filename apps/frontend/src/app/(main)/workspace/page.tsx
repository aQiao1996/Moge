'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  BookOpen,
  FolderOpen,
  TrendingUp,
  Calendar,
  PenTool,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getWorkspaceSummary, type WorkspaceSummary } from '@/api/workspace.api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

export default function WorkspacePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<WorkspaceSummary | null>(null);

  useEffect(() => {
    void loadWorkspaceSummary();
  }, []);

  const loadWorkspaceSummary = async () => {
    try {
      setLoading(true);
      const data = await getWorkspaceSummary();
      setSummary(data);
    } catch (error) {
      console.error('加载工作台数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 格式化数字
  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toString();
  };

  // 获取状态标签
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      DRAFT: { label: '草稿', className: 'bg-gray-100 text-gray-600' },
      IN_PROGRESS: { label: '进行中', className: 'bg-blue-100 text-blue-600' },
      COMPLETED: { label: '已完结', className: 'bg-green-100 text-green-600' },
      PUBLISHED: { label: '已发布', className: 'bg-purple-100 text-purple-600' },
      GENERATING: { label: '生成中', className: 'bg-yellow-100 text-yellow-600' },
      GENERATED: { label: '已生成', className: 'bg-cyan-100 text-cyan-600' },
    };
    const config = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-600' };
    return (
      <span
        className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <Skeleton className="h-12 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="font-han text-2xl font-bold text-[var(--moge-text-main)]">工作台</h1>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/settings')} variant="outline" size="sm">
            <Plus className="mr-1 h-4 w-4" />
            新建项目
          </Button>
          <Button onClick={() => router.push('/outline')} variant="outline" size="sm">
            <Plus className="mr-1 h-4 w-4" />
            新建大纲
          </Button>
          <Button onClick={() => router.push('/manuscripts')} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            新建文稿
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <PenTool className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--moge-text-sub)]">今日字数</p>
              <p className="text-2xl font-bold text-[var(--moge-text-main)]">
                {formatNumber(summary?.stats.todayWords || 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-2">
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--moge-text-sub)]">本周字数</p>
              <p className="text-2xl font-bold text-[var(--moge-text-main)]">
                {formatNumber(summary?.stats.weekWords || 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-50 p-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--moge-text-sub)]">总字数</p>
              <p className="text-2xl font-bold text-[var(--moge-text-main)]">
                {formatNumber(summary?.stats.totalWords || 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-50 p-2">
              <FolderOpen className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--moge-text-sub)]">项目数</p>
              <p className="text-2xl font-bold text-[var(--moge-text-main)]">
                {summary?.stats.projectCount || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-pink-50 p-2">
              <FileText className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--moge-text-sub)]">文稿数</p>
              <p className="text-2xl font-bold text-[var(--moge-text-main)]">
                {summary?.stats.manuscriptCount || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 最近内容 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 最近项目 */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <FolderOpen className="h-5 w-5" />
              最近项目
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/settings')}
              className="text-sm"
            >
              查看全部
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-3">
            {summary?.recentProjects.length ? (
              summary.recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="cursor-pointer rounded-lg border p-3 transition-colors hover:bg-gray-50"
                  onClick={() => router.push(`/settings/${project.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-[var(--moge-text-main)]">{project.name}</h4>
                      <p className="text-sm text-[var(--moge-text-sub)]">{project.type}</p>
                    </div>
                    <span className="text-xs text-[var(--moge-text-muted)]">
                      {dayjs(project.updatedAt).fromNow()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-[var(--moge-text-muted)]">暂无项目</p>
            )}
          </div>
        </Card>

        {/* 最近大纲 */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <BookOpen className="h-5 w-5" />
              最近大纲
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/outline')}
              className="text-sm"
            >
              查看全部
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-3">
            {summary?.recentOutlines.length ? (
              summary.recentOutlines.map((outline) => (
                <div
                  key={outline.id}
                  className="cursor-pointer rounded-lg border p-3 transition-colors hover:bg-gray-50"
                  onClick={() => router.push(`/outline/${outline.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-[var(--moge-text-main)]">{outline.name}</h4>
                      <div className="mt-1 flex items-center gap-2">
                        {getStatusBadge(outline.status)}
                        <span className="text-xs text-[var(--moge-text-sub)]">{outline.type}</span>
                      </div>
                    </div>
                    <span className="text-xs text-[var(--moge-text-muted)]">
                      {dayjs(outline.updatedAt).fromNow()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-[var(--moge-text-muted)]">暂无大纲</p>
            )}
          </div>
        </Card>

        {/* 最近文稿 */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <FileText className="h-5 w-5" />
              最近文稿
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/manuscripts')}
              className="text-sm"
            >
              查看全部
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-3">
            {summary?.recentManuscripts.length ? (
              summary.recentManuscripts.map((manuscript) => (
                <div
                  key={manuscript.id}
                  className="cursor-pointer rounded-lg border p-3 transition-colors hover:bg-gray-50"
                  onClick={() => {
                    if (manuscript.lastEditedChapterId) {
                      router.push(
                        `/manuscripts/${manuscript.id}/edit?chapter=${manuscript.lastEditedChapterId}`
                      );
                    } else {
                      router.push(`/manuscripts/${manuscript.id}`);
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-[var(--moge-text-main)]">
                        {manuscript.name}
                      </h4>
                      <div className="mt-1 flex items-center gap-2">
                        {getStatusBadge(manuscript.status)}
                        <span className="text-xs text-[var(--moge-text-sub)]">
                          {formatNumber(manuscript.totalWords)} 字
                        </span>
                      </div>
                    </div>
                    {manuscript.lastEditedAt && (
                      <span className="text-xs text-[var(--moge-text-muted)]">
                        {dayjs(manuscript.lastEditedAt).fromNow()}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-[var(--moge-text-muted)]">暂无文稿</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
