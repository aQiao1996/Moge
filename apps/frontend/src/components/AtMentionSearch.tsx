/**
 * @ 引用搜索组件
 * 用于在编辑器中搜索并插入设定链接
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { searchSettings, type SearchResult } from '@/api/search.api';
import { debounce } from 'lodash';

interface AtMentionSearchProps {
  /** 项目ID（可选，用于筛选项目内的设定） */
  projectId?: number;
  /** 选择设定后的回调 */
  onSelect: (item: SearchResult) => void;
  /** 是否显示搜索框 */
  open: boolean;
  /** 关闭搜索框 */
  onOpenChange: (open: boolean) => void;
}

export default function AtMentionSearch({
  projectId,
  onSelect,
  open,
  onOpenChange,
}: AtMentionSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // 创建防抖搜索函数
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const data = await searchSettings(query, projectId);
        setResults(data);
      } catch (error) {
        console.error('搜索失败:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    [projectId]
  );

  // 搜索查询变化时触发搜索
  useEffect(() => {
    void debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  // 处理选择
  const handleSelect = (item: SearchResult) => {
    onSelect(item);
    onOpenChange(false);
    setSearchQuery('');
    setResults([]);
  };

  // 获取类型标签
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'character':
        return '角色';
      case 'system':
        return '系统';
      case 'world':
        return '世界';
      case 'misc':
        return '辅助';
      default:
        return type;
    }
  };

  // 获取类型颜色
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'character':
        return 'text-blue-600 bg-blue-50';
      case 'system':
        return 'text-green-600 bg-green-50';
      case 'world':
        return 'text-purple-600 bg-purple-50';
      case 'misc':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (!open) return null;

  return (
    <Card className="absolute z-50 mt-1 w-[400px] p-2 shadow-lg">
      <Input
        placeholder="搜索设定..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-2"
        autoFocus
      />

      <div className="max-h-[300px] overflow-y-auto">
        {loading && <div className="p-4 text-center text-gray-500">搜索中...</div>}

        {!loading && searchQuery && results.length === 0 && (
          <div className="p-4 text-center text-gray-500">未找到相关设定</div>
        )}

        {!loading && !searchQuery && (
          <div className="p-4 text-center text-gray-500">输入关键词搜索设定</div>
        )}

        {results.length > 0 && (
          <div className="space-y-1">
            {results.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => handleSelect(item)}
                className="flex cursor-pointer items-start gap-2 rounded p-2 hover:bg-gray-50"
              >
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${getTypeColor(item.type)}`}
                >
                  {getTypeLabel(item.type)}
                </span>
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  {item.description && (
                    <div className="line-clamp-2 text-sm text-gray-500">{item.description}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
