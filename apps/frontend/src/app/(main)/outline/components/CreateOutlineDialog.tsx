'use client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  MogeSelect,
  MogeSelectContent,
  MogeSelectItem,
  MogeSelectTrigger,
  MogeSelectValue,
} from '@/app/components/MogeSelect';
import { MogeTextarea } from '@/app/components/MogeTextarea';
import { MogeInput } from '@/app/components/MogeInput';
import { Button } from '@/components/ui/button';
import HookForm from '@/app/components/HookForm';
import { type ControllerRenderProps, type FieldPath, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FilePlus } from 'lucide-react';
import type { CreateOutlineValues } from '@moge/types';
import { createOutlineSchema } from '@moge/types';
import { useOutlineStore } from '@/stores/outlineStore';
import { useDictStore } from '@/stores/dictStore';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

type RenderControl = (
  field: ControllerRenderProps<CreateOutlineValues, FieldPath<CreateOutlineValues>>,
  name: FieldPath<CreateOutlineValues>
) => React.ReactNode;

export default function CreateOutlineDialog() {
  const [open, setOpen] = useState(false);
  const { createOutline, loading, resetError } = useOutlineStore();
  const { novelTypes, fetchNovelTypes } = useDictStore();

  useEffect(() => {
    if (open) {
      void fetchNovelTypes();
    }
  }, [open, fetchNovelTypes]);

  const form = useForm<CreateOutlineValues>({
    resolver: zodResolver(createOutlineSchema),
    defaultValues: { name: '', type: '', era: '', conflict: '', tags: [], remark: '' },
  });

  const renderControl: RenderControl = (field, name) => {
    if (name === 'type') {
      return (
        <MogeSelect onValueChange={field.onChange} value={field.value as string}>
          <MogeSelectTrigger>
            <MogeSelectValue placeholder="请选择" />
          </MogeSelectTrigger>
          <MogeSelectContent>
            {novelTypes.map((t) => (
              <MogeSelectItem key={t.id} value={t.label}>
                {t.label}
              </MogeSelectItem>
            ))}
          </MogeSelectContent>
        </MogeSelect>
      );
    }

    if (name === 'conflict' || name === 'remark') {
      return (
        <MogeTextarea
          rows={name === 'conflict' ? 3 : 2}
          placeholder={
            name === 'conflict' ? '例：一颗会说话的核弹要求主角 24 小时内帮它自杀……' : '备忘信息'
          }
          {...field}
        />
      );
    }

    return (
      <MogeInput placeholder={name === 'era' ? '例：近未来 2150 年' : '会说话的核弹'} {...field} />
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
