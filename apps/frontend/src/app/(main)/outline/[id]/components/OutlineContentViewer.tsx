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

      {selectedContent ? (
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          <MdViewer md={selectedContent} />
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
