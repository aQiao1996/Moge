'use client';

import CharacterDialog from '@/app/(main)/settings/components/CharacterDialog';
import SystemDialog from '@/app/(main)/settings/components/SystemDialog';
import WorldDialog from '@/app/(main)/settings/components/WorldDialog';
import MiscDialog from '@/app/(main)/settings/components/MiscDialog';
import type { Character, System, World, Misc } from '@moge/types';
import type { CharacterSetting } from '@/api/settings.api';

interface CategoryDialogsProps {
  category: string;
  // 创建对话框
  createOpen: boolean;
  onCreateChange: (open: boolean) => void;
  // 编辑对话框
  editOpen: boolean;
  editingSetting: CharacterSetting | null;
  onEditChange: (open: boolean) => void;
}

/**
 * 分类对话框组件
 * 根据不同的分类渲染对应的创建/编辑对话框
 */
export default function CategoryDialogs({
  category,
  createOpen,
  onCreateChange,
  editOpen,
  editingSetting,
  onEditChange,
}: CategoryDialogsProps) {
  // 对话框组件映射
  const dialogMap: Record<
    string,
    typeof CharacterDialog | typeof SystemDialog | typeof WorldDialog | typeof MiscDialog
  > = {
    characters: CharacterDialog,
    systems: SystemDialog,
    worlds: WorldDialog,
    misc: MiscDialog,
  };

  const DialogComponent = dialogMap[category];
  if (!DialogComponent) return null;

  // 获取属性键名 ('characters' → 'character')
  const propKey = category.slice(0, -1) as 'character' | 'system' | 'world' | 'misc';

  return (
    <>
      {/* 创建对话框 */}
      <DialogComponent mode="create" open={createOpen} onOpenChange={onCreateChange} />

      {/* 编辑对话框 */}
      {editingSetting && (
        <DialogComponent
          mode="edit"
          {...{
            [propKey]: editingSetting as
              | (Character & { id?: string | number })
              | (System & { id?: string | number })
              | (World & { id?: string | number })
              | (Misc & { id?: string | number }),
          }}
          open={editOpen}
          onOpenChange={onEditChange}
        />
      )}
    </>
  );
}
