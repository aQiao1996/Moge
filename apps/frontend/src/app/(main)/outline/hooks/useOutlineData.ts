/**
 * 大纲数据加载 Hook
 *
 * 功能：
 * - 加载大纲详情数据
 * - 管理卷的展开/折叠状态
 * - 提供数据刷新方法
 */
import { useState, useEffect, useCallback } from 'react';
import { getOutlineDetailApi } from '@/api/outline.api';
import type { OutlineWithStructure } from '@moge/types';

interface UseOutlineDataOptions {
  /** 大纲 ID */
  outlineId: string;
  /** 是否自动加载数据 */
  autoLoad?: boolean;
}

interface UseOutlineDataReturn {
  /** 大纲数据 */
  outlineData: OutlineWithStructure | null;
  /** 设置大纲数据 */
  setOutlineData: React.Dispatch<React.SetStateAction<OutlineWithStructure | null>>;
  /** 加载状态 */
  loading: boolean;
  /** 展开的卷 ID 集合 */
  expandedVolumes: Set<string>;
  /** 切换卷展开状态 */
  toggleVolume: (volumeId: string) => void;
  /** 加载数据 */
  loadData: () => Promise<void>;
  /** 刷新数据（保持当前状态） */
  refreshData: () => Promise<void>;
}

/**
 * 大纲数据加载 Hook
 *
 * @example
 * const { outlineData, loading, loadData } = useOutlineData({
 *   outlineId: '123',
 *   autoLoad: true,
 * });
 */
export function useOutlineData({
  outlineId,
  autoLoad = true,
}: UseOutlineDataOptions): UseOutlineDataReturn {
  const [outlineData, setOutlineData] = useState<OutlineWithStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedVolumes, setExpandedVolumes] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    if (!outlineId) return;

    try {
      setLoading(true);
      const data = await getOutlineDetailApi(outlineId);
      setOutlineData(data);

      // 默认展开所有卷
      const volumeIds = new Set(
        data.volumes?.map((v) => v.id).filter((id): id is string => Boolean(id)) || []
      );
      setExpandedVolumes(volumeIds);
    } catch (error) {
      console.error('Load outline data error:', error);
    } finally {
      setLoading(false);
    }
  }, [outlineId]);

  const refreshData = useCallback(async () => {
    if (!outlineId) return;

    try {
      const data = await getOutlineDetailApi(outlineId);
      setOutlineData(data);

      // 刷新时保持当前的展开状态，但添加新的卷
      setExpandedVolumes((prev) => {
        const newSet = new Set(prev);
        data.volumes?.forEach((v) => {
          if (v.id) newSet.add(v.id);
        });
        return newSet;
      });
    } catch (error) {
      console.error('Refresh outline data error:', error);
    }
  }, [outlineId]);

  const toggleVolume = useCallback((volumeId: string) => {
    setExpandedVolumes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(volumeId)) {
        newSet.delete(volumeId);
      } else {
        newSet.add(volumeId);
      }
      return newSet;
    });
  }, []);

  useEffect(() => {
    if (autoLoad) {
      void loadData();
    }
  }, [autoLoad, loadData]);

  return {
    outlineData,
    setOutlineData,
    loading,
    expandedVolumes,
    toggleVolume,
    loadData,
    refreshData,
  };
}
