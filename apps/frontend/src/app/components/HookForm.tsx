// src/components/HookForm.tsx
'use client';
import { Form, FormField } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import type { FieldValues, UseFormReturn, FieldPath, ControllerRenderProps } from 'react-hook-form';

type FieldDef<T extends FieldValues> = {
  name: FieldPath<T>;
  label: string;
};

type HookFormProps<T extends FieldValues> = {
  form: UseFormReturn<T>;
  fields: FieldDef<T>[];
  loading?: boolean;
  submitText?: string;
  renderControl: (
    field: ControllerRenderProps<T, FieldPath<T>>,
    name: FieldPath<T>
  ) => React.ReactNode;
  onSubmit: (values: T) => void;
};

export default function HookForm<T extends FieldValues>({
  form,
  fields,
  loading,
  submitText = '提交',
  renderControl,
  onSubmit,
}: HookFormProps<T>) {
  return (
    <Form {...form}>
      <form onSubmit={void form.handleSubmit(onSubmit)} className="space-y-4">
        {fields.map((f) => (
          <FormField
            key={f.name}
            control={form.control}
            name={f.name}
            render={({ field }) => (
              <div>
                <label className="block text-sm" style={{ color: 'var(--moge-text-sub)' }}>
                  {f.label}
                </label>
                {renderControl(field, f.name)}
                {form.formState.errors[f.name] && (
                  <p className="mt-1 text-xs text-red-400">
                    {(form.formState.errors[f.name]?.message as string | undefined) || ''}
                  </p>
                )}
              </div>
            )}
          />
        ))}

        <Button
          type="submit"
          disabled={loading}
          className="from-moge-primary-400 to-moge-primary-500 h-10 w-full bg-gradient-to-r text-base text-white/90 shadow-lg transition-all duration-300 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            boxShadow: `0 10px 25px -5px var(--moge-glow-btn-color, rgba(56,189,248,.32)), 0 8px 10px -6px var(--moge-glow-btn-color, rgba(56,189,248,.22))`,
          }}
        >
          {loading ? `${submitText}中...` : submitText}
        </Button>
      </form>
    </Form>
  );
}
