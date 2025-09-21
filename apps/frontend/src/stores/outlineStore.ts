import { create } from 'zustand';
import {
  createOutlineApi,
  getOutlinesApi,
  updateOutlineApi,
  deleteOutlineApi,
} from '@/api/outline.api';
import type { CreateOutlineValues, Outline, UpdateOutlineValues } from '@moge/types';

interface OutlineState {
  outlines: Outline[];
  total: number;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  createOutline: (data: CreateOutlineValues) => Promise<Outline>;
  getOutlines: (params: {
    pageNum?: number;
    pageSize?: number;
    search?: string;
    type?: string;
    era?: string;
    tags?: string[];
    sortBy?: 'name' | 'createdAt' | 'type';
    sortOrder?: 'asc' | 'desc';
  }) => Promise<void>;
  updateOutline: (id: string, data: UpdateOutlineValues) => Promise<Outline>;
  deleteOutline: (id: string) => Promise<void>;
  resetError: () => void;
}

export const useOutlineStore = create<OutlineState>((set) => ({
  outlines: [],
  total: 0,
  loading: true,
  submitting: false,
  error: null,

  createOutline: async (data) => {
    set({ submitting: true, error: null });
    try {
      const newOutline = await createOutlineApi(data);
      set((state) => ({
        outlines: [newOutline, ...state.outlines],
        total: state.total + 1,
        submitting: false,
      }));
      return newOutline;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '创建大纲失败',
        submitting: false,
      });
      throw error;
    }
  },

  getOutlines: async (params) => {
    set({ loading: true, error: null });
    try {
      const result = await getOutlinesApi(params);
      set({ outlines: result.list, total: result.total, loading: false });
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

  updateOutline: async (id, data) => {
    set({ submitting: true, error: null });
    try {
      const updatedOutline = await updateOutlineApi(id, data);
      set((state) => ({
        outlines: state.outlines.map((outline) => (outline.id === id ? updatedOutline : outline)),
        submitting: false,
      }));
      return updatedOutline;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '更新大纲失败',
        submitting: false,
      });
      throw error;
    }
  },

  deleteOutline: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteOutlineApi(id);
      set((state) => ({
        outlines: state.outlines.filter((outline) => outline.id !== id),
        total: state.total - 1,
        loading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '删除大纲失败',
        loading: false,
      });
      throw error;
    }
  },
}));
