'use client';
import { type ControllerRenderProps, type FieldPath, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FilePlus } from 'lucide-react';
import HookForm from '@/app/components/HookForm';
import type { CreateOutlineValues } from '@moge/types';
import { createOutlineSchema } from '@moge/types';
import { useOutlineStore } from '@/stores/outline.store';
import { toast } from 'sonner';
import { useState } from 'react';

type RenderControl = (
  field: ControllerRenderProps<CreateOutlineValues, FieldPath<CreateOutlineValues>>,
  name: FieldPath<CreateOutlineValues>
) => React.ReactNode;

export default function CreateOutlineDialog() {
  const [open, setOpen] = useState(false);
  const { createOutline, loading, resetError } = useOutlineStore();

  const form = useForm<CreateOutlineValues>({
    resolver: zodResolver(createOutlineSchema),
    defaultValues: { name: '', type: '', era: '', conflict: '', tags: [], remark: '' },
  });

  const renderControl: RenderControl = (field, name) => {
    if (name === 'type') {
      return (
        <Select onValueChange={field.onChange} value={field.value as string}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="请选择" />
          </SelectTrigger>
          <SelectContent>
            {['科幻', '奇幻', '悬疑', '言情', '历史'].map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (name === 'conflict' || name === 'remark') {
      return (
        <textarea
          rows={name === 'conflict' ? 3 : 2}
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring col-span-3 flex min-h-[60px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={
            name === 'conflict' ? '例：一颗会说话的核弹要求主角 24 小时内帮它自杀……' : '备忘信息'
          }
          {...field}
        />
      );
    }

    return (
      <input
        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring col-span-3 flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        placeholder={name === 'era' ? '例：近未来 2150 年' : '会说话的核弹'}
        {...field}
      />
    );
  };

  const onSubmit = async (values: CreateOutlineValues) => {
    toast.dismiss();
    resetError();
    try {
      await createOutline(values);
      toast.success('大纲创建成功');
      setOpen(false);
      form.reset();
    } catch {
      toast.error('创建大纲失败');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-[var(--moge-glow-btn)]">
          <FilePlus className="h-4 w-4" />
          新增大纲
        </Button>
      </DialogTrigger>

      <DialogContent
        className="home-area w-full max-w-2xl border backdrop-blur-xl"
        style={{
          backgroundColor: 'var(--moge-dialog-bg)',
          borderColor: 'var(--moge-dialog-border)',
          color: 'var(--moge-text-main)',
        }}
      >
        <DialogHeader>
          <DialogTitle>新建大纲</DialogTitle>
          <DialogDescription style={{ color: 'var(--moge-text-sub)' }}>
            填写信息后点击创建即可生成大纲
          </DialogDescription>
        </DialogHeader>

        <HookForm
          form={form}
          fields={[
            { name: 'name', label: '小说名称', required: true },
            { name: 'type', label: '小说类型', required: true },
            { name: 'era', label: '故事时代' },
            { name: 'conflict', label: '核心冲突' },
            { name: 'remark', label: '备注' },
          ]}
          loading={loading}
          submitText="确认"
          cancelText="取消"
          onCancel={() => {
            setOpen(false);
          }}
          renderControl={renderControl}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
