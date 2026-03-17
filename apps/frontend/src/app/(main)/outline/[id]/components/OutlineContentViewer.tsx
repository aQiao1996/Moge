/**
 * 大纲内容查看器组件
 *
 * 功能：
 * - 显示选中的内容
 * - 支持 Markdown 渲染
 * - 显示空状态提示
 * - 生成时自动滚动到底部
 */
'use client';

import { useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import MdViewer from '@/app/components/MdViewer';
import { Loader2 } from 'lucide-react';

const GENERATING_PLACEHOLDER_WIDTHS = ['w-11/12', 'w-10/12', 'w-9/12', 'w-8/12'];

interface OutlineContentViewerProps {
  /** 选中的标题 */
  selectedTitle: string;
  /** 选中的内容 */
  selectedContent: string;
  /** 是否正在生成（用于自动滚动） */
  isGenerating?: boolean;
}

export default function OutlineContentViewer({
  selectedTitle,
  selectedContent,
  isGenerating = false,
}: OutlineContentViewerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasContent = selectedContent.trim().length > 0;
  const isWaitingForFirstChunk = isGenerating && !hasContent;

  // 生成时自动滚动到底部
  useEffect(() => {
    if (isGenerating && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [selectedContent, isGenerating]);

  return (
    <Card className="flex h-full flex-col overflow-hidden p-6">
      <div className="mb-4 flex-shrink-0">
        <h2 className="text-xl font-semibold">{selectedTitle || '选择内容查看'}</h2>
      </div>

      {isGenerating ? (
        <div
          className="mb-4 rounded-2xl border p-4 backdrop-blur-xl"
          style={{
            backgroundColor: 'var(--moge-card-bg)',
            borderColor: 'var(--moge-card-border)',
            boxShadow: 'var(--moge-glow-card)',
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border"
              style={{
                backgroundColor: 'var(--moge-input-bg)',
                borderColor: 'var(--moge-input-border)',
                color: 'var(--moge-primary-400)',
              }}
            >
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--moge-text-main)]">
                {isWaitingForFirstChunk ? '正在生成大纲，马上开始输出' : '内容生成中，正在持续追加'}
              </p>
              <p className="mt-1 text-xs text-[var(--moge-text-sub)]">
                {isWaitingForFirstChunk
                  ? '模型正在组织卷章结构，首段内容出现前会有短暂等待。'
                  : '内容会实时刷新到下方，可以直接开始阅读。'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <span
                className="h-2 w-2 animate-pulse rounded-full"
                style={{ backgroundColor: 'var(--moge-primary-300)' }}
              />
              <span
                className="h-2 w-2 animate-pulse rounded-full [animation-delay:150ms]"
                style={{ backgroundColor: 'var(--moge-primary-400)' }}
              />
              <span
                className="h-2 w-2 animate-pulse rounded-full [animation-delay:300ms]"
                style={{ backgroundColor: 'var(--moge-primary-500)' }}
              />
            </div>
          </div>
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full"
            style={{ backgroundColor: 'var(--moge-input-bg)' }}
          >
            <div
              className="h-full w-1/3 animate-pulse rounded-full"
              style={{
                backgroundColor: 'var(--moge-primary-400)',
                boxShadow: 'var(--moge-glow-weak)',
              }}
            />
          </div>
        </div>
      ) : null}

      {hasContent ? (
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          <MdViewer md={selectedContent} />
        </div>
      ) : isWaitingForFirstChunk ? (
        <div className="flex flex-1 flex-col justify-center">
          <div
            className="space-y-4 rounded-2xl border border-dashed p-5 backdrop-blur-xl"
            style={{
              backgroundColor: 'var(--moge-card-bg)',
              borderColor: 'var(--moge-input-border)',
            }}
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-[var(--moge-text-muted)]">
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full"
                style={{ backgroundColor: 'var(--moge-primary-400)' }}
              />
              结构编织中
            </div>
            {GENERATING_PLACEHOLDER_WIDTHS.map((width) => (
              <div
                key={width}
                className={`h-4 animate-pulse rounded-full ${width}`}
                style={{ backgroundColor: 'var(--moge-input-bg)' }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="space-y-4">
            <p className="text-muted-foreground">
              {selectedTitle ? '该部分内容为空' : '请从左侧选择要查看的内容'}
            </p>
            {selectedTitle && (
              <p className="text-muted-foreground text-sm">
                点击上方"智能生成"按钮生成内容，或点击"编辑"按钮手动编辑。
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
