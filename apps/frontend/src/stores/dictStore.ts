import { create } from 'zustand';
import type { Dict, CreateDictItemValues, UpdateDictItemValues } from '@moge/types';
import {
  getDictApi,
  getDictStatisticsApi,
  createDictItemApi,
  updateDictItemApi,
  deleteDictItemApi,
  toggleDictItemApi,
} from '@/api/dict.api';

/**
 * 字典数据状态管理接口定义
 */
interface DictState {
  novelTypes: Dict[];
  novelTags: Dict[];
  terminology: Dict[];
  templates: Dict[];
  statistics: Record<string, number>;
  loading: boolean;
  error: string | null;
  fetchNovelTypes: () => Promise<void>;
  fetchDictByType: (type: string) => Promise<Dict[]>;
  fetchStatistics: () => Promise<Record<string, number>>;
  createDictItem: (data: CreateDictItemValues) => Promise<Dict>;
  updateDictItem: (id: number, data: UpdateDictItemValues) => Promise<Dict>;
  deleteDictItem: (id: number) => Promise<void>;
  toggleDictItem: (id: number, isEnabled: boolean) => Promise<Dict>;
}

/**
 * 字典数据状态管理Store
 * 提供字典分类数据的获取、创建、更新、删除操作
 */
export const useDictStore = create<DictState>((set, get) => ({
  novelTypes: [],
  novelTags: [],
  terminology: [],
  templates: [],
  statistics: {},
  loading: false,
  error: null,

  /**
   * 获取小说类型数据
   * 如果已有数据则不重复请求，实现缓存机制
   */
  fetchNovelTypes: async () => {
    // 如果已经有数据了,就不再重复请求
    if (get().novelTypes.length > 0) {
      return;
    }

    set({ loading: true, error: null });
    try {
      const response = await getDictApi('novel_types');
      set({ novelTypes: response.data, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch novel types';
      set({ error: errorMessage, loading: false });
      console.error(errorMessage);
    }
  },

  /**
   * 获取字典统计数据
   * 返回各分类的词条数量统计
   * @returns 包含分类代码和数量的映射对象
   */
  fetchStatistics: async () => {
    set({ loading: true, error: null });
    try {
      const response = await getDictStatisticsApi();
      const statisticsMap = response.data.reduce(
        (acc, item) => {
          acc[item.categoryCode] = item.count;
          return acc;
        },
        {} as Record<string, number>
      );

      set({ statistics: statisticsMap, loading: false });
      return statisticsMap;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch statistics';
      set({ error: errorMessage, loading: false });
      console.error(errorMessage);
      throw error;
    }
  },

  /**
   * 根据类型获取字典数据
   * @param type 字典类型代码
   * @returns 该类型下的字典项数组
   */
  fetchDictByType: async (type: string) => {
    set({ loading: true, error: null });
    try {
      const response = await getDictApi(type);
      set({ loading: false });
      return response.data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : `Failed to fetch dict type: ${type}`;
      set({ error: errorMessage, loading: false });
      console.error(errorMessage);
      throw error;
    }
  },

  /**
   * 创建新的字典项
   * @param data 字典项数据
   * @returns 创建的字典项对象
   */
  createDictItem: async (data: CreateDictItemValues) => {
    set({ loading: true, error: null });
    try {
      const response = await createDictItemApi(data);
      set({ loading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create dict item';
      set({ error: errorMessage, loading: false });
      console.error(errorMessage);
      throw error;
    }
  },

  /**
   * 更新字典项信息
   * @param id 字典项ID
   * @param data 更新数据
   * @returns 更新后的字典项对象
   */
  updateDictItem: async (id: number, data: UpdateDictItemValues) => {
    set({ loading: true, error: null });
    try {
      const response = await updateDictItemApi(id, data);
      set({ loading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update dict item';
      set({ error: errorMessage, loading: false });
      console.error(errorMessage);
      throw error;
    }
  },

  /**
   * 删除字典项
   * @param id 字典项ID
   */
  deleteDictItem: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await deleteDictItemApi(id);
      set({ loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete dict item';
      set({ error: errorMessage, loading: false });
      console.error(errorMessage);
      throw error;
    }
  },

  /**
   * 切换字典项启用状态
   * @param id 字典项ID
   * @param isEnabled 是否启用
   * @returns 更新后的字典项对象
   */
  toggleDictItem: async (id: number, isEnabled: boolean) => {
    set({ loading: true, error: null });
    try {
      const response = await toggleDictItemApi(id, isEnabled);
      set({ loading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle dict item';
      set({ error: errorMessage, loading: false });
      console.error(errorMessage);
      throw error;
    }
  },
}));
