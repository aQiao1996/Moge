'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';
import { FilePlus, Edit } from 'lucide-react';
import { useForm, type ControllerRenderProps, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  createOutlineSchema,
  updateOutlineSchema,
  type CreateOutlineValues,
  type UpdateOutlineValues,
  type Outline,
} from '@moge/types';
import { useOutlineStore } from '@/stores/outlineStore';
import { useDictStore } from '@/stores/dictStore';

import HookForm from '@/app/components/HookForm';
import { MogeInput } from '@/app/components/MogeInput';
import { MogeTextarea } from '@/app/components/MogeTextarea';
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
import { Button } from '@/components/ui/button';

interface OutlineDialogProps {
  mode: 'create' | 'edit';
  outline?: Outline;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type FormValues = CreateOutlineValues | UpdateOutlineValues;

type RenderControl = (
  field: ControllerRenderProps<FormValues, FieldPath<FormValues>>,
  name: FieldPath<FormValues>
) => React.ReactNode;

export default function OutlineDialog({
  mode,
  outline,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: OutlineDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const router = useRouter();
  const { createOutline, updateOutline, submitting, resetError } = useOutlineStore();
  const { novelTypes, fetchNovelTypes } = useDictStore();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen;

  const isEditMode = mode === 'edit';
  const schema = isEditMode ? updateOutlineSchema : createOutlineSchema;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      type: '',
      era: '',
      conflict: '',
      tags: [],
      remark: '',
    },
  });

  useEffect(() => {
    if (open) {
      void fetchNovelTypes();

      // 🔧 在对话框打开时设置表单值
      if (isEditMode && outline) {
        form.reset({
          name: outline.name,
          type: outline.type,
          era: outline.era ?? '',
          conflict: outline.conflict ?? '',
          tags: outline.tags ?? [],
          remark: outline.remark ?? '',
          status: outline.status,
        });
      } else if (!isEditMode) {
        // 创建模式时重置为空
        form.reset({
          name: '',
          type: '',
          era: '',
          conflict: '',
          tags: [],
          remark: '',
        });
      }
    }
  }, [open, isEditMode, outline?.id, fetchNovelTypes]);

  const renderControl: RenderControl = useCallback(
    (field, name) => {
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
        <MogeInput
          placeholder={name === 'era' ? '例：近未来 2150 年' : '会说话的核弹'}
          {...field}
        />
      );
    },
    [novelTypes]
  );

  const onSubmit = async (values: FormValues) => {
    toast.dismiss();
    resetError();
    try {
      if (isEditMode && outline) {
        if (!outline.id) return;
        await updateOutline(outline.id, values as UpdateOutlineValues);
        toast.success('大纲更新成功');
        setOpen(false);
      } else {
        const newOutline = await createOutline(values as CreateOutlineValues);
        toast.success('大纲创建成功, 正在跳转...');
        setTimeout(() => {
          setOpen(false);
          router.push(`/outline/${newOutline.id}`);
        }, 1000);
      }
    } catch {
      toast.error(isEditMode ? '更新大纲失败' : '创建大纲失败');
    }
  };

  const defaultTrigger = isEditMode ? (
    <Button size="sm" variant="ghost" title="编辑基本信息">
      <Edit className="h-4 w-4" />
    </Button>
  ) : (
    <Button className="gap-2 shadow-[var(--moge-glow-btn)]">
      <FilePlus className="h-4 w-4" />
      新增大纲
    </Button>
  );

  const dialogContent = (
    <DialogContent
      className="home-area w-full max-w-2xl border backdrop-blur-xl"
      style={{
        backgroundColor: 'var(--moge-dialog-bg)',
        borderColor: 'var(--moge-dialog-border)',
        color: 'var(--moge-text-main)',
      }}
    >
      <DialogHeader>
        <DialogTitle>{isEditMode ? '编辑大纲' : '新建大纲'}</DialogTitle>
        <DialogDescription style={{ color: 'var(--moge-text-sub)' }}>
          {isEditMode ? '修改大纲信息' : '填写信息后点击创建即可生成大纲'}
        </DialogDescription>
      </DialogHeader>

      <HookForm
        form={form}
        fields={[
          { name: 'name', label: '小说名称', required: !isEditMode },
          { name: 'type', label: '小说类型', required: !isEditMode },
          { name: 'era', label: '故事时代' },
          { name: 'conflict', label: '核心冲突' },
          { name: 'remark', label: '备注' },
        ]}
        loading={submitting}
        submitText={isEditMode ? '保存' : '确认'}
        cancelText="取消"
        onCancel={() => {
          setOpen(false);
        }}
        renderControl={renderControl}
        onSubmit={onSubmit}
      />
    </DialogContent>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>}
      {dialogContent}
    </Dialog>
  );
}
