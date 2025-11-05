/**
 * 编辑卷对话框组件
 *
 * 功能:
 * - 编辑卷的标题和描述
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
import { MogeTextarea } from '@/app/components/MogeTextarea';

interface EditVolumeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  volumeTitle: string;
  volumeDescription?: string;
  onConfirm: (data: { title: string; description?: string }) => Promise<void>;
}

/**
 * 编辑卷的对话框
 */
export default function EditVolumeDialog({
  open,
  onOpenChange,
  volumeTitle,
  volumeDescription,
  onConfirm,
}: EditVolumeDialogProps) {
  const [title, setTitle] = useState(volumeTitle);
  const [description, setDescription] = useState(volumeDescription || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 当对话框打开时，更新表单数据
  useEffect(() => {
    if (open) {
      setTitle(volumeTitle);
      setDescription(volumeDescription || '');
    }
  }, [open, volumeTitle, volumeDescription]);

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
          <DialogTitle>编辑卷</DialogTitle>
          <DialogDescription>修改卷的标题和描述</DialogDescription>
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
              placeholder="例如：第一卷 初入江湖"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSubmit();
                }
              }}
            />
          </div>

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
