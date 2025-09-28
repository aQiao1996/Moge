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

export const useDictStore = create<DictState>((set, get) => ({
  novelTypes: [],
  novelTags: [],
  terminology: [],
  templates: [],
  statistics: {},
  loading: false,
  error: null,

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
