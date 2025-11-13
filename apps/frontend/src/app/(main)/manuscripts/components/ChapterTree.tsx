/**
 * 文稿卷章树形展示组件
 *
 * 功能:
 * - 展示文稿的卷章树形结构
 * - 支持展开/折叠卷
 * - 支持点击章节跳转到编辑页
 * - 支持创建/删除卷和章节
 * - 支持拖拽排序卷和章节
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { Manuscript } from '@moge/types';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Plus,
  Trash2,
  Folder,
  Edit2,
  GripVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CreateItemDialog from '../../outline/components/CreateItemDialog';
import DeleteConfirmDialog from '../../outline/components/DeleteConfirmDialog';
import EditVolumeDialog from './EditVolumeDialog';
import EditChapterDialog from './EditChapterDialog';
import {
  createVolume,
  createChapter,
  deleteVolume,
  deleteChapter,
  updateVolume,
  updateChapter,
  reorderVolumes,
  reorderChapters,
} from '../api/client';

/**
 * 可排序的卷组件
 */
interface SortableVolumeProps {
  volume: {
    id?: number | string;
    title?: string;
    description?: string | null;
    chapters?: Array<{
      id?: number | string;
      title?: string;
      wordCount?: number;
    }>;
  };
  isExpanded: boolean;
  onToggle: () => void;
  onEditVolume: (id: string, title: string, description?: string) => void;
  onDeleteVolume: (id: string, title: string) => void;
  onCreateChapter: (volumeId: string) => void;
  onChapterClick: (chapterId: string) => void;
  onEditChapter: (chapterId: string, title: string) => void;
  onDeleteChapter: (chapterId: string, title: string) => void;
  onChapterDragEnd: (event: DragEndEvent) => void;
}

function SortableVolume({
  volume,
  isExpanded,
  onToggle,
  onEditVolume,
  onDeleteVolume,
  onCreateChapter,
  onChapterClick,
  onEditChapter,
  onDeleteChapter,
  onChapterDragEnd,
}: SortableVolumeProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: volume.id?.toString() || '',
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const chapters = volume.chapters || [];
  const chapterIds = chapters.map((c) => c.id?.toString() || '').filter(Boolean);

  return (
    <div ref={setNodeRef} style={style}>
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <div className="flex items-center gap-1">
          {/* 拖拽手柄 */}
          <button
            className="text-muted-foreground hover:text-foreground cursor-grab p-1 active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="h-auto flex-1 justify-start p-2 text-left">
              {isExpanded ? (
                <ChevronDown className="mr-2 h-4 w-4 flex-shrink-0" />
              ) : (
                <ChevronRight className="mr-2 h-4 w-4 flex-shrink-0" />
              )}
              <Folder className="mr-2 h-4 w-4 flex-shrink-0 text-[var(--moge-accent)]" />
              <span className="truncate font-medium">{volume.title}</span>
              <span className="text-muted-foreground ml-auto text-xs">{chapters.length} 章</span>
            </Button>
          </CollapsibleTrigger>

          {/* 编辑卷按钮 */}
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onEditVolume(
                volume.id?.toString() || '',
                volume.title || '',
                volume.description || ''
              );
            }}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>

          {/* 删除卷按钮 */}
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteVolume(volume.id?.toString() || '', volume.title || '');
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        <CollapsibleContent className="ml-6 space-y-1">
          {/* 章节列表 - 使用拖拽排序 */}
          <DndContext
            sensors={useSensors(
              useSensor(PointerSensor),
              useSensor(KeyboardSensor, {
                coordinateGetter: sortableKeyboardCoordinates,
              })
            )}
            collisionDetection={closestCenter}
            onDragEnd={onChapterDragEnd}
          >
            <SortableContext items={chapterIds} strategy={verticalListSortingStrategy}>
              {chapters.map((chapter) => (
                <SortableChapter
                  key={chapter.id}
                  chapter={chapter}
                  onChapterClick={onChapterClick}
                  onEditChapter={onEditChapter}
                  onDeleteChapter={onDeleteChapter}
                />
              ))}
            </SortableContext>
          </DndContext>

          {/* 在卷内新建章节按钮 */}
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-7 w-full justify-start gap-2 text-xs"
            onClick={() => onCreateChapter(volume.id?.toString() || '')}
          >
            <Plus className="h-3 w-3" />
            添加章节
          </Button>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

/**
 * 可排序的章节组件
 */
interface SortableChapterProps {
  chapter: {
    id?: number | string;
    title?: string;
    wordCount?: number;
  };
  onChapterClick: (chapterId: string) => void;
  onEditChapter: (chapterId: string, title: string) => void;
  onDeleteChapter: (chapterId: string, title: string) => void;
}

function SortableChapter({
  chapter,
  onChapterClick,
  onEditChapter,
  onDeleteChapter,
}: SortableChapterProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: chapter.id?.toString() || '',
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1">
      {/* 拖拽手柄 */}
      <button
        className="text-muted-foreground hover:text-foreground cursor-grab p-1 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <Button
        variant="ghost"
        className="h-auto flex-1 justify-start p-2 text-left"
        onClick={() => onChapterClick(chapter.id?.toString() || '')}
      >
        <FileText className="mr-2 h-4 w-4 flex-shrink-0" />
        <span className="truncate">{chapter.title}</span>
        <span className="text-muted-foreground ml-auto text-xs">{chapter.wordCount || 0} 字</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-primary h-8 w-8 p-0"
        onClick={(e) => {
          e.stopPropagation();
          onEditChapter(chapter.id?.toString() || '', chapter.title || '');
        }}
      >
        <Edit2 className="h-3.5 w-3.5" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
        onClick={(e) => {
          e.stopPropagation();
          onDeleteChapter(chapter.id?.toString() || '', chapter.title || '');
        }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

interface ChapterTreeProps {
  manuscript: Manuscript;
  onRefresh?: () => void;
}

export default function ChapterTree({ manuscript, onRefresh }: ChapterTreeProps) {
  const router = useRouter();
  const [expandedVolumes, setExpandedVolumes] = useState<Set<string>>(new Set());

  // 拖拽传感器配置
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Dialog 状态管理
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<'volume' | 'chapter'>('volume');
  const [currentVolumeId, setCurrentVolumeId] = useState<number | null>(null);

  // 删除确认对话框状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'volume' | 'chapter'>('volume');
  const [deleteItemId, setDeleteItemId] = useState<number>(0);
  const [deleteItemTitle, setDeleteItemTitle] = useState<string>('');

  // 编辑对话框状态
  const [editVolumeDialogOpen, setEditVolumeDialogOpen] = useState(false);
  const [editVolumeId, setEditVolumeId] = useState<number>(0);
  const [editVolumeTitle, setEditVolumeTitle] = useState<string>('');
  const [editVolumeDescription, setEditVolumeDescription] = useState<string>('');

  const [editChapterDialogOpen, setEditChapterDialogOpen] = useState(false);
  const [editChapterId, setEditChapterId] = useState<number>(0);
  const [editChapterTitle, setEditChapterTitle] = useState<string>('');

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

  /**
   * 处理章节点击
   */
  const handleChapterClick = (chapterId: string) => {
    router.push(`/manuscripts/${manuscript.id}/edit?chapter=${chapterId}`);
  };

  /**
   * 打开创建卷的 Dialog
   */
  const handleCreateVolume = () => {
    setCreateType('volume');
    setCurrentVolumeId(null);
    setCreateDialogOpen(true);
  };

  /**
   * 打开创建章节的 Dialog
   */
  const handleCreateChapter = (volumeId?: string) => {
    setCreateType('chapter');
    setCurrentVolumeId(volumeId ? Number(volumeId) : null);
    setCreateDialogOpen(true);
  };

  /**
   * 打开编辑卷的对话框
   */
  const handleEditVolume = (volumeId: string, volumeTitle: string, volumeDescription?: string) => {
    setEditVolumeId(Number(volumeId));
    setEditVolumeTitle(volumeTitle);
    setEditVolumeDescription(volumeDescription || '');
    setEditVolumeDialogOpen(true);
  };

  /**
   * 打开编辑章节的对话框
   */
  const handleEditChapter = (chapterId: string, chapterTitle: string) => {
    setEditChapterId(Number(chapterId));
    setEditChapterTitle(chapterTitle);
    setEditChapterDialogOpen(true);
  };

  /**
   * 确认编辑卷
   */
  const handleConfirmEditVolume = async (data: { title: string; description?: string }) => {
    try {
      await updateVolume(editVolumeId, data);
      toast.success('卷更新成功');

      // 刷新数据
      if (onRefresh) {
        void onRefresh();
      }
    } catch (error) {
      console.error('更新卷失败:', error);
      toast.error('更新失败,请重试');
      throw error;
    }
  };

  /**
   * 确认编辑章节
   */
  const handleConfirmEditChapter = async (data: { title: string }) => {
    try {
      await updateChapter(editChapterId, data);
      toast.success('章节更新成功');

      // 刷新数据
      if (onRefresh) {
        void onRefresh();
      }
    } catch (error) {
      console.error('更新章节失败:', error);
      toast.error('更新失败,请重试');
      throw error;
    }
  };
  const handleDeleteVolume = (volumeId: string, volumeTitle: string) => {
    setDeleteType('volume');
    setDeleteItemId(Number(volumeId));
    setDeleteItemTitle(volumeTitle);
    setDeleteDialogOpen(true);
  };

  /**
   * 打开删除章节的确认对话框
   */
  const handleDeleteChapter = (chapterId: string, chapterTitle: string) => {
    setDeleteType('chapter');
    setDeleteItemId(Number(chapterId));
    setDeleteItemTitle(chapterTitle);
    setDeleteDialogOpen(true);
  };

  /**
   * 执行删除操作
   */
  const handleConfirmDelete = async () => {
    try {
      if (deleteType === 'volume') {
        await deleteVolume(deleteItemId);
        toast.success('卷删除成功');
      } else {
        await deleteChapter(deleteItemId);
        toast.success('章节删除成功');
      }

      // 刷新数据
      if (onRefresh) {
        void onRefresh();
      }
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('删除失败,请重试');
      throw error;
    }
  };

  /**
   * 处理确认创建
   */
  const handleConfirmCreate = async (data: { title: string; description?: string }) => {
    if (!manuscript.id) return;

    try {
      let newVolumeId: number | null = null;

      if (createType === 'volume') {
        const response = await createVolume({
          manuscriptId: manuscript.id,
          title: data.title,
          description: data.description,
        });
        newVolumeId = response.data.id || null;
        toast.success('卷创建成功');
      } else {
        await createChapter({
          manuscriptId: manuscript.id,
          volumeId: currentVolumeId || undefined,
          title: data.title,
        });
        toast.success('章节创建成功');
      }

      // 刷新数据
      if (onRefresh) {
        void onRefresh();
      }

      // 如果创建的是卷,自动展开新建的卷
      if (newVolumeId) {
        toggleVolume(newVolumeId.toString());
      }
    } catch (error) {
      console.error('创建失败:', error);
      toast.error('创建失败,请重试');
      throw error;
    }
  };

  /**
   * 处理卷拖拽结束
   */
  const handleVolumeDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const volumes = manuscript.volumes || [];
    const oldIndex = volumes.findIndex((v) => v.id?.toString() === active.id);
    const newIndex = volumes.findIndex((v) => v.id?.toString() === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // 本地更新顺序（乐观更新）
    const newVolumes = arrayMove(volumes, oldIndex, newIndex);
    const volumeIds = newVolumes.map((v) => v.id).filter((id): id is number => id !== undefined);

    try {
      // 调用后端 API 更新排序
      await reorderVolumes(volumeIds);
      toast.success('卷排序更新成功');

      // 刷新数据
      if (onRefresh) {
        void onRefresh();
      }
    } catch (error) {
      console.error('更新卷排序失败:', error);
      toast.error('排序失败，请重试');
      // 失败时也刷新数据以恢复原状
      if (onRefresh) {
        void onRefresh();
      }
    }
  };

  /**
   * 处理章节拖拽结束（卷内章节或无卷章节）
   */
  const handleChapterDragEnd = async (event: DragEndEvent, volumeId?: number) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    // 获取对应的章节列表
    const chapters = volumeId
      ? manuscript.volumes?.find((v) => v.id === volumeId)?.chapters || []
      : manuscript.chapters || [];

    const oldIndex = chapters.findIndex((c) => c.id?.toString() === active.id);
    const newIndex = chapters.findIndex((c) => c.id?.toString() === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // 本地更新顺序（乐观更新）
    const newChapters = arrayMove(chapters, oldIndex, newIndex);
    const chapterIds = newChapters.map((c) => c.id).filter((id): id is number => id !== undefined);

    try {
      // 调用后端 API 更新排序
      await reorderChapters(chapterIds);
      toast.success('章节排序更新成功');

      // 刷新数据
      if (onRefresh) {
        void onRefresh();
      }
    } catch (error) {
      console.error('更新章节排序失败:', error);
      toast.error('排序失败，请重试');
      // 失败时也刷新数据以恢复原状
      if (onRefresh) {
        void onRefresh();
      }
    }
  };

  const volumes = manuscript.volumes || [];
  const chapters = manuscript.chapters || [];
  const volumeIds = volumes.map((v) => v.id?.toString() || '').filter(Boolean);
  const chapterIds = chapters.map((c) => c.id?.toString() || '').filter(Boolean);

  return (
    <>
      <div className="space-y-2">
        {/* 新建卷按钮 */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-full justify-start gap-2 text-xs"
          onClick={handleCreateVolume}
        >
          <Plus className="h-3 w-3" />
          新建卷
        </Button>

        {/* 无卷的直接章节 - 使用拖拽排序 */}
        {chapters.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => {
              void handleChapterDragEnd(event);
            }}
          >
            <SortableContext items={chapterIds} strategy={verticalListSortingStrategy}>
              {chapters.map((chapter) => (
                <SortableChapter
                  key={chapter.id}
                  chapter={chapter}
                  onChapterClick={handleChapterClick}
                  onEditChapter={handleEditChapter}
                  onDeleteChapter={handleDeleteChapter}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}

        {/* 新建直接章节按钮 (无卷) */}
        {chapters.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-full justify-start gap-2 text-xs"
            onClick={() => handleCreateChapter()}
          >
            <Plus className="h-3 w-3" />
            新建章节
          </Button>
        )}

        {/* 卷列表 - 使用拖拽排序 */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => {
            void handleVolumeDragEnd(event);
          }}
        >
          <SortableContext items={volumeIds} strategy={verticalListSortingStrategy}>
            {volumes.map((volume) => (
              <SortableVolume
                key={volume.id}
                volume={volume}
                isExpanded={expandedVolumes.has(volume.id?.toString() || '')}
                onToggle={() => toggleVolume(volume.id?.toString() || '')}
                onEditVolume={handleEditVolume}
                onDeleteVolume={handleDeleteVolume}
                onCreateChapter={handleCreateChapter}
                onChapterClick={handleChapterClick}
                onEditChapter={handleEditChapter}
                onDeleteChapter={handleDeleteChapter}
                onChapterDragEnd={(event) => {
                  void handleChapterDragEnd(event, volume.id as number);
                }}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* 创建 Dialog */}
      <CreateItemDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        type={createType}
        onConfirm={handleConfirmCreate}
        volumeCount={volumes.length}
        chapterCount={
          currentVolumeId
            ? volumes.find((v) => v.id === currentVolumeId)?.chapters?.length || 0
            : chapters.length
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

      {/* 编辑卷 Dialog */}
      <EditVolumeDialog
        open={editVolumeDialogOpen}
        onOpenChange={setEditVolumeDialogOpen}
        volumeTitle={editVolumeTitle}
        volumeDescription={editVolumeDescription}
        onConfirm={handleConfirmEditVolume}
      />

      {/* 编辑章节 Dialog */}
      <EditChapterDialog
        open={editChapterDialogOpen}
        onOpenChange={setEditChapterDialogOpen}
        chapterTitle={editChapterTitle}
        onConfirm={handleConfirmEditChapter}
      />
    </>
  );
}
