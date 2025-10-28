'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type {
  OutlineWithStructure,
  OutlineVolumeWithChapters as Volume,
  OutlineChapter as Chapter,
} from '@moge/types';
import {
  Book,
  ChevronDown,
  ChevronRight,
  FileText,
  PanelLeft,
  PanelLeftClose,
  Plus,
  Trash2,
} from 'lucide-react';
import CreateItemDialog from './CreateItemDialog';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import {
  createVolume,
  createChapter,
  createChapterInVolume,
  deleteVolume,
  deleteChapter,
} from '../api/structure';
import { toast } from 'sonner';

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
  onRefresh?: () => void; // 刷新数据的回调
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
  onRefresh,
}: OutlineStructureSidebarProps) {
  // Dialog 状态管理
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<'volume' | 'chapter'>('volume');
  const [currentVolumeId, setCurrentVolumeId] = useState<string | null>(null);

  // 删除确认对话框状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'volume' | 'chapter'>('volume');
  const [deleteItemId, setDeleteItemId] = useState<string>('');
  const [deleteItemTitle, setDeleteItemTitle] = useState<string>('');

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

  // 打开创建卷的 Dialog
  const handleCreateVolume = () => {
    setCreateType('volume');
    setCurrentVolumeId(null);
    setCreateDialogOpen(true);
  };

  // 打开创建直接章节的 Dialog
  const handleCreateDirectChapter = () => {
    setCreateType('chapter');
    setCurrentVolumeId(null);
    setCreateDialogOpen(true);
  };

  // 打开创建卷内章节的 Dialog
  const handleCreateChapterInVolume = (volumeId: string) => {
    setCreateType('chapter');
    setCurrentVolumeId(volumeId);
    setCreateDialogOpen(true);
  };

  // 打开删除卷的确认对话框
  const handleDeleteVolume = (volumeId: string, volumeTitle: string) => {
    setDeleteType('volume');
    setDeleteItemId(volumeId);
    setDeleteItemTitle(volumeTitle);
    setDeleteDialogOpen(true);
  };

  // 打开删除章节的确认对话框
  const handleDeleteChapter = (chapterId: string, chapterTitle: string) => {
    setDeleteType('chapter');
    setDeleteItemId(chapterId);
    setDeleteItemTitle(chapterTitle);
    setDeleteDialogOpen(true);
  };

  // 执行删除操作
  const handleConfirmDelete = async () => {
    if (!outlineData?.id) return;

    try {
      if (deleteType === 'volume') {
        await deleteVolume(outlineData.id, deleteItemId);
        toast.success('卷删除成功');
      } else {
        await deleteChapter(outlineData.id, deleteItemId);
        toast.success('章节删除成功');
      }

      // 刷新数据
      if (onRefresh) {
        void onRefresh();
      }
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('删除失败，请重试');
      throw error;
    }
  };

  // 处理确认创建
  const handleConfirmCreate = async (data: { title: string; description?: string }) => {
    if (!outlineData?.id) return;

    try {
      let newVolumeId: string | null = null;

      if (createType === 'volume') {
        const response = await createVolume(outlineData.id, data);
        // 从响应中获取新创建的卷 ID
        newVolumeId = (response.data as { id: string }).id;
        toast.success('卷创建成功');
      } else {
        if (currentVolumeId) {
          await createChapterInVolume(outlineData.id, currentVolumeId, { title: data.title });
          toast.success('章节创建成功');
        } else {
          await createChapter(outlineData.id, { title: data.title });
          toast.success('章节创建成功');
        }
      }

      // 刷新数据
      if (onRefresh) {
        void onRefresh();
      }

      // 如果创建的是卷，自动展开新建的卷
      if (newVolumeId) {
        onToggleVolume(newVolumeId);
      }
    } catch (error) {
      console.error('创建失败:', error);
      toast.error('创建失败，请重试');
      throw error;
    }
  };

  return (
    <>
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
          {mode === 'edit' ? '编辑结构' : '大纲结构'}
        </h3>

        <div
          className={cn(
            'flex-1 space-y-2 overflow-y-auto transition-opacity',
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

          {/* 新建卷按钮 */}
          {mode === 'edit' && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-full justify-start gap-2 text-xs"
              onClick={handleCreateVolume}
            >
              <Plus className="h-3 w-3" />
              新建卷
            </Button>
          )}

          {/* 无卷的直接章节 */}
          {outlineData.chapters?.map((chapter) => (
            <div key={chapter.id} className="flex items-center gap-1">
              <Button
                variant="ghost"
                className={cn(
                  'h-auto flex-1 justify-start p-2 text-left',
                  activeItemTitle === chapter.title && 'bg-accent'
                )}
                onClick={() => handleChapterClick(chapter)}
              >
                <FileText className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">{chapter.title}</span>
              </Button>
              {mode === 'edit' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChapter(chapter.id || '', chapter.title || '');
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}

          {/* 新建直接章节按钮 (无卷) */}
          {mode === 'edit' && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-full justify-start gap-2 text-xs"
              onClick={handleCreateDirectChapter}
            >
              <Plus className="h-3 w-3" />
              新建章节
            </Button>
          )}

          {/* 卷和章节 */}
          {outlineData.volumes?.map((volume) => (
            <Collapsible
              key={volume.id}
              open={expandedVolumes.has(volume.id || '')}
              onOpenChange={() => onToggleVolume(volume.id || '')}
            >
              <div className="flex items-center gap-1">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="h-auto flex-1 justify-start p-2 text-left">
                    {expandedVolumes.has(volume.id || '') ? (
                      <ChevronDown className="mr-2 h-4 w-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="mr-2 h-4 w-4 flex-shrink-0" />
                    )}
                    <span className="truncate font-medium">{volume.title}</span>
                  </Button>
                </CollapsibleTrigger>
                {/* 删除卷按钮 */}
                {mode === 'edit' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteVolume(volume.id || '', volume.title || '');
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
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
                  <div key={chapter.id} className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      className={cn(
                        'h-auto flex-1 justify-start p-2 text-left',
                        activeItemTitle === chapter.title && 'bg-accent'
                      )}
                      onClick={() => handleChapterClick(chapter)}
                    >
                      <FileText className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{chapter.title}</span>
                    </Button>
                    {mode === 'edit' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChapter(chapter.id || '', chapter.title || '');
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}

                {/* 在卷内新建章节按钮 */}
                {mode === 'edit' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground h-7 w-full justify-start gap-2 text-xs"
                    onClick={() => handleCreateChapterInVolume(volume.id || '')}
                  >
                    <Plus className="h-3 w-3" />
                    添加章节
                  </Button>
                )}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </Card>

      {/* 创建 Dialog */}
      <CreateItemDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        type={createType}
        onConfirm={handleConfirmCreate}
        volumeCount={outlineData.volumes?.length || 0}
        chapterCount={
          currentVolumeId
            ? outlineData.volumes?.find((v) => v.id === currentVolumeId)?.chapters?.length || 0
            : outlineData.chapters?.length || 0
        }
      />

      {/* 删除确认 Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        type={deleteType}
        title={deleteItemTitle}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
