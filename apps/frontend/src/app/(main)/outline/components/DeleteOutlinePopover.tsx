'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useOutlineStore } from '@/stores/outlineStore';
import type { Outline } from '@moge/types';

interface DeleteOutlinePopoverProps {
  outline: Outline;
}

export default function DeleteOutlinePopover({ outline }: DeleteOutlinePopoverProps) {
  const { deleteOutline } = useOutlineStore();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    if (!outline.id) return;

    try {
      setLoading(true);
      await deleteOutline(outline.id);
      toast.success('删除成功');
      setOpen(false);
    } catch (error) {
      toast.error('删除失败');
      console.error('Delete outline error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost" title="删除">
          <Trash2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-destructive/10 flex h-10 w-10 items-center justify-center rounded-full">
              <AlertTriangle className="text-destructive h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold">确认删除</h4>
              <p className="text-muted-foreground text-sm">
                此操作无法撤销，确定要删除大纲「{outline.name}」吗？
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={loading}>
              取消
            </Button>
            <Button variant="destructive" size="sm" onClick={void handleDelete} disabled={loading}>
              {loading ? '删除中...' : '确认删除'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
