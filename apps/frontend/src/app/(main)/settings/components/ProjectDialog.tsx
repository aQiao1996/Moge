'use client';
import { useCallback, useMemo } from 'react';
import type { ControllerRenderProps, FieldPath } from 'react-hook-form';

import { Plus } from 'lucide-react';

import {
  createProjectSchema,
  updateProjectSchema,
  type CreateProjectValues,
  type UpdateProjectValues,
  type Project,
} from '@moge/types';

import MogeFormDialog, { type FieldConfig } from '@/app/components/MogeFormDialog';
import { MogeInput } from '@/app/components/MogeInput';
import { MogeTextarea } from '@/app/components/MogeTextarea';
import { MogeFormSelect } from '@/app/components/MogeFormSelect';
import { Button } from '@/components/ui/button';

interface ProjectDialogProps {
  mode: 'create' | 'edit';
  item?: Project;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit?: (values: CreateProjectValues | UpdateProjectValues) => Promise<void>;
}

type FormValues = CreateProjectValues | UpdateProjectValues;

// 项目类型选项
const projectTypeOptions = [
  { value: '玄幻', label: '玄幻' },
  { value: '仙侠', label: '仙侠' },
  { value: '都市', label: '都市' },
  { value: '历史', label: '历史' },
  { value: '科幻', label: '科幻' },
  { value: '武侠', label: '武侠' },
  { value: '军事', label: '军事' },
  { value: '游戏', label: '游戏' },
  { value: '竞技', label: '竞技' },
  { value: '悬疑', label: '悬疑' },
  { value: '轻小说', label: '轻小说' },
  { value: '短篇', label: '短篇' },
  { value: '其他', label: '其他' },
];

/**
 * 小说项目创建/编辑对话框组件
 * 提供项目的基本信息编辑功能，包括名称、类型和描述
 *
 * @param mode 对话框模式，'create' 创建模式或 'edit' 编辑模式
 * @param item 编辑模式下的项目数据
 * @param trigger 触发对话框的自定义元素
 * @param open 对话框是否打开（受控模式）
 * @param onOpenChange 对话框打开状态变化回调
 * @param onSubmit 表单提交回调函数
 */
export default function ProjectDialog({
  mode,
  item,
  trigger,
  open,
  onOpenChange,
  onSubmit,
}: ProjectDialogProps) {
  const isEditMode = mode === 'edit';

  // 字段配置
  const fields = useMemo<FieldConfig<FormValues>[]>(
    () => [
      { name: 'name', label: '项目名称', required: true },
      { name: 'type', label: '项目类型', required: true },
      { name: 'description', label: '项目描述' },
    ],
    []
  );

  /**
   * 渲染表单控件
   * 根据字段名称返回对应的输入组件
   *
   * @param field 表单字段控制器属性
   * @param name 字段名称
   * @returns 对应的表单控件JSX元素
   */
  const renderControl = useCallback(
    (
      field: ControllerRenderProps<FormValues, FieldPath<FormValues>>,
      name: FieldPath<FormValues>
    ) => {
      if (name === 'type') {
        return (
          <MogeFormSelect
            value={field.value as string}
            onChange={field.onChange}
            onBlur={field.onBlur}
            placeholder="请选择项目类型"
            options={projectTypeOptions}
            disabled={field.disabled}
          />
        );
      }

      if (name === 'description') {
        return (
          <MogeTextarea
            placeholder="简要描述您的小说项目（可选）"
            value={(field.value as string) || ''}
            onChange={(e) => field.onChange(e.target.value)}
            onBlur={field.onBlur}
            name={field.name}
            disabled={field.disabled}
            rows={3}
          />
        );
      }

      return (
        <MogeInput
          placeholder={name === 'name' ? '输入项目名称，如"仙侠传说"' : ''}
          value={(field.value as string) || ''}
          onChange={(e) => field.onChange(e.target.value)}
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
   * @param values 表单数据
   */
  const handleSubmit = useCallback(
    async (values: FormValues) => {
      if (onSubmit) {
        await onSubmit(values);
      }
    },
    [onSubmit]
  );

  return (
    <MogeFormDialog<FormValues>
      mode={mode}
      title={isEditMode ? '编辑小说项目' : '创建小说项目'}
      description={isEditMode ? '修改项目信息' : '创建一个新的小说项目，开始构建您的设定集'}
      createSchema={createProjectSchema}
      updateSchema={updateProjectSchema}
      fields={fields}
      renderControl={renderControl}
      onSubmit={handleSubmit}
      item={item as FormValues}
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
      defaultTrigger={
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          创建小说项目
        </Button>
      }
      maxWidth="lg"
      submitText={isEditMode ? '保存' : '创建'}
    />
  );
}
