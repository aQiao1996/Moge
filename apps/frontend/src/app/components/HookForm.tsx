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

interface FieldDef<T extends FieldValues> {
  name: FieldPath<T>;
  label: string;
  required?: boolean;
}

interface HiddenField {
  name: string;
  value: string;
  autoComplete: string;
}

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
