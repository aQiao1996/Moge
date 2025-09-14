'use client';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import type { FieldValues, UseFormReturn, FieldPath, ControllerRenderProps } from 'react-hook-form';
import type { FormEvent } from 'react';

type FieldDef<T extends FieldValues> = {
  name: FieldPath<T>;
  label: string;
  required?: boolean;
};

type HiddenField = {
  name: string;
  value: string;
  autoComplete: string;
};

type HookFormProps<T extends FieldValues> = {
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
};

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
}: HookFormProps<T>) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit) as (e: FormEvent) => void} className="space-y-4">
        {hiddenFields?.map((hf) => (
          <input
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
        <div className="flex justify-end gap-2">
          {cancelText && (
            <Button
              type="button"
              onClick={onCancel}
              className="h-10 rounded-md bg-gray-400 px-4 py-2 text-base text-gray-100 shadow-[0_4px_14px_0_rgba(0,0,0,.2)] transition-all duration-300 hover:shadow-[0_6px_20px_0_rgba(0,0,0,.25)] hover:brightness-110"
            >
              {cancelText}
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading}
            className={`from-moge-primary-400 to-moge-primary-500 hover:brightness-130 h-10 rounded-md bg-gradient-to-r px-4 py-2 text-base text-white/90 shadow-lg transition-all duration-300 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 ${cancelText ? '' : 'w-full'} ${submitButtonClassName}`}
            style={{
              boxShadow: `0 10px 25px -5px var(--moge-glow-btn-color, rgba(56,189,248,.32)), 0 8px 10px -6px var(--moge-glow-btn-color, rgba(56,189,248,.22))`,
            }}
          >
            {loading ? `${submitText}中...` : submitText}
          </Button>
        </div>
      </form>
    </Form>
  );
}
