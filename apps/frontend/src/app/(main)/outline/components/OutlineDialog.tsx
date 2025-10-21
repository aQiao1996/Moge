'use client';
import { useCallback } from 'react';
import type { ControllerRenderProps, FieldPath } from 'react-hook-form';

import { FilePlus, Edit } from 'lucide-react';

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

interface OutlineDialogProps {
  mode: 'create' | 'edit';
  outline?: Outline;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type FormValues = CreateOutlineValues | UpdateOutlineValues;

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

  // 字段配置
  const fields: FieldConfig[] = [
    { name: 'name', label: '小说名称', required: !isEditMode },
    { name: 'type', label: '小说类型', required: !isEditMode },
    { name: 'era', label: '故事时代' },
    { name: 'tags', label: '小说标签' },
    { name: 'conflict', label: '核心冲突' },
    { name: 'remark', label: '备注' },
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
                <MogeSelectItem key={t.id} value={t.value!}>
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

      if (name === 'conflict' || name === 'remark') {
        return (
          <MogeTextarea
            rows={name === 'conflict' ? 3 : 2}
            placeholder={
              name === 'conflict' ? '例：一颗会说话的核弹要求主角 24 小时内帮它自杀……' : '备忘信息'
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

  return (
    <MogeFormDialog
      mode={mode}
      title={isEditMode ? '编辑大纲' : '新建大纲'}
      description={isEditMode ? '修改大纲信息' : '填写信息后点击创建即可生成大纲'}
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
      createSchema={createOutlineSchema}
      updateSchema={updateOutlineSchema}
      defaultValues={{ name: '', type: '', era: '', conflict: '', tags: [], remark: '' }}
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
  );
}
