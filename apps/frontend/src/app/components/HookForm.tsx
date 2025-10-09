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
  name: FieldPath<T>; // 字段名称,对应react-hook-form的字段路径
  label: string; // 字段标签,用于显示在表单上
  required?: boolean; // 是否为必填字段
}

/**
 * 隐藏字段接口
 * 用于浏览器自动填充功能的隐藏字段
 */
interface HiddenField {
  name: string; // 隐藏字段的名称
  value: string; // 隐藏字段的值
  autoComplete: string; // 浏览器的自动填充类型,如 "username" 或 "current-password"
}

/**
 * HookForm组件属性接口
 * @template T - 表单数据类型
 */
interface HookFormProps<T extends FieldValues> {
  form: UseFormReturn<T>; // react-hook-form的实例,通过useForm()获取
  fields: FieldDef<T>[]; // 表单字段定义数组
  loading?: boolean; // 是否处于加载状态,用于禁用提交按钮
  submitText?: string; // 提交按钮的文本,默认为 "提交"
  cancelText?: string; // 取消按钮的文本,如果未提供,则不显示取消按钮
  onCancel?: () => void; // 取消按钮的点击事件处理函数
  renderControl: (
    // 自定义渲染表单控件的函数
    field: ControllerRenderProps<T, FieldPath<T>>,
    name: FieldPath<T>
  ) => React.ReactNode;
  onSubmit: (values: T) => Promise<void> | void; // 表单提交时的回调函数
  submitButtonClassName?: string; // 提交按钮的额外CSS类名
  hiddenFields?: HiddenField[]; // 隐藏字段数组,用于支持浏览器的自动填充功能
  renderSubmitButton?: (props: { loading?: boolean }) => React.ReactNode; // 自定义渲染提交按钮的函数
}

/**
 * 通用表单组件
 * 基于react-hook-form的封装,提供统一的表单样式和交互。
 * @template T - 表单数据类型,必须是FieldValues的子类型
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
