'use client';
import { useEffect, useState, ReactNode } from 'react';
import { toast } from 'sonner';
import {
  useForm,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
  type UseFormReturn,
  type DefaultValues,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodSchema } from 'zod';

import HookForm from '@/app/components/HookForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * 静态默认值常量
 * 避免每次渲染创建新对象导致不必要的重渲染
 */
const EMPTY_DEFAULT_VALUES = {};

/**
 * 表单字段配置类型
 * 定义表单字段的基本属性
 */
export type FormFieldConfig<T extends FieldValues> = {
  name: FieldPath<T>; // 字段名称
  label: string; // 字段标签
  required?: boolean; // 是否必填
  section?: string; // 分组标题
};

/**
 * 字段配置接口
 * 使用与 HookForm 相同的定义确保类型一致性
 */
export interface FieldConfig<T extends FieldValues = FieldValues> {
  name: FieldPath<T>; // 字段名称
  label: string; // 字段标签
  required?: boolean; // 是否必填
  section?: string; // 分组标题
}

/**
 * 自定义内容节接口
 * 用于在表单中插入自定义内容区域
 */
export interface CustomSection {
  title?: string; // 节标题
  content: ReactNode; // 节内容
}

/**
 * MogeFormDialog组件的属性接口
 * @template T - 表单数据类型
 */
export interface MogeFormDialogProps<T extends FieldValues> {
  // 基础属性
  mode: 'create' | 'edit'; // 表单模式: 'create' 或 'edit'
  title: string; // 对话框标题
  description: string; // 对话框描述
  open?: boolean; // 受控模式下的打开状态
  onOpenChange?: (open: boolean) => void; // 受控模式下的状态变更回调
  trigger?: React.ReactNode; // 触发对话框的自定义元素

  // 表单相关
  createSchema: ZodSchema<T>; // 创建模式下的Zod校验schema
  updateSchema: ZodSchema<T>; // 编辑模式下的Zod校验schema
  defaultValues?: Partial<T>; // 表单的默认值
  onSubmit: (values: T) => Promise<void>; // 表单提交回调
  formRef?: React.MutableRefObject<UseFormReturn<T> | null>; // 表单实例引用,允许父组件访问表单方法

  // 字段配置
  fields: FormFieldConfig<T>[]; // 表单字段配置数组
  renderControl: (field: ControllerRenderProps<T, FieldPath<T>>, name: FieldPath<T>) => ReactNode; // 自定义表单控件渲染函数

  // 自定义内容
  customSections?: CustomSection[]; // 在表单中插入的自定义内容区域

  // 按钮配置
  submitText?: string; // 提交按钮文本
  cancelText?: string; // 取消按钮文本
  defaultTrigger?: ReactNode; // 默认的触发器元素

  // 样式配置
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl'; // 对话框最大宽度

  // 数据
  item?: T; // 编辑模式下的初始数据

  // 生命周期回调
  onOpen?: () => void; // 对话框打开时的回调
  onClose?: () => void; // 对话框关闭时的回调
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
};

/**
 * 通用表单对话框组件
 * 封装了创建和编辑两种模式,集成了Zod校验、异步提交和自定义字段渲染。
 * @template T - 表单数据类型
 */
export default function MogeFormDialog<T extends FieldValues>({
  mode,
  title,
  description,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
  createSchema,
  updateSchema,
  defaultValues = EMPTY_DEFAULT_VALUES,
  onSubmit,
  fields,
  renderControl,
  customSections = [],
  submitText,
  cancelText = '取消',
  defaultTrigger,
  maxWidth = '2xl',
  item,
  onOpen,
  onClose,
  formRef,
}: MogeFormDialogProps<T>) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen;

  const isEditMode = mode === 'edit';
  const schema = isEditMode ? updateSchema : createSchema;

  const form = useForm({
    resolver: zodResolver(
      schema as unknown as Parameters<typeof zodResolver>[0]
    ) as unknown as ReturnType<typeof zodResolver>,
    defaultValues: defaultValues as unknown as DefaultValues<T>,
  }) as UseFormReturn<T>;

  // 将 form 实例暴露给父组件
  useEffect(() => {
    if (formRef) {
      formRef.current = form;
    }
  }, [form, formRef]);

  // 处理打开/关闭事件
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && onOpen) {
      onOpen();
    } else if (!newOpen && onClose) {
      onClose();
    }
  };

  useEffect(() => {
    if (open) {
      if (isEditMode && item) {
        form.reset(item as unknown as T);
      } else if (!isEditMode) {
        form.reset(defaultValues as unknown as T);
      }
    }
  }, [open, isEditMode, item, defaultValues, form]);

  const handleSubmit = async (values: T) => {
    toast.dismiss();
    setSubmitting(true);
    try {
      await onSubmit(values);
      setOpen(false);
    } catch (error) {
      console.log('🚀 ~ MogeFormDialog.tsx:185 ~ handleSubmit ~ error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const dialogContent = (
    <DialogContent
      className={`home-area max-h-[90vh] w-full ${maxWidthClasses[maxWidth]} overflow-y-auto border backdrop-blur-xl`}
      style={{
        backgroundColor: 'var(--moge-dialog-bg)',
        borderColor: 'var(--moge-dialog-border)',
        color: 'var(--moge-text-main)',
      }}
    >
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription style={{ color: 'var(--moge-text-sub)' }}>
          {description}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {/* 基础表单字段 */}
        <HookForm<T>
          form={form}
          fields={fields}
          loading={false}
          renderControl={renderControl}
          onSubmit={handleSubmit}
          renderSubmitButton={() => null}
        />

        {/* 自定义内容节 */}
        {customSections.map((section, index) => (
          <div key={index}>
            {section.title && (
              <h3 className="mb-4 text-lg font-medium text-[var(--moge-text-main)]">
                {section.title}
              </h3>
            )}
            {section.content}
          </div>
        ))}

        {/* 提交按钮 */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={() => void form.handleSubmit(handleSubmit)()}
            disabled={submitting}
            className="shadow-[var(--moge-glow-btn)]"
          >
            {submitting ? '处理中...' : submitText || (isEditMode ? '保存' : '创建')}
          </Button>
        </div>
      </div>
    </DialogContent>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isControlled && <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>}
      {dialogContent}
    </Dialog>
  );
}
