'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { BookText, FileText, Folder, Link2 } from 'lucide-react';
import { getProjects, type Project } from '@/api/projects.api';
import { getOutlinesApi } from '@/api/outline.api';
import { getManuscripts } from '@/app/(main)/manuscripts/api/client';
import type { Outline } from '@moge/types';
import type { Manuscript } from '@moge/types';

interface RelatedItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settingId: number;
  settingName: string;
  category: 'characters' | 'systems' | 'worlds' | 'misc';
}

interface RelatedItem {
  id: number;
  name: string;
  type: 'project' | 'outline' | 'manuscript';
  description?: string;
  tags?: string[];
  createdAt: string;
}

/**
 * 关联项目弹框组件
 * 显示某个设定关联的所有项目、大纲和文稿
 */
export default function RelatedItemsDialog({
  open,
  onOpenChange,
  settingId,
  settingName,
  category,
}: RelatedItemsDialogProps) {
  const [relatedItems, setRelatedItems] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载关联的项目、大纲和文稿
  useEffect(() => {
    if (!open) return;

    const loadRelatedItems = async () => {
      setLoading(true);
      try {
        const items: RelatedItem[] = [];
        const settingIdStr = String(settingId);

        // 获取所有项目
        const projects = await getProjects();
        const relatedProjects = projects.filter((project: Project) =>
          project[category]?.includes(settingIdStr)
        );
        items.push(
          ...relatedProjects.map((p: Project) => ({
            id: p.id,
            name: p.name,
            type: 'project' as const,
            description: p.description || undefined,
            tags: p.tags,
            createdAt: p.createdAt,
          }))
        );

        // 获取所有大纲
        const outlinesRes = await getOutlinesApi({ pageNum: 1, pageSize: 1000 });
        const relatedOutlines = outlinesRes.list.filter((outline: Outline) =>
          outline[category]?.includes(settingIdStr)
        );
        items.push(
          ...relatedOutlines.map((o: Outline) => ({
            id: Number(o.id),
            name: o.name!,
            type: 'outline' as const,
            description: o.remark || undefined,
            tags: o.tags,
            createdAt: String(o.createdAt),
          }))
        );

        // 获取所有文稿
        const manuscriptsRes = await getManuscripts();
        const relatedManuscripts = manuscriptsRes.data.filter((manuscript: Manuscript) =>
          manuscript[category]?.includes(settingIdStr)
        );
        items.push(
          ...relatedManuscripts.map((m: Manuscript) => ({
            id: m.id!,
            name: m.name!,
            type: 'manuscript' as const,
            description: m.description || undefined,
            tags: m.tags!,
            createdAt: m.createdAt!,
          }))
        );

        setRelatedItems(items);
      } catch (error) {
        console.error('加载关联项目失败:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadRelatedItems();
  }, [open, settingId, category]);

  // 获取类型图标和标签
  const getTypeInfo = (type: RelatedItem['type']) => {
    switch (type) {
      case 'project':
        return { icon: Folder, label: '项目', color: 'text-blue-500' };
      case 'outline':
        return { icon: BookText, label: '大纲', color: 'text-green-500' };
      case 'manuscript':
        return { icon: FileText, label: '文稿', color: 'text-purple-500' };
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            关联项目 - {settingName}
          </DialogTitle>
          <DialogDescription>查看使用了该设定的所有项目、大纲和文稿</DialogDescription>
        </DialogHeader>

        <div className="max-h-[500px] space-y-3 overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-[var(--moge-text-sub)]">加载中...</div>
          ) : relatedItems.length === 0 ? (
            <div className="py-12 text-center">
              <Link2 className="mx-auto h-12 w-12 text-[var(--moge-text-muted)]" />
              <p className="mt-4 text-[var(--moge-text-sub)]">暂无关联项目</p>
              <p className="mt-2 text-sm text-[var(--moge-text-muted)]">
                该设定尚未被任何项目、大纲或文稿使用
              </p>
            </div>
          ) : (
            relatedItems.map((item) => {
              const typeInfo = getTypeInfo(item.type);
              const Icon = typeInfo.icon;

              return (
                <Card
                  key={`${item.type}-${item.id}`}
                  className="border p-4"
                  style={{
                    backgroundColor: 'var(--moge-card-bg)',
                    borderColor: 'var(--moge-card-border)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`mt-1 h-5 w-5 ${typeInfo.color}`} />
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <h4 className="font-medium text-[var(--moge-text-main)]">{item.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {typeInfo.label}
                        </Badge>
                      </div>
                      {item.description && (
                        <p className="mb-2 line-clamp-2 text-sm text-[var(--moge-text-sub)]">
                          {item.description}
                        </p>
                      )}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {!loading && relatedItems.length > 0 && (
          <div className="border-t pt-3 text-center text-sm text-[var(--moge-text-muted)]">
            共找到 {relatedItems.length} 个关联项
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
