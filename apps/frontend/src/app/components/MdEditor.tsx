'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

// 动态导入编辑器以避免 SSR 问题
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

/**
 * Markdown编辑器组件属性接口
 */
interface MdEditorProps {
  /** 编辑器内容 */
  value: string;
  /** 内容变化回调 */
  onChange: (value: string) => void;
  /** 占位符文本 */
  placeholder?: string;
  /** 额外的样式类名 */
  className?: string;
  /** 编辑器高度 */
  height?: number;
  /** 预览模式: live-实时预览, edit-仅编辑, preview-仅预览 */
  preview?: 'live' | 'edit' | 'preview';
}

/**
 * Markdown编辑器组件
 * 基于@uiw/react-md-editor封装的Markdown编辑器,支持实时预览和主题切换
 */
export default function MdEditor({
  value,
  onChange,
  placeholder = '请输入 Markdown 内容...',
  className,
  height = 400,
  preview = 'live',
}: MdEditorProps) {
  const { resolvedTheme } = useTheme();

  // 根据当前主题确定编辑器颜色模式
  const colorMode: 'dark' | 'light' = resolvedTheme === 'dark' ? 'dark' : 'light';

  // 使用useMemo缓存编辑器属性,避免不必要的重渲染
  const editorProps = useMemo(
    () => ({
      value,
      onChange: (val?: string) => {
        onChange(val ?? '');
      },
      placeholder,
      height,
      preview,
      'data-color-mode': colorMode,
    }),
    [value, onChange, placeholder, height, preview, resolvedTheme]
  );

  return (
    <div
      className={cn(
        'border-input bg-background w-full rounded-md border',
        '[&_.w-md-editor]:border-0 [&_.w-md-editor]:bg-transparent',
        '[&_.w-md-editor-toolbar]:!bg-muted/50 [&_.w-md-editor-toolbar]:!border-border',
        className
      )}
    >
      <MDEditor {...editorProps} />
    </div>
  );
}
