'use client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // 表格支持
import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

/**
 * MdViewer组件的属性接口
 */
interface MdViewerProps {
  md: string; // 要渲染的Markdown字符串
  className?: string; // 额外的CSS类名
}

/**
 * 计算字符串的哈希码
 * @param s 输入字符串
 * @returns 32位整数哈希码
 */
function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}

/**
 * Markdown 查看器组件
 * 用于安全地渲染Markdown内容,并根据当前主题自动调整样式。
 */
export default function MdViewer({ md, className = '' }: MdViewerProps) {
  if (!md || md.trim() === '') return null;

  const { resolvedTheme } = useTheme();

  // 使用useMemo基于内容长度和内容的哈希值生成一个key
  // 这是一种优化策略,仅在Markdown内容实际变化时才重新渲染,避免不必要的计算
  const key = useMemo(() => `${md.length}-${hashCode(md.slice(0, 50))}`, [md]);

  return (
    <div
      className={cn(
        'prose prose-slate max-w-none',
        resolvedTheme === 'dark' && 'prose-invert',
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} key={key}>
        {md}
      </ReactMarkdown>
    </div>
  );
}
