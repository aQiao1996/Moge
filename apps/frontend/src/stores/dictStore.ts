import { create } from 'zustand';
import type { Dict } from '@moge/types';
import { getDictApi } from '@/api/dict.api';

interface DictState {
  novelTypes: Dict[];
  loading: boolean;
  error: string | null;
  fetchNovelTypes: () => Promise<void>;
}

export const useDictStore = create<DictState>((set, get) => ({
  novelTypes: [],
  loading: false,
  error: null,

  fetchNovelTypes: async () => {
    // 如果已经有数据了,就不再重复请求
    if (get().novelTypes.length > 0) {
      return;
    }

    set({ loading: true, error: null });
    try {
      const response = await getDictApi('novel_type');
      set({ novelTypes: response.data, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch novel types';
      set({ error: errorMessage, loading: false });
      console.error(errorMessage);
    }
  },
}));
