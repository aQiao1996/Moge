import * as React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export type MogeTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * Moge 定制文本域组件
 * 封装了原始的 Textarea,并应用了项目统一的输入框样式。
 */
const MogeTextarea = React.forwardRef<HTMLTextAreaElement, MogeTextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <Textarea
        className={cn(
          'input-moge w-full rounded-md border px-3 py-2 text-white placeholder-white/40 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[var(--moge-input-ring)]',
          'min-h-[60px]',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
MogeTextarea.displayName = 'MogeTextarea';

export { MogeTextarea };
