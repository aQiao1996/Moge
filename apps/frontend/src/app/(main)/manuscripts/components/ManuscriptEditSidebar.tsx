/**
 * 文稿编辑侧边栏组件
 *
 * 功能:
 * - 展示卷章树形结构
 * - 支持点击切换章节
 * - 高亮当前编辑的章节
 * - 支持展开/折叠
 */
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { Manuscript } from '@moge/types';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  PanelLeft,
  PanelLeftClose,
} from 'lucide-react';

interface ManuscriptEditSidebarProps {
  manuscript: Manuscript;
  currentChapterId: string | null;
  onSelectChapter: (chapterId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function ManuscriptEditSidebar({
  manuscript,
  currentChapterId,
  onSelectChapter,
  isOpen,
  onToggle,
}: ManuscriptEditSidebarProps) {
  const [expandedVolumes, setExpandedVolumes] = useState<Set<string>>(new Set());

  /**
   * 切换卷的展开/折叠状态
   */
  const toggleVolume = (volumeId: string) => {
    const newExpanded = new Set(expandedVolumes);
    if (newExpanded.has(volumeId)) {
      newExpanded.delete(volumeId);
    } else {
      newExpanded.add(volumeId);
    }
    setExpandedVolumes(newExpanded);
  };

  const volumes = manuscript.volumes || [];
  const chapters = manuscript.chapters || [];

  return (
    <Card
      className={cn(
        'relative flex flex-col overflow-hidden p-4 transition-all duration-300',
        isOpen ? 'w-full lg:w-72' : 'w-full p-2 lg:w-16'
      )}
    >
      <Button
        variant="ghost"
        onClick={onToggle}
        className={cn(
          'absolute top-3 z-10 h-8 w-8 flex-shrink-0 p-0',
          isOpen ? 'right-2' : 'right-1/2 translate-x-1/2 transform'
        )}
      >
        {isOpen ? <PanelLeftClose className="!h-5 !w-5" /> : <PanelLeft className="!h-5 !w-5" />}
      </Button>

      <h3
        className={cn(
          'pb-4 font-semibold transition-opacity duration-200',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        章节导航
      </h3>

      <div
        className={cn(
          'flex-1 space-y-2 overflow-y-auto transition-opacity',
          isOpen
            ? 'opacity-100 delay-100 duration-200'
            : 'pointer-events-none opacity-0 duration-100'
        )}
      >
        {/* 无卷的直接章节 */}
        {chapters.map((chapter) => (
          <Button
            key={chapter.id}
            variant="ghost"
            className={cn(
              'h-auto w-full justify-start p-2 text-left',
              currentChapterId === chapter.id?.toString() && 'bg-accent'
            )}
            onClick={() => onSelectChapter(chapter.id?.toString() || '')}
          >
            <FileText className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">{chapter.title}</span>
          </Button>
        ))}

        {/* 卷和章节 */}
        {volumes.map((volume) => (
          <Collapsible
            key={volume.id}
            open={expandedVolumes.has(volume.id?.toString() || '')}
            onOpenChange={() => toggleVolume(volume.id?.toString() || '')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="h-auto w-full justify-start p-2 text-left">
                {expandedVolumes.has(volume.id?.toString() || '') ? (
                  <ChevronDown className="mr-2 h-4 w-4 flex-shrink-0" />
                ) : (
                  <ChevronRight className="mr-2 h-4 w-4 flex-shrink-0" />
                )}
                <Folder className="mr-2 h-4 w-4 flex-shrink-0 text-[var(--moge-accent)]" />
                <span className="truncate font-medium">{volume.title}</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-6 space-y-1">
              {/* 章节列表 */}
              {volume.chapters?.map((chapter) => (
                <Button
                  key={chapter.id}
                  variant="ghost"
                  className={cn(
                    'h-auto w-full justify-start p-2 text-left',
                    currentChapterId === chapter.id?.toString() && 'bg-accent'
                  )}
                  onClick={() => onSelectChapter(chapter.id?.toString() || '')}
                >
                  <FileText className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{chapter.title}</span>
                </Button>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </Card>
  );
}
