'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, FileText, CheckCircle2, TrendingUp, BookMarked } from 'lucide-react';
import { getUserStats, type UserStats } from '@/api/manuscripts.api';

export default function StatsPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getUserStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadStats();
  }, []);

  const formatNumber = (num: number): string => {
    return num.toLocaleString('zh-CN');
  };

  const publishRate = stats?.totalWords
    ? Math.round((stats.publishedWords / stats.totalWords) * 100)
    : 0;

  if (loading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6">
            <h1 className="font-han text-2xl font-bold text-[var(--moge-text-main)]">统计</h1>
          </div>
          <div className="animate-pulse space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="h-32 rounded-md bg-[var(--moge-input-bg)]" />
              <div className="h-32 rounded-md bg-[var(--moge-input-bg)]" />
              <div className="h-32 rounded-md bg-[var(--moge-input-bg)]" />
              <div className="h-32 rounded-md bg-[var(--moge-input-bg)]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6">
            <h1 className="font-han text-2xl font-bold text-[var(--moge-text-main)]">统计</h1>
          </div>
          <Card
            className="border p-10 text-center backdrop-blur-xl"
            style={{
              backgroundColor: 'var(--moge-card-bg)',
              borderColor: 'var(--moge-card-border)',
            }}
          >
            <p className="text-[var(--moge-text-sub)]">暂无统计数据</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* 固定标题 */}
      <div className="mx-auto w-full max-w-6xl px-6 pt-6">
        <div className="mb-6">
          <h1 className="font-han text-2xl font-bold text-[var(--moge-text-main)]">统计</h1>
          <p className="text-muted-foreground mt-1 text-sm">查看您的写作成果和进度</p>
        </div>
      </div>

      {/* 可滚动内容 */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 pb-6">
          {/* 总体统计卡片 */}
          <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* 总字数 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总字数</CardTitle>
                <FileText className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.totalWords)}</div>
                <p className="text-muted-foreground text-xs">
                  已发布 {formatNumber(stats.publishedWords)} 字
                </p>
              </CardContent>
            </Card>

            {/* 文稿数量 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">文稿数量</CardTitle>
                <BookOpen className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalManuscripts}</div>
                <p className="text-muted-foreground text-xs">
                  {stats.inProgressManuscripts} 部创作中
                </p>
              </CardContent>
            </Card>

            {/* 章节数量 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">章节数量</CardTitle>
                <BookMarked className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalChapters}</div>
                <p className="text-muted-foreground text-xs">{stats.publishedChapters} 章已发布</p>
              </CardContent>
            </Card>

            {/* 发布率 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">发布率</CardTitle>
                <CheckCircle2 className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{publishRate}%</div>
                <p className="text-muted-foreground text-xs">
                  章节发布率{' '}
                  {stats.totalChapters > 0
                    ? Math.round((stats.publishedChapters / stats.totalChapters) * 100)
                    : 0}
                  %
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 最近7天趋势 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <CardTitle>最近7天写作趋势</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {Object.keys(stats.dailyStats).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(stats.dailyStats)
                    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                    .map(([date, words]) => {
                      const maxWords = Math.max(...Object.values(stats.dailyStats));
                      const percentage = maxWords > 0 ? (words / maxWords) * 100 : 0;
                      return (
                        <div key={date} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {new Date(date).toLocaleDateString('zh-CN', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            <span className="font-medium">{formatNumber(words)} 字</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--moge-input-bg)]">
                            <div
                              className="bg-primary h-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  最近7天暂无写作记录
                </p>
              )}
            </CardContent>
          </Card>

          {/* 完成情况 */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>文稿状态分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">进行中</span>
                    <span className="font-medium">{stats.inProgressManuscripts} 部</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">已完结</span>
                    <span className="font-medium">{stats.completedManuscripts} 部</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">总计</span>
                    <span className="font-medium">{stats.totalManuscripts} 部</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>发布进度</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span>字数发布率</span>
                      <span className="font-medium">{publishRate}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--moge-input-bg)]">
                      <div
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${publishRate}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span>章节发布率</span>
                      <span className="font-medium">
                        {stats.totalChapters > 0
                          ? Math.round((stats.publishedChapters / stats.totalChapters) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--moge-input-bg)]">
                      <div
                        className="bg-primary h-full transition-all duration-300"
                        style={{
                          width: `${stats.totalChapters > 0 ? (stats.publishedChapters / stats.totalChapters) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
