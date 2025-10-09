'use client';

import * as React from 'react';
import { Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

/**
 * 多选下拉组件的选项接口
 */
interface MultiSelectOption {
  value: string; // 选项的实际值
  label: string; // 选项的显示文本
  description?: string; // 选项的描述信息
}

/**
 * 多选下拉组件的属性接口
 */
interface MogeMultiSelectProps {
  options: MultiSelectOption[]; // 可选项列表
  value?: string[]; // 当前选中的值数组
  onChange?: (value: string[]) => void; // 值变化时的回调函数
  onBlur?: () => void; // 失去焦点时的回调函数
  placeholder?: string; // 占位符文本
  disabled?: boolean; // 是否禁用
  className?: string; // 额外的CSS类名
  maxDisplay?: number; // 最多显示的选中项数量,超出部分会以 "+N" 形式显示
  loading?: boolean; // 是否处于加载状态
  emptyMessage?: string; // 选项为空时的提示信息
}

/**
 * 多选下拉组件
 * 支持多选、搜索过滤、自定义显示数量等功能,专为表单设计。
 */
const MogeMultiSelect = React.forwardRef<HTMLButtonElement, MogeMultiSelectProps>(
  (
    {
      options,
      value = [],
      onChange,
      onBlur,
      placeholder = '请选择',
      disabled = false,
      className = '',
      maxDisplay = 2,
      loading = false,
      emptyMessage = '暂无数据',
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');

    /**
     * 处理选项选择
     * @param optionValue 选项值
     */
    const handleSelect = React.useCallback(
      (optionValue: string) => {
        const newValue = value.includes(optionValue)
          ? value.filter((v) => v !== optionValue)
          : [...value, optionValue];
        onChange?.(newValue);
      },
      [value, onChange]
    );

    /**
     * 移除选中项
     * @param optionValue 要移除的选项值
     */
    const handleRemove = React.useCallback(
      (optionValue: string) => {
        const newValue = value.filter((v) => v !== optionValue);
        onChange?.(newValue);
      },
      [value, onChange]
    );

    /**
     * 清除所有选中项
     */
    const handleClear = React.useCallback(() => {
      onChange?.([]);
    }, [onChange]);

    // 过滤后的选项
    const filteredOptions = React.useMemo(() => {
      if (!searchQuery) return options;
      return options.filter(
        (option) =>
          option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (option.description &&
            option.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }, [options, searchQuery]);

    // 选中的选项
    const selectedOptions = React.useMemo(() => {
      return options.filter((option) => value.includes(option.value));
    }, [options, value]);

    // 显示的选中项
    const displayItems = React.useMemo(() => {
      if (selectedOptions.length <= maxDisplay) {
        return selectedOptions;
      }
      return selectedOptions.slice(0, maxDisplay);
    }, [selectedOptions, maxDisplay]);

    // 剩余项目数量
    const remainingCount = React.useMemo(() => {
      return Math.max(0, selectedOptions.length - maxDisplay);
    }, [selectedOptions.length, maxDisplay]);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={`input-moge w-full justify-start text-left font-normal ${className}`}
            disabled={disabled}
            onBlur={onBlur}
          >
            <div className="flex min-h-[1.25rem] w-full flex-wrap items-center gap-1">
              {selectedOptions.length === 0 ? (
                <span className="text-[var(--moge-text-muted)]">{placeholder}</span>
              ) : (
                <>
                  {displayItems.map((option) => (
                    <Badge
                      key={option.value}
                      variant="secondary"
                      className="flex items-center gap-1 text-xs"
                    >
                      {option.label}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(option.value);
                        }}
                      />
                    </Badge>
                  ))}
                  {remainingCount > 0 && (
                    <Badge variant="outline" className="text-xs">
                      +{remainingCount}
                    </Badge>
                  )}
                </>
              )}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <div className="flex items-center border-b px-3">
            <input
              placeholder="搜索..."
              className="placeholder:text-muted-foreground flex h-10 w-full bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {selectedOptions.length > 0 && (
              <>
                <Separator orientation="vertical" className="mx-2 h-4" />
                <Button variant="ghost" onClick={handleClear} className="h-auto px-2 py-1 text-xs">
                  清除
                </Button>
              </>
            )}
          </div>
          <div className="max-h-60 overflow-auto p-1">
            {loading ? (
              <div className="text-muted-foreground py-6 text-center text-sm">加载中...</div>
            ) : filteredOptions.length === 0 ? (
              <div className="text-muted-foreground py-6 text-center text-sm">
                {searchQuery ? '未找到匹配项' : emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <div
                    key={option.value}
                    className="hover:bg-accent hover:text-accent-foreground relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    onClick={() => handleSelect(option.value)}
                  >
                    <div className="flex flex-1 items-center space-x-2">
                      <div className="flex h-4 w-4 items-center justify-center">
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        {option.description && (
                          <span className="text-muted-foreground text-xs">
                            {option.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);

MogeMultiSelect.displayName = 'MogeMultiSelect';

export { MogeMultiSelect };
export type { MultiSelectOption };
