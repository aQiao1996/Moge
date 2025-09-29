import { create } from 'zustand';
import {
  createOutlineApi,
  getOutlinesApi,
  updateOutlineApi,
  deleteOutlineApi,
} from '@/api/outline.api';
import type { CreateOutlineValues, Outline, UpdateOutlineValues } from '@moge/types';

/**
 * 大纲数据状态管理接口定义
 */
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

/**
 * 大纲数据状态管理Store
 * 提供大纲的创建、查询、更新、删除等操作
 */
export const useOutlineStore = create<OutlineState>((set) => ({
  outlines: [],
  total: 0,
  loading: true,
  submitting: false,
  error: null,

  /**
   * 创建新的大纲
   * @param data 大纲创建数据
   * @returns 创建的大纲对象
   */
  createOutline: async (data) => {
    set({ submitting: true, error: null });
    try {
      const newOutline = await createOutlineApi(data);
      // 将新大纲添加到列表顶部
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

  /**
   * 获取大纲列表
   * 支持分页、搜索、筛选和排序
   * @param params 查询参数
   */
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

  /**
   * 重置错误状态
   */
  resetError: () => {
    set({ error: null });
  },

  /**
   * 更新大纲信息
   * @param id 大纲ID
   * @param data 更新数据
   * @returns 更新后的大纲对象
   */
  updateOutline: async (id, data) => {
    set({ submitting: true, error: null });
    try {
      const updatedOutline = await updateOutlineApi(id, data);
      // 更新列表中对应的大纲
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

  /**
   * 删除大纲
   * @param id 大纲ID
   */
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
