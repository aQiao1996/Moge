/**
 * 大纲内容查看器组件
 *
 * 功能：
 * - 显示选中的内容
 * - 支持 Markdown 渲染
 * - 显示空状态提示
 */
'use client';

import { Card } from '@/components/ui/card';
import MdViewer from '@/app/components/MdViewer';

interface OutlineContentViewerProps {
  /** 选中的标题 */
  selectedTitle: string;
  /** 选中的内容 */
  selectedContent: string;
}

export default function OutlineContentViewer({
  selectedTitle,
  selectedContent,
}: OutlineContentViewerProps) {
  return (
    <Card className="flex-1 overflow-y-auto p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{selectedTitle || '选择内容查看'}</h2>
      </div>

      {selectedContent ? (
        <MdViewer md={selectedContent} />
      ) : (
        <div className="flex h-[550px] flex-col items-center justify-center text-center">
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
