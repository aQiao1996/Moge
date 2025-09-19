import { create } from 'zustand';
import { createOutlineApi, getOutlinesApi } from '@/api/outline.api';
import type { CreateOutlineValues, Outline } from '@moge/types';

interface OutlineState {
  outlines: Outline[];
  loading: boolean;
  error: string | null;
  createOutline: (data: CreateOutlineValues) => Promise<Outline>;
  getOutlines: () => Promise<void>;
  resetError: () => void;
}

export const useOutlineStore = create<OutlineState>((set) => ({
  outlines: [],
  loading: false,
  error: null,

  createOutline: async (data) => {
    set({ loading: true, error: null });
    try {
      const newOutline = await createOutlineApi(data);
      set((state) => ({
        outlines: [newOutline, ...state.outlines],
        loading: false,
      }));
      return newOutline;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '创建大纲失败',
        loading: false,
      });
      throw error;
    }
  },

  getOutlines: async () => {
    set({ loading: true, error: null });
    try {
      const result = await getOutlinesApi();
      set({ outlines: result, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取大纲列表失败',
        loading: false,
      });
    }
  },

  resetError: () => {
    set({ error: null });
  },
}));
