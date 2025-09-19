import * as React from 'react';
import {
  Select as OriginalSelect,
  SelectTrigger as OriginalSelectTrigger,
  SelectValue as OriginalSelectValue,
  SelectContent as OriginalSelectContent,
  SelectItem as OriginalSelectItem,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const MogeSelectTrigger = React.forwardRef<
  React.ComponentRef<typeof OriginalSelectTrigger>,
  React.ComponentPropsWithoutRef<typeof OriginalSelectTrigger>
>(({ className, children, ...props }, ref) => (
  <OriginalSelectTrigger
    ref={ref}
    className={cn(
      'input-moge flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--moge-input-ring)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  >
    {children}
  </OriginalSelectTrigger>
));

const MogeSelect = OriginalSelect;
const MogeSelectValue = OriginalSelectValue;
const MogeSelectContent = OriginalSelectContent;
const MogeSelectItem = OriginalSelectItem;

export { MogeSelect, MogeSelectTrigger, MogeSelectValue, MogeSelectContent, MogeSelectItem };
