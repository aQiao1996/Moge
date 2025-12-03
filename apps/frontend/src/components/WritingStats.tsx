/**
 * 写作统计卡片组件
 * 显示文稿的写作进度和统计信息
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import dayjs from '@/lib/dayjs';

interface WritingStatsProps {
  totalWords: number;
  publishedWords: number;
  totalChapters?: number;
  publishedChapters?: number;
  lastEditedAt?: string;
}

export default function WritingStats({
  totalWords,
  publishedWords,
  totalChapters = 0,
  publishedChapters = 0,
  lastEditedAt,
}: WritingStatsProps) {
  const publishRate = totalWords > 0 ? Math.round((publishedWords / totalWords) * 100) : 0;
  const chapterRate = totalChapters > 0 ? Math.round((publishedChapters / totalChapters) * 100) : 0;

  const formatNumber = (num: number): string => {
    return num.toLocaleString('zh-CN');
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '从未编辑';
    return dayjs(dateStr).fromNow();
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* 总字数卡片 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">总字数</CardTitle>
          <FileText className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(totalWords)}</div>
          <p className="text-muted-foreground text-xs">包含 {totalChapters} 个章节</p>
        </CardContent>
      </Card>

      {/* 已发布字数卡片 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">已发布</CardTitle>
          <CheckCircle2 className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(publishedWords)}</div>
          <p className="text-muted-foreground text-xs">{publishedChapters} 个章节已发布</p>
        </CardContent>
      </Card>

      {/* 发布进度卡片 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">发布进度</CardTitle>
          <TrendingUp className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{publishRate}%</div>
          <Progress value={publishRate} className="mt-2" />
          <p className="text-muted-foreground mt-2 text-xs">章节发布率 {chapterRate}%</p>
        </CardContent>
      </Card>

      {/* 最后编辑时间卡片 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">最后编辑</CardTitle>
          <Clock className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatDate(lastEditedAt)}</div>
          <div className="mt-2">
            <Badge variant="secondary" className="text-xs">
              {lastEditedAt ? '持续创作中' : '待开始'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
