'use client';
import { useCallback, useState, useRef } from 'react';
import type { ControllerRenderProps, FieldPath } from 'react-hook-form';

import { FilePlus, Edit, Users, Zap, Globe, Folder } from 'lucide-react';

import {
  createOutlineSchema,
  updateOutlineSchema,
  type CreateOutlineValues,
  type UpdateOutlineValues,
  type Outline,
} from '@moge/types';
import { useOutlineStore } from '@/stores/outlineStore';
import { useDictStore } from '@/stores/dictStore';

import MogeFormDialog, {
  type FieldConfig,
  type FormFieldConfig,
} from '@/app/components/MogeFormDialog';
import { MogeInput } from '@/app/components/MogeInput';
import { MogeTextarea } from '@/app/components/MogeTextarea';
import {
  MogeSelect,
  MogeSelectContent,
  MogeSelectItem,
  MogeSelectTrigger,
  MogeSelectValue,
} from '@/app/components/MogeSelect';
import { MogeMultiSelect } from '@/app/components/MogeMultiSelect';
import { Button } from '@/components/ui/button';
import SettingSelectorDialog from '@/app/(main)/settings/components/SettingSelectorDialog';

interface OutlineDialogProps {
  mode: 'create' | 'edit';
  outline?: Outline;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type FormValues = CreateOutlineValues | UpdateOutlineValues;

/**
 * 设定分类配置
 * 定义四种设定类型的元数据
 */
const SETTING_CATEGORIES = [
  { key: 'characters' as const, label: '角色设定', Icon: Users, color: 'text-blue-500' },
  { key: 'systems' as const, label: '系统设定', Icon: Zap, color: 'text-yellow-500' },
  { key: 'worlds' as const, label: '世界设定', Icon: Globe, color: 'text-green-500' },
  { key: 'misc' as const, label: '辅助设定', Icon: Folder, color: 'text-purple-500' },
];

export default function OutlineDialog({
  mode,
  outline,
  trigger,
  open,
  onOpenChange,
}: OutlineDialogProps) {
  const { createOutline, updateOutline } = useOutlineStore();
  const { novelTypes, novelEras, novelTags, fetchNovelTypes, fetchNovelEras, fetchNovelTags } =
    useDictStore();

  const isEditMode = mode === 'edit';

  // 设定选��器状态管理
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<{
    key: 'characters' | 'systems' | 'worlds' | 'misc';
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
    color: string;
  } | null>(null);
  const [currentSettingIds, setCurrentSettingIds] = useState<string[]>([]);

  // 使用useRef保存当前字段的onChange回调
  const fieldOnChangeRef = useRef<((value: string[]) => void) | null>(null);

  // 字段配置
  const fields: FieldConfig[] = [
    { name: 'name', label: '小说名称', required: !isEditMode },
    { name: 'type', label: '小说类型', required: !isEditMode },
    { name: 'era', label: '故事时代' },
    { name: 'tags', label: '小说标签' },
    { name: 'conflict', label: '核心冲突' },
    { name: 'remark', label: '备注' },
    { name: 'characters', label: '关联角色' },
    { name: 'systems', label: '关联系统' },
    { name: 'worlds', label: '关联世界' },
    { name: 'misc', label: '关联辅助' },
  ];

  const renderControl = useCallback(
    (
      field: ControllerRenderProps<
        CreateOutlineValues | UpdateOutlineValues,
        FieldPath<CreateOutlineValues | UpdateOutlineValues>
      >,
      name: FieldPath<CreateOutlineValues | UpdateOutlineValues>
    ) => {
      if (name === 'type') {
        return (
          <MogeSelect onValueChange={field.onChange} value={field.value as string}>
            <MogeSelectTrigger>
              <MogeSelectValue placeholder="请选择小说类型" />
            </MogeSelectTrigger>
            <MogeSelectContent>
              {novelTypes.map((t) => (
                <MogeSelectItem key={t.id} value={t.value}>
                  {t.label}
                </MogeSelectItem>
              ))}
            </MogeSelectContent>
          </MogeSelect>
        );
      }

      if (name === 'era') {
        return (
          <MogeSelect onValueChange={field.onChange} value={field.value as string}>
            <MogeSelectTrigger>
              <MogeSelectValue placeholder="请选择故事时代" />
            </MogeSelectTrigger>
            <MogeSelectContent>
              {novelEras.map((e) => (
                <MogeSelectItem key={e.id} value={e.label}>
                  {e.label}
                </MogeSelectItem>
              ))}
            </MogeSelectContent>
          </MogeSelect>
        );
      }

      if (name === 'tags') {
        return (
          <MogeMultiSelect
            options={novelTags.map((tag) => ({ value: tag.label, label: tag.label }))}
            value={field.value as string[]}
            onChange={field.onChange}
            placeholder="选择标签"
          />
        );
      }

      // 处理设定关联字段(characters, systems, worlds, misc)
      if (name === 'characters' || name === 'systems' || name === 'worlds' || name === 'misc') {
        const categoryConfig = SETTING_CATEGORIES.find((cat) => cat.key === name);
        if (!categoryConfig) return null;

        const { Icon, label, color } = categoryConfig;
        const selectedIds = (field.value as string[]) || [];

        return (
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => {
                setCurrentCategory(categoryConfig);
                setCurrentSettingIds(selectedIds);
                // 保存field.onChange引用以便在选择器确认时调用
                fieldOnChangeRef.current = field.onChange;
                setSelectorOpen(true);
              }}
            >
              <Icon className={`h-4 w-4 ${color}`} />
              <span>选择{label}</span>
              {selectedIds.length > 0 && (
                <span className="ml-auto text-sm text-[var(--moge-text-muted)]">
                  已选 {selectedIds.length} 项
                </span>
              )}
            </Button>
          </div>
        );
      }

      if (name === 'conflict' || name === 'remark') {
        return (
          <MogeTextarea
            rows={name === 'conflict' ? 3 : 2}
            placeholder={
              name === 'conflict' ? '例:一颗会说话的核弹要求主角 24 小时内帮它自杀……' : '备忘信息'
            }
            {...field}
          />
        );
      }

      return <MogeInput placeholder="会说话的核弹" {...field} />;
    },
    [novelTypes, novelEras, novelTags]
  );

  const onSubmit = async (values: FormValues) => {
    if (isEditMode && outline) {
      if (!outline.id) return;
      await updateOutline(outline.id, values as UpdateOutlineValues);
    } else {
      await createOutline(values as CreateOutlineValues);
    }
  };

  const defaultTrigger = isEditMode ? (
    <Button size="sm" variant="ghost" title="编辑基本信息">
      <Edit className="h-4 w-4" />
    </Button>
  ) : (
    <Button className="gap-2 shadow-[var(--moge-glow-btn)]">
      <FilePlus className="h-4 w-4" />
      新增大纲
    </Button>
  );

  /**
   * 处理设定选择确认
   * 将选中的设定 ID 更新到表单字段
   */
  const handleSettingConfirm = (selectedIds: string[]) => {
    if (fieldOnChangeRef.current) {
      fieldOnChangeRef.current(selectedIds);
    }
  };

  return (
    <>
      <MogeFormDialog
        mode={mode}
        title={isEditMode ? '编辑大纲' : '新建大纲'}
        description={isEditMode ? '修改大纲信息' : '填写信息后点击创建即可生成大纲'}
        open={open}
        onOpenChange={onOpenChange}
        trigger={trigger}
        createSchema={createOutlineSchema}
        updateSchema={updateOutlineSchema}
        defaultValues={{
          name: '',
          type: '',
          era: '',
          conflict: '',
          tags: [],
          remark: '',
          characters: [],
          systems: [],
          worlds: [],
          misc: [],
        }}
        onSubmit={onSubmit}
        fields={fields as FormFieldConfig<CreateOutlineValues | UpdateOutlineValues>[]}
        renderControl={renderControl}
        defaultTrigger={defaultTrigger}
        item={outline}
        onOpen={() => {
          void fetchNovelTypes();
          void fetchNovelEras();
          void fetchNovelTags();
        }}
      />

      {/* 设定选择器弹窗 */}
      {currentCategory && (
        <SettingSelectorDialog
          open={selectorOpen}
          onOpenChange={setSelectorOpen}
          category={currentCategory.key}
          categoryLabel={currentCategory.label}
          selectedIds={currentSettingIds}
          onConfirm={handleSettingConfirm}
          Icon={currentCategory.Icon}
          color={currentCategory.color}
        />
      )}
    </>
  );
}
