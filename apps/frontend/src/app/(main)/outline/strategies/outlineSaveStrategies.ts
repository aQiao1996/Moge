/**
 * 大纲编辑保存策略
 *
 * 功能：
 * - 定义不同编辑类型的保存策略
 * - 统一保存接口
 * - 支持本地数据更新
 *
 * 使用策略模式，将不同编辑类型的保存逻辑解耦
 */
import { toast } from 'sonner';
import {
  updateOutlineContentApi,
  updateOutlineApi,
  updateVolumeApi,
  updateChapterApi,
} from '@/api/outline.api';
import type { OutlineWithStructure } from '@moge/types';

// 编辑类型
export type EditType = 'overview' | 'volume' | 'chapter';

// 卷编辑数据
export interface VolumeEditData {
  id: string;
  title: string;
  description: string;
}

// 章节编辑数据
export interface ChapterEditData {
  id: string;
  title: string;
  content: string;
}

// 编辑数据联合类型
export type EditData = string | VolumeEditData | ChapterEditData;

// 编辑状态
export interface EditState {
  type: EditType;
  title: string;
  data: EditData;
}

/**
 * 保存策略接口
 */
export interface SaveStrategy {
  /**
   * 保存到服务器
   */
  save(
    outlineId: string,
    editState: EditState,
    currentData: OutlineWithStructure | null
  ): Promise<void>;

  /**
   * 更新本地数据（可选）
   * 用于乐观更新，避免重新请求服务器
   */
  updateLocalData?(outlineData: OutlineWithStructure, editState: EditState): OutlineWithStructure;
}

/**
 * 大纲总览保存策略
 */
export const overviewSaveStrategy: SaveStrategy = {
  async save(outlineId: string, editState: EditState, currentData: OutlineWithStructure | null) {
    await updateOutlineContentApi(outlineId, { content: editState.data as string });

    // 如果当前状态是草稿且有内容，自动变更为已完成状态
    if (currentData?.status === 'DRAFT' && (editState.data as string).trim()) {
      await updateOutlineApi(outlineId, { status: 'PUBLISHED' });
    }
  },
};

/**
 * 卷信息保存策略
 */
export const volumeSaveStrategy: SaveStrategy = {
  async save(outlineId: string, editState: EditState) {
    const volumeData = editState.data as VolumeEditData;
    if (!volumeData.id) {
      throw new Error('卷ID缺失，无法保存');
    }

    await updateVolumeApi(outlineId, volumeData.id, {
      title: volumeData.title,
      description: volumeData.description || undefined,
    });
  },

  updateLocalData(outlineData: OutlineWithStructure, editState: EditState): OutlineWithStructure {
    const volumeData = editState.data as VolumeEditData;
    const updatedVolumes = outlineData.volumes?.map((vol) =>
      vol.id === volumeData.id
        ? { ...vol, title: volumeData.title, description: volumeData.description }
        : vol
    );
    return { ...outlineData, volumes: updatedVolumes };
  },
};

/**
 * 章节信息保存策略
 */
export const chapterSaveStrategy: SaveStrategy = {
  async save(outlineId: string, editState: EditState) {
    const chapterData = editState.data as ChapterEditData;
    if (!chapterData.id) {
      throw new Error('章节ID缺失，无法保存');
    }

    await updateChapterApi(outlineId, chapterData.id, {
      title: chapterData.title,
      content: chapterData.content || undefined,
    });
  },

  updateLocalData(outlineData: OutlineWithStructure, editState: EditState): OutlineWithStructure {
    const chapterData = editState.data as ChapterEditData;

    // 更新卷内章节
    const updatedVolumes = outlineData.volumes?.map((vol) => ({
      ...vol,
      chapters: vol.chapters?.map((chapter) =>
        chapter.id === chapterData.id
          ? {
              ...chapter,
              title: chapterData.title,
              content: chapterData.content
                ? { ...chapter.content, content: chapterData.content }
                : chapter.content,
            }
          : chapter
      ),
    }));

    // 更新直接章节
    const updatedChapters = outlineData.chapters?.map((chapter) =>
      chapter.id === chapterData.id
        ? {
            ...chapter,
            title: chapterData.title,
            content: chapterData.content
              ? { ...chapter.content, content: chapterData.content }
              : chapter.content,
          }
        : chapter
    );

    return {
      ...outlineData,
      volumes: updatedVolumes,
      chapters: updatedChapters,
    };
  },
};

/**
 * 策略映射表
 */
export const saveStrategies: Record<EditType, SaveStrategy> = {
  overview: overviewSaveStrategy,
  volume: volumeSaveStrategy,
  chapter: chapterSaveStrategy,
};

/**
 * 保存编辑内容的统一方法
 *
 * @param outlineId 大纲 ID
 * @param editState 编辑状态
 * @param outlineData 当前大纲数据
 * @returns 更新后的本地数据（如果策略支持）
 */
export async function saveEditContent(
  outlineId: string,
  editState: EditState,
  outlineData: OutlineWithStructure | null
): Promise<OutlineWithStructure | null> {
  const strategy = saveStrategies[editState.type];
  if (!strategy) {
    toast.error(`未支持的编辑类型: ${editState.type}`);
    throw new Error(`未支持的编辑类型: ${editState.type}`);
  }

  try {
    await strategy.save(outlineId, editState, outlineData);

    // 更新本地数据
    if (strategy.updateLocalData && outlineData) {
      return strategy.updateLocalData(outlineData, editState);
    }

    return outlineData;
  } catch (error) {
    console.error('Save error:', error);
    toast.error('保存失败，请重试');
    throw error;
  }
}
