'use client';
import { useCallback } from 'react';
import type { ControllerRenderProps, FieldPath } from 'react-hook-form';

import { Plus, Edit } from 'lucide-react';

import {
  createDictItemSchema,
  updateDictItemSchema,
  type CreateDictItemValues,
  type UpdateDictItemValues,
  type DictItem,
} from '@moge/types';

import MogeFormDialog, {
  type FieldConfig,
  type FormFieldConfig,
} from '@/app/components/MogeFormDialog';
import { MogeInput } from '@/app/components/MogeInput';
import { MogeTextarea } from '@/app/components/MogeTextarea';
import { Button } from '@/components/ui/button';

interface DictItemDialogProps {
  mode: 'create' | 'edit';
  categoryCode: string;
  categoryTitle: string;
  item?: DictItem;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit?: (values: CreateDictItemValues | UpdateDictItemValues) => void;
}

type FormValues = CreateDictItemValues | UpdateDictItemValues;

export default function DictItemDialog({
  mode,
  categoryCode,
  categoryTitle,
  item,
  trigger,
  open,
  onOpenChange,
  onSubmit,
}: DictItemDialogProps) {
  const isEditMode = mode === 'edit';

  // 字段配置
  const fields: FieldConfig[] = [
    { name: 'code', label: '词条编码', required: !isEditMode },
    { name: 'label', label: '显示标签', required: !isEditMode },
    { name: 'value', label: '存储值' },
    { name: 'sortOrder', label: '排序序号' },
    { name: 'isEnabled', label: '启用状态' },
    { name: 'description', label: '描述' },
  ];

  const renderControl = useCallback(
    (
      field: ControllerRenderProps<
        CreateDictItemValues | UpdateDictItemValues,
        FieldPath<CreateDictItemValues | UpdateDictItemValues>
      >,
      name: FieldPath<CreateDictItemValues | UpdateDictItemValues>
    ) => {
      if (name === 'isEnabled') {
        return (
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              size="sm"
              variant={field.value ? 'default' : 'outline'}
              onClick={() => field.onChange(!field.value)}
            >
              {field.value ? '启用' : '禁用'}
            </Button>
            <span className="text-sm text-[var(--moge-text-sub)]">点击切换状态</span>
          </div>
        );
      }

      if (name === 'sortOrder') {
        return (
          <MogeInput
            type="number"
            placeholder="输入数字，数值越小排序越靠前"
            value={(field.value as number)?.toString() || ''}
            onChange={(e) => {
              const value = e.target.value;
              field.onChange(value === '' ? 0 : parseInt(value, 10));
            }}
            onBlur={field.onBlur}
            name={field.name}
            disabled={field.disabled}
          />
        );
      }

      if (name === 'description') {
        return (
          <MogeTextarea
            rows={3}
            placeholder="对该词条的详细描述"
            value={(field.value as string) || ''}
            onChange={field.onChange}
            onBlur={field.onBlur}
            name={field.name}
            disabled={field.disabled}
          />
        );
      }

      if (name === 'code') {
        return (
          <MogeInput
            placeholder="英文编码，如：fantasy, urban"
            value={(field.value as string) || ''}
            onChange={field.onChange}
            onBlur={field.onBlur}
            name={field.name}
            disabled={field.disabled}
          />
        );
      }

      if (name === 'label') {
        return (
          <MogeInput
            placeholder="中文显示名称，如：玄幻、都市"
            value={(field.value as string) || ''}
            onChange={field.onChange}
            onBlur={field.onBlur}
            name={field.name}
            disabled={field.disabled}
          />
        );
      }

      if (name === 'value') {
        return (
          <MogeInput
            placeholder="存储值（可选），默认使用 code 值"
            value={(field.value as string) || ''}
            onChange={field.onChange}
            onBlur={field.onBlur}
            name={field.name}
            disabled={field.disabled}
          />
        );
      }

      return (
        <MogeInput
          value={(field.value as string) || ''}
          onChange={field.onChange}
          onBlur={field.onBlur}
          name={field.name}
          disabled={field.disabled}
        />
      );
    },
    []
  );

  const handleSubmit = (values: FormValues) => {
    const submissionValues = {
      ...values,
      categoryCode,
    };

    if (onSubmit) {
      onSubmit(submissionValues as CreateDictItemValues | UpdateDictItemValues);
    }
  };

  const defaultTrigger = isEditMode ? (
    <Button size="sm" variant="ghost" title="编辑词条">
      <Edit className="h-4 w-4" />
    </Button>
  ) : (
    <Button className="gap-2 shadow-[var(--moge-glow-btn)]">
      <Plus className="h-4 w-4" />
      新建词条
    </Button>
  );

  return (
    <MogeFormDialog
      mode={mode}
      title={isEditMode ? `编辑${categoryTitle}词条` : `新建${categoryTitle}词条`}
      description={
        isEditMode
          ? `修改${categoryTitle}词条信息`
          : `填写信息后点击创建即可添加新的${categoryTitle}词条`
      }
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
      createSchema={createDictItemSchema}
      updateSchema={updateDictItemSchema}
      defaultValues={{
        categoryCode,
        code: '',
        label: '',
        value: '',
        sortOrder: 0,
        isEnabled: true,
        description: '',
      }}
      onSubmit={handleSubmit}
      fields={fields as FormFieldConfig<CreateDictItemValues | UpdateDictItemValues>[]}
      renderControl={renderControl}
      defaultTrigger={defaultTrigger}
      item={item}
    />
  );
}
