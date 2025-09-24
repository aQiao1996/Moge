'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

// 动态导入编辑器以避免 SSR 问题
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

interface MdEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  height?: number;
  preview?: 'live' | 'edit' | 'preview';
}

export default function MdEditor({
  value,
  onChange,
  placeholder = '请输入 Markdown 内容...',
  className,
  height = 400,
  preview = 'live',
}: MdEditorProps) {
  const { resolvedTheme } = useTheme();

  const colorMode: 'dark' | 'light' = resolvedTheme === 'dark' ? 'dark' : 'light';
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
