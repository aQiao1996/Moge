import { create } from 'zustand';
import { createOutlineApi, getOutlinesApi } from '@/api/outline.api';
import type { CreateOutlineValues } from '@moge/types';

interface OutlineItem {
  id: string;
  name: string;
  type: string;
  era?: string;
  conflict?: string;
  tags?: string[];
  remark?: string;
}

interface OutlineState {
  outlines: OutlineItem[];
  loading: boolean;
  error: string | null;
  createOutline: (data: CreateOutlineValues) => Promise<void>;
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
      const result = await createOutlineApi(data);
      set((state) => ({
        outlines: [...state.outlines, result],
        loading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Create outline failed',
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
        error: error instanceof Error ? error.message : 'Get outlines failed',
        loading: false,
      });
    }
  },

  resetError: () => {
    set({ error: null });
  },
}));
