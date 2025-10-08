'use client';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { FieldValues, UseFormReturn, FieldPath, ControllerRenderProps } from 'react-hook-form';
import type { FormEvent } from 'react';

/**
 * 表单字段定义接口
 * @template T - 表单数据类型
 */
interface FieldDef<T extends FieldValues> {
  name: FieldPath<T>;
  label: string;
  required?: boolean;
}

/**
 * 隐藏字段接口
 * 用于浏览器自动填充功能的隐藏字段
 */
interface HiddenField {
  name: string;
  value: string;
  autoComplete: string;
}

/**
 * HookForm组件属性接口
 * @template T - 表单数据类型
 */
interface HookFormProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  fields: FieldDef<T>[];
  loading?: boolean;
  submitText?: string;
  cancelText?: string;
  onCancel?: () => void;
  renderControl: (
    field: ControllerRenderProps<T, FieldPath<T>>,
    name: FieldPath<T>
  ) => React.ReactNode;
  onSubmit: (values: T) => Promise<void> | void;
  submitButtonClassName?: string;
  hiddenFields?: HiddenField[];
  renderSubmitButton?: (props: { loading?: boolean }) => React.ReactNode;
}

/**
 * 通用表单组件
 * 基于react-hook-form的封装组件,提供统一的表单样式和交互
 * @template T - 表单数据类型
 * @param {HookFormProps<T>} props - 组件属性
 * @param {UseFormReturn<T>} props.form - react-hook-form实例
 * @param {FieldDef<T>[]} props.fields - 表单字段定义数组
 * @param {boolean} props.loading - 提交加载状态
 * @param {string} props.submitText - 提交按钮文本,默认"提交"
 * @param {string} props.cancelText - 取消按钮文本,不传则不显示取消按钮
 * @param {Function} props.onCancel - 取消按钮点击回调
 * @param {Function} props.renderControl - 自定义表单控件渲染函数
 * @param {Function} props.onSubmit - 表单提交回调
 * @param {string} props.submitButtonClassName - 提交按钮额外样式类名
 * @param {HiddenField[]} props.hiddenFields - 隐藏字段数组,用于浏览器自动填充
 * @param {Function} props.renderSubmitButton - 自定义提交按钮渲染函数
 */
export default function HookForm<T extends FieldValues>({
  form,
  fields,
  loading,
  submitText = '提交',
  cancelText,
  onCancel,
  renderControl,
  onSubmit,
  submitButtonClassName,
  hiddenFields,
  renderSubmitButton,
}: HookFormProps<T>) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit) as (e: FormEvent) => void} className="space-y-4">
        {/* 隐藏字段,用于浏览器自动填充功能 */}
        {hiddenFields?.map((hf) => (
          <Input
            key={hf.name}
            type="text"
            style={{ display: 'none' }}
            name={hf.name}
            autoComplete={hf.autoComplete}
            defaultValue={hf.value}
            readOnly
          />
        ))}
        {fields.map((f) => (
          <FormField
            key={f.name}
            control={form.control}
            name={f.name}
            render={({ field }) => (
              <FormItem>
                <FormLabel
                  className={`mb-1 block text-sm ${f.required ? 'label-required' : ''}`}
                  style={{ color: 'var(--moge-text-sub)' }}
                >
                  {f.label}
                </FormLabel>
                <FormControl>{renderControl(field, f.name)}</FormControl>
                <FormMessage className="mt-1 text-xs text-red-400" />
              </FormItem>
            )}
          />
        ))}

        {/* 底部按钮区 */}
        <div className="flex justify-end gap-2 pt-2">
          {cancelText && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              className="hover:brightness-95"
            >
              {cancelText}
            </Button>
          )}
          {renderSubmitButton ? (
            renderSubmitButton({ loading })
          ) : (
            <Button
              type="submit"
              disabled={loading}
              className={`gap-2 shadow-[var(--moge-glow-btn)] ${submitButtonClassName}`}
            >
              {loading ? `${submitText}中...` : submitText}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
