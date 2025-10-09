import * as React from 'react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

/**
 * Select选项接口
 */
interface SelectOption {
  value: string; // 选项的实际值
  label: string; // 选项的显示文本
}

/**
 * 表单专用Select组件的属性接口
 */
interface MogeFormSelectProps {
  value?: string; // 当前选中的值
  onChange?: (value: string) => void; // 值变化时的回调函数
  onBlur?: () => void; // 失去焦点时的回调函数
  placeholder?: string; // 占位符文本
  options: SelectOption[]; // 下拉选项数组
  disabled?: boolean; // 是否禁用
  className?: string; // 额外的CSS类名
}

/**
 * 表单专用的Select组件
 * 这是一个为 `react-hook-form` 优化的封装, 通过 `React.forwardRef` 将 ref 传递给触发器,
 * 以便 `react-hook-form` 可以正确地管理其状态(如焦点)。
 */
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
