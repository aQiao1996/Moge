import * as React from 'react';
import {
  Select as OriginalSelect,
  SelectTrigger as OriginalSelectTrigger,
  SelectValue as OriginalSelectValue,
  SelectContent as OriginalSelectContent,
  SelectItem as OriginalSelectItem,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useOptionalFormFieldIdentifiers } from '@/components/ui/form';

interface MogeSelectContextValue {
  triggerId?: string;
  triggerAriaDescribedBy?: string;
  triggerAriaInvalid?: boolean | 'true' | 'false';
}

const MogeSelectContext = React.createContext<MogeSelectContextValue | null>(null);

type MogeSelectProps = React.ComponentPropsWithoutRef<typeof OriginalSelect> & {
  id?: string;
  name?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'true' | 'false';
};

/**
 * Moge 定制 Select 触发器
 * 封装了原始的 SelectTrigger,并应用了项目统一的输入框样式。
 */
const MogeSelectTrigger = React.forwardRef<
  React.ComponentRef<typeof OriginalSelectTrigger>,
  React.ComponentPropsWithoutRef<typeof OriginalSelectTrigger>
>(
  (
    {
      className,
      children,
      id,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
      ...props
    },
    ref
  ) => {
    const context = React.useContext(MogeSelectContext);

    return (
      <OriginalSelectTrigger
        ref={ref}
        id={id ?? context?.triggerId}
        aria-describedby={ariaDescribedBy ?? context?.triggerAriaDescribedBy}
        aria-invalid={ariaInvalid ?? context?.triggerAriaInvalid}
        className={cn(
          'input-moge flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--moge-input-ring)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </OriginalSelectTrigger>
    );
  }
);

const MogeSelect = ({
  value,
  children,
  id,
  name,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: MogeSelectProps) => {
  const fieldIdentifiers = useOptionalFormFieldIdentifiers();
  const resolvedId = id ?? fieldIdentifiers?.formItemId;
  const resolvedName = name ?? fieldIdentifiers?.name;

  return (
    <MogeSelectContext.Provider
      value={{
        triggerId: resolvedId,
        triggerAriaDescribedBy: ariaDescribedBy,
        triggerAriaInvalid: ariaInvalid,
      }}
    >
      <OriginalSelect value={value ?? ''} name={resolvedName} {...props}>
        {children}
      </OriginalSelect>
    </MogeSelectContext.Provider>
  );
};
const MogeSelectValue = OriginalSelectValue;
const MogeSelectContent = OriginalSelectContent;
const MogeSelectItem = OriginalSelectItem;

export { MogeSelect, MogeSelectTrigger, MogeSelectValue, MogeSelectContent, MogeSelectItem };
