/**
 * 章节版本历史组件
 * 显示章节内容的所有历史版本，支持查看和恢复
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getChapterVersions, restoreChapterVersion, ChapterVersion } from '@/api/manuscripts.api';
import { Clock, RotateCcw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface ChapterVersionHistoryProps {
  chapterId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVersionRestored?: () => void;
}

export default function ChapterVersionHistory({
  chapterId,
  open,
  onOpenChange,
  onVersionRestored,
}: ChapterVersionHistoryProps) {
  const [versions, setVersions] = useState<ChapterVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<ChapterVersion | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (open && chapterId) {
      void fetchVersions();
    }
  }, [open, chapterId]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const data = await getChapterVersions(chapterId);
      setVersions(data);
    } catch (error) {
      console.error('Failed to fetch version history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (version: number) => {
    setRestoring(true);
    try {
      await restoreChapterVersion(chapterId, version);
      toast.success('版本恢复成功');
      onOpenChange(false);
      onVersionRestored?.();
    } catch (error) {
      console.error('Failed to restore version:', error);
    } finally {
      setRestoring(false);
    }
  };

  const calculateWordCount = (content: string): number => {
    return content.replace(/\s/g, '').length;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>版本历史</SheetTitle>
          <SheetDescription>查看和恢复章节内容的历史版本</SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex h-[calc(100vh-12rem)] gap-4">
          {/* 版本列表 */}
          <div className="w-1/3 border-r pr-4">
            <ScrollArea className="h-full">
              {loading ? (
                <div className="text-muted-foreground flex items-center justify-center py-8 text-sm">
                  加载中...
                </div>
              ) : versions.length === 0 ? (
                <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-8">
                  <AlertCircle className="text-muted-foreground h-8 w-8" />
                  <p className="text-sm">暂无历史版本</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {versions.map((ver) => (
                    <div
                      key={ver.id}
                      className={`hover:bg-accent cursor-pointer rounded-lg border p-3 transition-colors ${
                        selectedVersion?.id === ver.id ? 'bg-accent border-primary' : ''
                      }`}
                      onClick={() => setSelectedVersion(ver)}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          版本 {ver.version}
                        </Badge>
                        <Clock className="text-muted-foreground h-3 w-3" />
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(ver.createdAt), {
                          addSuffix: true,
                          locale: zhCN,
                        })}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {calculateWordCount(ver.content)} 字
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* 版本内容预览 */}
          <div className="flex flex-1 flex-col">
            {selectedVersion ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">版本 {selectedVersion.version}</h3>
                    <p className="text-muted-foreground text-sm">
                      {new Date(selectedVersion.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <Button
                    onClick={() => void handleRestore(selectedVersion.version)}
                    disabled={restoring}
                    size="sm"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    恢复此版本
                  </Button>
                </div>
                <Separator className="mb-4" />
                <ScrollArea className="flex-1">
                  <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                    {selectedVersion.content}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2">
                <Clock className="text-muted-foreground h-12 w-12" />
                <p className="text-sm">选择一个版本查看详情</p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
