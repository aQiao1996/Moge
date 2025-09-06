'use client';
import { useState } from 'react';
import CreateOutlineDialog from './components/CreateOutlineDialog';
import OutlineList, { type Outline } from './components/OutlineList';
import type { CreateOutlineValues } from '@/schemas/outline';

export default function Home() {
  const [list, setList] = useState<Outline[]>([]);
  const [open, setOpen] = useState(false);

  const handleCreate = (values: CreateOutlineValues) => {
    // 这里把 values 转成 Outline 并追加
    const newItem: Outline = {
      id: Date.now().toString(),
      name: values.name,
      type: values.type,
      summary: values.conflict || '',
      createdAt: new Date().toLocaleString(),
    };
    setList((prev) => [newItem, ...prev]);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-han text-2xl font-bold text-[var(--moge-text-main)]">我的大纲</h1>
          <p className="mt-1 text-sm text-[var(--moge-text-sub)]">共 {list.length} 条</p>
        </div>
        <CreateOutlineDialog open={open} onOpenChange={setOpen} onSuccess={handleCreate} />
      </div>

      <OutlineList list={list} />
    </div>
  );
}
