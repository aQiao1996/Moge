/**
 * @ 引用悬浮预览卡片组件
 * 用于在 Markdown 内容中悬停在 @引用链接上时显示设定详情
 */

'use client';

import React, { useState, useEffect } from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { getSettingDetail } from '@/api/search.api';
import { Loader2 } from 'lucide-react';

interface MentionHoverCardProps {
  type: string;
  id: string;
  children: React.ReactNode;
  onNavigate?: () => void;
}

interface SettingDetail {
  id: number;
  name: string;
  description?: string;
  background?: string;
  tags?: string[];
  type: string;
}

export default function MentionHoverCard({
  type,
  id,
  children,
  onNavigate,
}: MentionHoverCardProps) {
  const [detail, setDetail] = useState<SettingDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getSettingDetail(type, parseInt(id));
        if (isMounted) {
          setDetail(data as SettingDetail);
        }
      } catch (err) {
        if (isMounted) {
          setError('加载失败');
          console.error('Failed to fetch setting detail:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchDetail();

    return () => {
      isMounted = false;
    };
  }, [type, id]);

  const getTypeLabel = (settingType: string) => {
    const labels: Record<string, string> = {
      character: '角色设定',
      system: '系统设定',
      world: '世界设定',
      misc: '辅助设定',
    };
    return labels[settingType] || '设定';
  };

  return (
    <HoverCard openDelay={300}>
      <HoverCardTrigger asChild>
        <span
          className="text-primary inline-flex cursor-pointer items-center hover:underline"
          onClick={onNavigate}
        >
          {children}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-80" side="top">
        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
            <span className="text-muted-foreground ml-2 text-sm">加载中...</span>
          </div>
        )}

        {error && <div className="text-muted-foreground py-4 text-center text-sm">{error}</div>}

        {!loading && !error && detail && (
          <div className="space-y-3">
            {/* 标题和类型标签 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">{detail.name}</h4>
                <span className="muted-foreground bg-muted rounded-full px-2 py-0.5 text-xs">
                  {getTypeLabel(detail.type)}
                </span>
              </div>
            </div>

            {/* 描述/背景 */}
            {(detail.description || detail.background) && (
              <div className="muted-foreground text-sm">
                <p className="line-clamp-4">{detail.background || detail.description}</p>
              </div>
            )}

            {/* 标签 */}
            {detail.tags && detail.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {detail.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="bg-secondary text-secondary-foreground rounded-md px-2 py-0.5 text-xs"
                  >
                    {tag}
                  </span>
                ))}
                {detail.tags.length > 3 && (
                  <span className="muted-foreground text-xs">+{detail.tags.length - 3}</span>
                )}
              </div>
            )}

            {/* 点击跳转提示 */}
            <div className="muted-foreground border-t pt-2 text-xs">点击查看完整详情</div>
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
