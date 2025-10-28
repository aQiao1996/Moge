'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'volume' | 'chapter';
  title: string;
  onConfirm: () => Promise<void>;
}

/**
 * 删除确认对话框
 */
export default function DeleteConfirmDialog({
  open,
  onOpenChange,
  type,
  title,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error('删除失败:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-destructive h-5 w-5" />
            <DialogTitle>确认删除</DialogTitle>
          </div>
          <DialogDescription>
            {type === 'volume' ? (
              <>
                您确定要删除卷 <span className="text-foreground font-semibold">"{title}"</span> 吗？
                <br />
                <span className="text-destructive">
                  此操作将同时删除该卷下的所有章节，且无法撤销！
                </span>
              </>
            ) : (
              <>
                您确定要删除章节 <span className="text-foreground font-semibold">"{title}"</span>{' '}
                吗？
                <br />
                <span className="text-destructive">此操作无法撤销！</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            取消
          </Button>
          <Button variant="destructive" onClick={() => void handleConfirm()} disabled={isDeleting}>
            {isDeleting ? '删除中...' : '确认删除'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
