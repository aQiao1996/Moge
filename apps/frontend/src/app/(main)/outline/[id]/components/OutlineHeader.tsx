/**
 * 大纲详情页头部组件
 *
 * 功能：
 * - 显示大纲基本信息（名称、类型、时代、状态）
 * - 提供操作按钮（返回、生成、保存、编辑）
 */
'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Sparkles, Save } from 'lucide-react';
import MogeConfirmPopover from '@/app/components/MogeConfirmPopover';
import type { OutlineWithStructure } from '@moge/types';

interface OutlineHeaderProps {
  /** 大纲数据 */
  outlineData: OutlineWithStructure;
  /** 状态配置 */
  statusConfig: Record<string, { text: string; variant: string }>;
  /** 当前选中的内容 */
  selectedContent: string;
  /** 当前选中的标题 */
  selectedTitle: string;
  /** 是否正在生成 */
  isGenerating: boolean;
  /** 是否正在保存 */
  isSaving: boolean;
  /** 返回列表回调 */
  onBack: () => void;
  /** 生成大纲回调 */
  onGenerate: () => void;
  /** 保存大纲回调 */
  onSave: () => void;
  /** 编辑大纲回调 */
  onEdit: () => void;
}

export default function OutlineHeader({
  outlineData,
  statusConfig,
  selectedContent,
  selectedTitle,
  isGenerating,
  isSaving,
  onBack,
  onGenerate,
  onSave,
  onEdit,
}: OutlineHeaderProps) {
  const status = statusConfig[outlineData.status as keyof typeof statusConfig];

  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{outlineData.name}</h1>
          <p className="text-muted-foreground text-sm">
            {outlineData.type} · {outlineData.era} · {status.text}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* 智能生成按钮 */}
        {selectedContent ? (
          <MogeConfirmPopover
            trigger={
              <Button disabled={isGenerating} variant="outline">
                <Sparkles className="mr-2 h-4 w-4" />
                {isGenerating ? '生成中...' : '智能生成'}
              </Button>
            }
            title="确认智能生成"
            description="智能生成会覆盖当前内容，确定要继续吗？"
            confirmText="确定生成"
            cancelText="取消"
            loadingText="生成中..."
            confirmVariant="default"
            onConfirm={onGenerate}
          />
        ) : (
          <Button onClick={onGenerate} disabled={isGenerating} variant="outline">
            <Sparkles className="mr-2 h-4 w-4" />
            {isGenerating ? '生成中...' : '智能生成'}
          </Button>
        )}

        {/* 保存按钮 */}
        <Button
          onClick={onSave}
          disabled={isSaving || isGenerating || !selectedContent || selectedTitle !== '大纲总览'}
          variant="outline"
          title={
            isSaving
              ? '保存中...'
              : isGenerating
                ? '生成中，请等待...'
                : !selectedContent
                  ? '暂无内容可保存'
                  : selectedTitle !== '大纲总览'
                    ? '只能保存大纲总览内容'
                    : '保存大纲内容'
          }
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? '保存中...' : '保存'}
        </Button>

        {/* 编辑按钮 */}
        <Button onClick={onEdit} disabled={isGenerating}>
          <Edit className="mr-2 h-4 w-4" />
          编辑
        </Button>
      </div>
    </div>
  );
}
