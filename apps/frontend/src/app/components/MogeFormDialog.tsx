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

// 静态默认值，避免每次渲染创建新对象
const EMPTY_DEFAULT_VALUES = {};

// 类型帮助器
export type FormFieldConfig<T extends FieldValues> = {
  name: FieldPath<T>;
  label: string;
  required?: boolean;
  section?: string; // 分组标题
};

// 字段配置接口 - 使用与 HookForm 相同的定义
export interface FieldConfig<T extends FieldValues = FieldValues> {
  name: FieldPath<T>;
  label: string;
  required?: boolean;
  section?: string; // 分组标题
}

// 自定义内容节接口
export interface CustomSection {
  title?: string;
  content: ReactNode;
}

// MogeFormDialog属性接口
export interface MogeFormDialogProps<T extends FieldValues> {
  // 基础属性
  mode: 'create' | 'edit';
  title: string;
  description: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;

  // 表单相关
  createSchema: ZodSchema<T>;
  updateSchema: ZodSchema<T>;
  defaultValues?: Partial<T>;
  onSubmit: (values: T) => Promise<void>;

  // 字段配置 - 使用与 HookForm 相同的类型
  fields: FormFieldConfig<T>[];
  renderControl: (field: ControllerRenderProps<T, FieldPath<T>>, name: FieldPath<T>) => ReactNode;

  // 自定义内容
  customSections?: CustomSection[];

  // 按钮配置
  submitText?: string;
  cancelText?: string;
  defaultTrigger?: ReactNode;

  // 样式配置
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';

  // 数据
  item?: T; // 编辑时的数据

  // 生命周期回调
  onOpen?: () => void;
  onClose?: () => void;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
};

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
      console.log('🚀 ~ MogeFormDialog.tsx:165 ~ handleSubmit ~ error:', error);
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
