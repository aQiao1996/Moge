import * as React from 'react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

// 选项接口
interface SelectOption {
  value: string;
  label: string;
}

// 表单专用Select组件接口
interface MogeFormSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  options: SelectOption[];
  disabled?: boolean;
  className?: string;
}

// 表单专用的Select组件
const MogeFormSelect = React.forwardRef<
  React.ComponentRef<typeof SelectTrigger>,
  MogeFormSelectProps
>(({ value, onChange, onBlur, placeholder, options, disabled, className }, ref) => {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        ref={ref}
        className={`input-moge w-full rounded-md border px-3 py-2 text-white placeholder-white/40 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[var(--moge-input-ring)] ${className || ''}`}
        onBlur={onBlur}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});

MogeFormSelect.displayName = 'MogeFormSelect';

export { MogeFormSelect };
export type { SelectOption };
