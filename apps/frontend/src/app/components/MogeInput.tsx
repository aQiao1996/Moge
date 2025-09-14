import * as React from 'react';
import { Input, type InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const MogeInput = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <Input
      className={cn(
        'input-moge w-full rounded-md border px-3 py-2 text-white placeholder-white/40 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[var(--moge-input-ring)]',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
MogeInput.displayName = 'MogeInput';

export { MogeInput };
