'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MogeInput } from '@/app/components/MogeInput';
import { MogeTextarea } from '@/app/components/MogeTextarea';

interface CreateItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'volume' | 'chapter';
  onConfirm: (data: { title: string; description?: string }) => Promise<void>;
  /** 当前已有的卷数量，用于自动生成序号 */
  volumeCount?: number;
  /** 当前卷内已有的章节数量，用于自动生成序号 */
  chapterCount?: number;
}

// 数字转中文
const numberToChinese = (num: number): string => {
  const chineseNumbers = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  if (num <= 10) return chineseNumbers[num];
  if (num < 20) return `十${chineseNumbers[num - 10]}`;
  const tens = Math.floor(num / 10);
  const ones = num % 10;
  return `${chineseNumbers[tens]}十${ones > 0 ? chineseNumbers[ones] : ''}`;
};

/**
 * 创建卷/章节的通用 Dialog
 */
export default function CreateItemDialog({
  open,
  onOpenChange,
  type,
  onConfirm,
  volumeCount = 0,
  chapterCount = 0,
}: CreateItemDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 当 Dialog 打开时，自动生成默认标题
  useEffect(() => {
    if (open) {
      if (type === 'volume') {
        const nextNumber = volumeCount + 1;
        setTitle(`第${numberToChinese(nextNumber)}卷 `);
      } else {
        const nextNumber = chapterCount + 1;
        setTitle(`第${numberToChinese(nextNumber)}章 `);
      }
    }
  }, [open, type, volumeCount, chapterCount]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm({
        title: title.trim(),
        description: description.trim() || undefined,
      });

      // 成功后关闭并重置
      setTitle('');
      setDescription('');
      onOpenChange(false);
    } catch (error) {
      console.error('创建失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setTitle('');
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{type === 'volume' ? '新建卷' : '新建章节'}</DialogTitle>
          <DialogDescription>
            {type === 'volume' ? '请输入卷的标题和描述（描述可选）' : '请输入章节标题'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              标题 <span className="text-destructive">*</span>
            </label>
            <MogeInput
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'volume' ? '例如：第一卷 初入江湖' : '例如：第一章 离家'}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSubmit();
                }
              }}
            />
          </div>

          {type === 'volume' && (
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                描述（可选）
              </label>
              <MogeTextarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="例如：主角初入江湖，结识良师益友..."
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            取消
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={!title.trim() || isSubmitting}>
            {isSubmitting ? '创建中...' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
