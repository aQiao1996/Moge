'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertTriangle } from 'lucide-react';

/**
 * 确认气泡组件属性接口
 */
interface MogeConfirmPopoverProps {
  /** 触发器，可以自定义 */
  trigger: React.ReactNode;
  /** 确认操作的标题 */
  title: string;
  /** 确认操作的描述信息 */
  description: string;
  /** 确认按钮文本 */
  confirmText?: string;
  /** 取消按钮文本 */
  cancelText?: string;
  /** 操作中状态文本 */
  loadingText?: string;
  /** 确认按钮样式变体 */
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  /** 确认操作函数 */
  onConfirm: () => Promise<void> | void;
  /** 是否禁用操作 */
  disabled?: boolean;
  /** 图标，默认为警告图标 */
  icon?: React.ReactNode;
  /** 图标背景颜色 */
  iconBgColor?: string;
  /** 图标文字颜色 */
  iconTextColor?: string;
}

/**
 * 确认气泡组件
 * 提供危险操作的二次确认气泡提示,支持异步操作和自定义样式
 * @param {MogeConfirmPopoverProps} props - 组件属性
 */
export default function MogeConfirmPopover({
  trigger,
  title,
  description,
  confirmText = '确认',
  cancelText = '取消',
  loadingText = '处理中...',
  confirmVariant = 'destructive',
  onConfirm,
  disabled = false,
  icon,
  iconBgColor = 'bg-destructive/10',
  iconTextColor = 'text-destructive',
}: MogeConfirmPopoverProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  /**
   * 处理确认操作
   * 执行异步确认操作,成功后关闭气泡
   */
  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      setOpen(false);
    } catch (error) {
      console.error('确认操作错误:', error);
      throw error; // 让调用者处理错误
    } finally {
      setLoading(false);
    }
  };

  const defaultIcon = <AlertTriangle className={`h-5 w-5 ${iconTextColor}`} />;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div
              className={`${iconBgColor} flex h-10 w-10 items-center justify-center rounded-full`}
            >
              {icon || defaultIcon}
            </div>
            <div>
              <h4 className="font-semibold">{title}</h4>
              <p className="text-muted-foreground text-sm">{description}</p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={loading}>
              {cancelText}
            </Button>
            <Button
              variant={confirmVariant}
              size="sm"
              onClick={() => void handleConfirm()}
              disabled={loading}
            >
              {loading ? loadingText : confirmText}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
