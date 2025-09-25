'use client';

import { useState } from 'react';
import OutlineDialog from './components/OutlineDialog';
import OutlineList from './components/OutlineList';
import OutlineFilter, { FilterState } from './components/OutlineFilter';

export default function Home() {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: '',
    era: '',
    tags: [],
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    viewMode: 'list',
  });

  // todo 这些数据应该从实际的大纲数据中提取，这里先用示例数据
  const availableTypes = ['玄幻', '都市', '历史', '科幻', '武侠'];
  const availableEras = ['现代', '古代', '未来', '民国', '架空'];
  const availableTags = ['热血', '爽文', '系统', '重生', '穿越', '修仙', '商战'];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-han text-2xl font-bold text-[var(--moge-text-main)]">我的大纲</h1>
        </div>
        <OutlineDialog mode="create" />
      </div>

      {/* 筛选组件 */}
      <div className="mb-6">
        <OutlineFilter
          filters={filters}
          onFiltersChange={setFilters}
          availableTypes={availableTypes}
          availableEras={availableEras}
          availableTags={availableTags}
        />
      </div>

      <OutlineList filters={filters} />
    </div>
  );
}
