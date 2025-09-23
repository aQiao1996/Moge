'use client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // 表格支持
import { useMemo } from 'react';
import { useSettings } from '@/stores/settingStore';
import { cn } from '@/lib/utils';

type Props = { md: string; className?: string };

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h; // 32 位整数
}

export default function MdViewer({ md, className = '' }: Props) {
  if (!md || md.trim() === '') return null;

  const theme = useSettings((state) => state.theme);
  const key = useMemo(() => `${md.length}-${hashCode(md.slice(0, 50))}`, [md]);

  return (
    <div
      className={cn('prose prose-slate max-w-none', theme === 'dark' && 'prose-invert', className)}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} key={key}>
        {md}
      </ReactMarkdown>
    </div>
  );
}
