'use client';

import dynamic from 'next/dynamic';
import { useMemo, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

// 动态导入编辑器以避免 SSR 问题
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

/**
 * Markdown编辑器组件属性接口
 */
interface MdEditorProps {
  value: string; // 编辑器内容
  onChange: (value: string) => void; // 内容变化回调
  placeholder?: string; // 占位符文本
  className?: string; // 额外的样式类名
  height?: number; // 编辑器高度
  preview?: 'live' | 'edit' | 'preview'; // 预览模式: live-实时预览, edit-仅编辑, preview-仅预览
  onTextSelect?: (selectedText: string) => void; // 文本选择回调
}

/**
 * 编辑器实例方法接口
 */
export interface MdEditorRef {
  getSelectedText: () => string;
}

/**
 * Markdown编辑器组件
 * 基于@uiw/react-md-editor封装的Markdown编辑器,支持实时预览和主题切换
 */
const MdEditor = forwardRef<MdEditorRef, MdEditorProps>(
  (
    {
      value,
      onChange,
      placeholder = '请输入 Markdown 内容...',
      className,
      height = 400,
      preview = 'live',
      onTextSelect,
    },
    ref
  ) => {
    const { resolvedTheme } = useTheme();
    const containerRef = useRef<HTMLDivElement>(null);
    const selectedTextRef = useRef<string>('');

    // 根据当前主题确定编辑器颜色模式
    const colorMode: 'dark' | 'light' = resolvedTheme === 'dark' ? 'dark' : 'light';

    // 暴露实例方法
    useImperativeHandle(ref, () => ({
      getSelectedText: () => selectedTextRef.current,
    }));

    // 监听文本选择事件
    useEffect(() => {
      const handleSelectionChange = () => {
        if (!containerRef.current) return;

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const selectedText = selection.toString().trim();

        // 检查选择是否在编辑器内
        const range = selection.getRangeAt(0);
        const container = containerRef.current;

        if (container.contains(range.commonAncestorContainer)) {
          selectedTextRef.current = selectedText;
          if (onTextSelect && selectedText) {
            onTextSelect(selectedText);
          }
        }
      };

      // 监听鼠标释放事件（拖拽选择完成）
      const handleMouseUp = () => {
        setTimeout(handleSelectionChange, 10);
      };

      // 监听键盘事件（Shift+方向键选择）
      const handleKeyUp = (e: KeyboardEvent) => {
        if (e.shiftKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
          setTimeout(handleSelectionChange, 10);
        }
      };

      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('keyup', handleKeyUp);

      return () => {
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('keyup', handleKeyUp);
      };
    }, [onTextSelect]);

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
      [value, onChange, placeholder, height, preview, colorMode]
    );

    return (
      <div
        ref={containerRef}
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
);

MdEditor.displayName = 'MdEditor';

export default MdEditor;
