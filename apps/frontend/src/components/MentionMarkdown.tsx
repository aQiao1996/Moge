/**
 * 支持 @ 引用悬浮预览的 Markdown 渲染器
 */

'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import MentionHoverCard from '@/components/MentionHoverCard';
import { useRouter } from 'next/navigation';

interface MentionMarkdownProps {
  content: string;
  className?: string;
}

export default function MentionMarkdown({ content, className }: MentionMarkdownProps) {
  const router = useRouter();

  // 解析 moge:// 协议链接
  const parseMogeLink = (href: string) => {
    if (!href.startsWith('moge://')) return null;

    try {
      const url = new URL(href);
      const type = url.hostname;
      const id = url.pathname.replace('/', '');
      return { type, id };
    } catch {
      return null;
    }
  };

  // 跳转到设定详情页面
  const handleNavigate = (type: string, id: string) => {
    const routeMap: Record<string, string> = {
      character: '/settings/characters',
      system: '/settings/systems',
      world: '/settings/worlds',
      misc: '/settings/misc',
    };

    const basePath = routeMap[type];
    if (basePath) {
      router.push(`${basePath}/${id}`);
    }
  };

  return (
    <div className={className}>
      <ReactMarkdown
        components={{
          // 自定义链接渲染
          a: ({ href, children, ...props }) => {
            const mogeLink = href ? parseMogeLink(href) : null;

            // 如果是 moge:// 协议链接，渲染为悬浮卡片
            if (mogeLink) {
              return (
                <MentionHoverCard
                  type={mogeLink.type}
                  id={mogeLink.id}
                  onNavigate={() => handleNavigate(mogeLink.type, mogeLink.id)}
                >
                  {children}
                </MentionHoverCard>
              );
            }

            // 普通链接
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
                {...props}
              >
                {children}
              </a>
            );
          },
          // 其他 Markdown 元素的样式
          h1: ({ children }) => <h1 className="mb-4 mt-6 text-2xl font-bold">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-3 mt-5 text-xl font-semibold">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-2 mt-4 text-lg font-semibold">{children}</h3>,
          p: ({ children }) => <p className="mb-4 leading-7">{children}</p>,
          ul: ({ children }) => (
            <ul className="mb-4 list-inside list-disc space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 list-inside list-decimal space-y-1">{children}</ol>
          ),
          li: ({ children }) => <li className="ml-4">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="muted-foreground/20 text-muted-foreground mb-4 border-l-4 pl-4 italic">
              {children}
            </blockquote>
          ),
          code: ({ children, className, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !className?.includes('block');
            return isInline ? (
              <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-sm" {...props}>
                {children}
              </code>
            ) : (
              <code
                className="g-muted mb-4 block overflow-x-auto rounded-lg p-4 font-mono text-sm"
                {...props}
              >
                {children}
              </code>
            );
          },
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          hr: () => <hr className="border-border my-6 border-t" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
