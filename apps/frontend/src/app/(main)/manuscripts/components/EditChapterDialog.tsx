/**
 * 编辑章节对话框组件
 *
 * 功能:
 * - 编辑章节的标题
 */
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

interface EditChapterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chapterTitle: string;
  onConfirm: (data: { title: string }) => Promise<void>;
}

/**
 * 编辑章节的对话框
 */
export default function EditChapterDialog({
  open,
  onOpenChange,
  chapterTitle,
  onConfirm,
}: EditChapterDialogProps) {
  const [title, setTitle] = useState(chapterTitle);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 当对话框打开时，更新表单数据
  useEffect(() => {
    if (open) {
      setTitle(chapterTitle);
    }
  }, [open, chapterTitle]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm({
        title: title.trim(),
      });

      onOpenChange(false);
    } catch (error) {
      console.error('编辑失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>编辑章节</DialogTitle>
          <DialogDescription>修改章节的标题</DialogDescription>
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
              placeholder="例如：第一章 离家"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSubmit();
                }
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            取消
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={!title.trim() || isSubmitting}>
            {isSubmitting ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
