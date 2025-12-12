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
import { useTranslations } from 'next-intl';

/**
 * 字典词条对话框组件的属性接口
 */
interface DictItemDialogProps {
  mode: 'create' | 'edit';
  categoryCode: string;
  categoryTitle: string;
  item?: DictItem;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit?: (values: CreateDictItemValues | UpdateDictItemValues) => Promise<void>;
}

type FormValues = CreateDictItemValues | UpdateDictItemValues;

/**
 * 字典词条对话框组件
 *
 * 功能：
 * - 支持创建和编辑两种模式
 * - 提供词条编码、显示标签、存储值、排序序号、启用状态、描述等字段
 * - 自动校验表单数据
 * - 集成 MogeFormDialog 实现统一的对话框样式
 *
 * @param mode - 对话框模式：'create' 创建 | 'edit' 编辑
 * @param categoryCode - 分类编码
 * @param categoryTitle - 分类标题
 * @param item - 编辑时的词条数据
 * @param trigger - 自定义触发按钮
 * @param open - 控制对话框打开状态
 * @param onOpenChange - 对话框状态变化回调
 * @param onSubmit - 表单提交回调
 */
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
  const t = useTranslations('dictionary.item');

  // 字段配置：定义表单中需要显示的字段
  const fields: FieldConfig[] = [
    { name: 'value', label: t('value'), required: !isEditMode },
    { name: 'label', label: t('label'), required: !isEditMode },
    { name: 'sortOrder', label: t('sortOrder') },
    { name: 'isEnabled', label: t('isEnabled') },
    { name: 'description', label: t('description') },
  ];

  /**
   * 渲染表单控件
   * 根据字段名渲染不同类型的输入控件
   */
  const renderControl = useCallback(
    (
      field: ControllerRenderProps<
        CreateDictItemValues | UpdateDictItemValues,
        FieldPath<CreateDictItemValues | UpdateDictItemValues>
      >,
      name: FieldPath<CreateDictItemValues | UpdateDictItemValues>
    ) => {
      // 启用状态：按钮切换
      if (name === 'isEnabled') {
        return (
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              size="sm"
              variant={field.value ? 'default' : 'outline'}
              onClick={() => field.onChange(!field.value)}
            >
              {field.value ? t('enabled') : t('disabled')}
            </Button>
            <span className="text-sm text-[var(--moge-text-sub)]">{t('toggleStatus')}</span>
          </div>
        );
      }

      // 排序序号：数字输入框
      if (name === 'sortOrder') {
        return (
          <MogeInput
            type="number"
            placeholder={t('sortOrderPlaceholder')}
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

      // 描述：多行文本框
      if (name === 'description') {
        return (
          <MogeTextarea
            rows={3}
            placeholder={t('descriptionPlaceholder')}
            value={(field.value as string) || ''}
            onChange={field.onChange}
            onBlur={field.onBlur}
            name={field.name}
            disabled={field.disabled}
          />
        );
      }

      // 存储值：英文编码
      if (name === 'value') {
        return (
          <MogeInput
            placeholder={t('valuePlaceholder')}
            value={(field.value as string) || ''}
            onChange={field.onChange}
            onBlur={field.onBlur}
            name={field.name}
            disabled={field.disabled}
          />
        );
      }

      // 显示标签：中文名称
      if (name === 'label') {
        return (
          <MogeInput
            placeholder={t('labelPlaceholder')}
            value={(field.value as string) || ''}
            onChange={field.onChange}
            onBlur={field.onBlur}
            name={field.name}
            disabled={field.disabled}
          />
        );
      }

      // 默认：普通文本输入框
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

  /**
   * 处理表单提交
   * 添加分类编码并调用父组件的提交回调
   */
  const handleSubmit = async (values: FormValues) => {
    const submissionValues = {
      ...values,
      categoryCode,
    };

    if (onSubmit) {
      await onSubmit(submissionValues as CreateDictItemValues | UpdateDictItemValues);
    }
  };

  // 默认触发按钮：根据模式显示不同的按钮
  const defaultTrigger = isEditMode ? (
    <Button size="sm" variant="ghost" title={t('edit')}>
      <Edit className="h-4 w-4" />
    </Button>
  ) : (
    <Button className="gap-2 shadow-[var(--moge-glow-btn)]">
      <Plus className="h-4 w-4" />
      {t('create')}
    </Button>
  );

  return (
    <MogeFormDialog
      mode={mode}
      title={t(isEditMode ? 'editTitle' : 'createTitle', { category: categoryTitle })}
      description={t(isEditMode ? 'editDescription' : 'createDescription', {
        category: categoryTitle,
      })}
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
      createSchema={createDictItemSchema}
      updateSchema={updateDictItemSchema}
      defaultValues={{
        categoryCode,
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
