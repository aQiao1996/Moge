'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type {
  OutlineWithStructure,
  OutlineVolumeWithChapters as Volume,
  OutlineChapter as Chapter,
} from '@moge/types';
import { Book, ChevronDown, ChevronRight, FileText, PanelLeft, PanelLeftClose } from 'lucide-react';

export type EditType = 'overview' | 'volume' | 'chapter';
export interface VolumeEditData {
  id: string;
  title: string;
  description: string;
}
export interface ChapterEditData {
  id: string;
  title: string;
  content: string;
}
export type EditData = string | VolumeEditData | ChapterEditData;

interface OutlineStructureSidebarProps {
  mode: 'view' | 'edit';
  outlineData: OutlineWithStructure | null;
  activeItemTitle: string;
  onSelectItem: (type: EditType, title: string, data: EditData) => void;
  expandedVolumes: Set<string>;
  onToggleVolume: (volumeId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function OutlineStructureSidebar({
  mode,
  outlineData,
  activeItemTitle,
  onSelectItem,
  expandedVolumes,
  onToggleVolume,
  isOpen,
  onToggle,
}: OutlineStructureSidebarProps) {
  if (!outlineData) {
    return (
      <Card className="overflow-y-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="bg-muted h-8 w-full rounded-md" />
          <div className="bg-muted h-8 w-full rounded-md" />
          <div className="bg-muted h-8 w-full rounded-md" />
        </div>
      </Card>
    );
  }

  const handleOverviewClick = () => {
    onSelectItem('overview', '大纲总览', outlineData.content?.content || '');
  };

  const handleChapterClick = (chapter: Chapter) => {
    const chapterData: ChapterEditData = {
      id: chapter.id || '',
      title: chapter.title || '',
      content: chapter.content?.content || '',
    };
    onSelectItem('chapter', chapter.title || '', chapterData);
  };

  const handleVolumeInfoClick = (volume: Volume) => {
    const volumeData: VolumeEditData = {
      id: volume.id || '',
      title: volume.title || '',
      description: volume.description || '',
    };
    onSelectItem('volume', `${volume.title} - 卷信息`, volumeData);
  };

  return (
    <Card
      className={cn(
        'relative overflow-hidden p-4 transition-all duration-300', // 添加 relative
        isOpen ? 'w-full lg:w-72' : 'w-full p-2 lg:w-16'
      )}
    >
      <Button
        variant="ghost"
        onClick={onToggle}
        className={cn(
          'absolute top-3 h-8 w-8 flex-shrink-0 p-0',
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
        {mode === 'edit' ? '编辑结构' : '大纲结构'}
      </h3>

      <div
        className={cn(
          'space-y-2 transition-opacity',
          isOpen
            ? 'opacity-100 delay-100 duration-200'
            : 'pointer-events-none opacity-0 duration-100'
        )}
      >
        {/* 大纲总览 */}
        <Button
          variant="ghost"
          className={cn(
            'h-auto w-full justify-start p-2 text-left',
            activeItemTitle === '大纲总览' && 'bg-accent'
          )}
          onClick={handleOverviewClick}
        >
          <Book className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="truncate">大纲总览</span>
        </Button>

        {/* 无卷的直接章节 */}
        {outlineData.chapters?.map((chapter) => (
          <Button
            key={chapter.id}
            variant="ghost"
            className={cn(
              'h-auto w-full justify-start p-2 text-left',
              activeItemTitle === chapter.title && 'bg-accent'
            )}
            onClick={() => handleChapterClick(chapter)}
          >
            <FileText className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">{chapter.title}</span>
          </Button>
        ))}

        {/* 卷和章节 */}
        {outlineData.volumes?.map((volume) => (
          <Collapsible
            key={volume.id}
            open={expandedVolumes.has(volume.id || '')}
            onOpenChange={() => onToggleVolume(volume.id || '')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="h-auto w-full justify-start p-2 text-left">
                {expandedVolumes.has(volume.id || '') ? (
                  <ChevronDown className="mr-2 h-4 w-4 flex-shrink-0" />
                ) : (
                  <ChevronRight className="mr-2 h-4 w-4 flex-shrink-0" />
                )}
                <span className="truncate font-medium">{volume.title}</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-6 space-y-1">
              {/* 卷信息编辑 (仅编辑模式) */}
              {mode === 'edit' && (
                <Button
                  variant="ghost"
                  className={cn(
                    'h-auto w-full justify-start p-2 text-left text-xs',
                    activeItemTitle === `${volume.title} - 卷信息` && 'bg-accent'
                  )}
                  onClick={() => handleVolumeInfoClick(volume)}
                >
                  <span className="text-muted-foreground truncate">📝 卷信息</span>
                </Button>
              )}

              {/* 章节列表 */}
              {volume.chapters?.map((chapter) => (
                <Button
                  key={chapter.id}
                  variant="ghost"
                  className={cn(
                    'h-auto w-full justify-start p-2 text-left',
                    activeItemTitle === chapter.title && 'bg-accent'
                  )}
                  onClick={() => handleChapterClick(chapter)}
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
