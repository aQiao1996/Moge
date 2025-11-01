/**
 * 文稿创建/编辑对话框组件
 *
 * 功能:
 * - 支持空白创建文稿
 * - 支持从大纲创建文稿
 * - 支持编辑文稿信息
 * - 支持关联设定集
 */
'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import type { ControllerRenderProps, FieldPath } from 'react-hook-form';
import { FilePlus, Edit, Users, Zap, Globe, Folder } from 'lucide-react';
import {
  createManuscriptSchema,
  updateManuscriptSchema,
  type CreateManuscriptValues,
  type UpdateManuscriptValues,
  type Manuscript,
} from '@moge/types';
import { useDictStore } from '@/stores/dictStore';
import MogeFormDialog, {
  type FieldConfig,
  type FormFieldConfig,
} from '@/app/components/MogeFormDialog';
import { MogeInput } from '@/app/components/MogeInput';
import { MogeTextarea } from '@/app/components/MogeTextarea';
import {
  MogeSelect,
  MogeSelectContent,
  MogeSelectItem,
  MogeSelectTrigger,
  MogeSelectValue,
} from '@/app/components/MogeSelect';
import { MogeMultiSelect } from '@/app/components/MogeMultiSelect';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import SettingSelectorDialog from '@/app/(main)/settings/components/SettingSelectorDialog';
import { createManuscript, updateManuscript, createManuscriptFromOutline } from '../api/client';
import { useOutlineStore } from '@/stores/outlineStore';

interface ManuscriptDialogProps {
  mode: 'create' | 'edit' | 'from-outline';
  manuscript?: Manuscript;
  outlineId?: number;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

type FormValues = CreateManuscriptValues | UpdateManuscriptValues;

/**
 * 设定分类配置
 */
const SETTING_CATEGORIES = [
  { key: 'characters' as const, label: '角色设定', Icon: Users, color: 'text-blue-500' },
  { key: 'systems' as const, label: '系统设定', Icon: Zap, color: 'text-yellow-500' },
  { key: 'worlds' as const, label: '世界设定', Icon: Globe, color: 'text-green-500' },
  { key: 'misc' as const, label: '辅助设定', Icon: Folder, color: 'text-purple-500' },
];

export default function ManuscriptDialog({
  mode,
  manuscript,
  outlineId,
  trigger,
  open,
  onOpenChange,
  onSuccess,
}: ManuscriptDialogProps) {
  const { novelTypes, novelTags, fetchNovelTypes, fetchNovelTags } = useDictStore();
  const { outlines, getOutlines } = useOutlineStore();

  const isEditMode = mode === 'edit';
  const isFromOutline = mode === 'from-outline';

  // 设定选择器状态管理
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<{
    key: 'characters' | 'systems' | 'worlds' | 'misc';
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
    color: string;
  } | null>(null);
  const [currentSettingIds, setCurrentSettingIds] = useState<string[]>([]);

  // 使用 useRef 保存当前字段的 onChange 回调
  const fieldOnChangeRef = useRef<((value: string[]) => void) | null>(null);

  // 加载大纲列表(用于从大纲创建模式)
  useEffect(() => {
    if (isFromOutline) {
      void getOutlines({ pageNum: 1, pageSize: 100 });
    }
  }, [isFromOutline, getOutlines]);

  // 字段配置
  const fields: FieldConfig[] = [
    { name: 'name', label: '文稿名称', required: !isEditMode },
    ...(isFromOutline ? [{ name: 'outlineId', label: '关联大纲' }] : []),
    { name: 'type', label: '小说类型' },
    { name: 'description', label: '简介' },
    { name: 'tags', label: '标签' },
    { name: 'targetWords', label: '目标字数' },
    { name: 'characters', label: '关联角色' },
    { name: 'systems', label: '关联系统' },
    { name: 'worlds', label: '关联世界' },
    { name: 'misc', label: '关联辅助' },
  ];

  const renderControl = useCallback(
    (
      field: ControllerRenderProps<
        CreateManuscriptValues | UpdateManuscriptValues,
        FieldPath<CreateManuscriptValues | UpdateManuscriptValues>
      >,
      name: FieldPath<CreateManuscriptValues | UpdateManuscriptValues>
    ) => {
      if (name === 'outlineId' && isFromOutline) {
        return (
          <MogeSelect
            onValueChange={(value) => field.onChange(Number(value))}
            value={field.value ? String(field.value) : undefined}
          >
            <MogeSelectTrigger>
              <MogeSelectValue placeholder="请选择大纲" />
            </MogeSelectTrigger>
            <MogeSelectContent>
              {outlines.map((outline) => (
                <MogeSelectItem key={outline.id} value={String(outline.id)}>
                  {outline.name}
                </MogeSelectItem>
              ))}
            </MogeSelectContent>
          </MogeSelect>
        );
      }

      if (name === 'type') {
        return (
          <MogeSelect onValueChange={field.onChange} value={field.value as string}>
            <MogeSelectTrigger>
              <MogeSelectValue placeholder="请选择小说类型" />
            </MogeSelectTrigger>
            <MogeSelectContent>
              {novelTypes.map((t) => (
                <MogeSelectItem key={t.id} value={t.value}>
                  {t.label}
                </MogeSelectItem>
              ))}
            </MogeSelectContent>
          </MogeSelect>
        );
      }

      if (name === 'tags') {
        return (
          <MogeMultiSelect
            options={novelTags.map((tag) => ({ value: tag.label, label: tag.label }))}
            value={field.value as string[]}
            onChange={field.onChange}
            placeholder="选择标签"
          />
        );
      }

      if (name === 'targetWords') {
        return (
          <MogeInput
            type="number"
            placeholder="例如: 500000"
            {...field}
            onChange={(e) => field.onChange(Number(e.target.value))}
          />
        );
      }

      // 处理设定关联字段(characters, systems, worlds, misc)
      if (name === 'characters' || name === 'systems' || name === 'worlds' || name === 'misc') {
        const categoryConfig = SETTING_CATEGORIES.find((cat) => cat.key === name);
        if (!categoryConfig) return null;

        const { Icon, label, color } = categoryConfig;
        const selectedIds = (field.value as string[]) || [];

        return (
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => {
                setCurrentCategory(categoryConfig);
                setCurrentSettingIds(selectedIds);
                fieldOnChangeRef.current = field.onChange;
                setSelectorOpen(true);
              }}
            >
              <Icon className={`h-4 w-4 ${color}`} />
              <span>选择{label}</span>
              {selectedIds.length > 0 && (
                <span className="ml-auto text-sm text-[var(--moge-text-muted)]">
                  已选 {selectedIds.length} 项
                </span>
              )}
            </Button>
          </div>
        );
      }

      if (name === 'description') {
        return <MogeTextarea rows={3} placeholder="文稿简介或备注信息" {...field} />;
      }

      return <MogeInput placeholder="文稿名称" {...field} />;
    },
    [novelTypes, novelTags, outlines, isFromOutline]
  );

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditMode && manuscript) {
        if (!manuscript.id) return;
        await updateManuscript(manuscript.id, values as UpdateManuscriptValues);
        toast.success('更新成功');
      } else if (isFromOutline && outlineId) {
        await createManuscriptFromOutline(outlineId);
        toast.success('创建成功');
      } else {
        await createManuscript(values as CreateManuscriptValues);
        toast.success('创建成功');
      }
      onSuccess?.();
    } catch (error) {
      console.error('Manuscript dialog error:', error);
      throw error;
    }
  };

  const defaultTrigger = isEditMode ? (
    <Button size="sm" variant="ghost" title="编辑文稿">
      <Edit className="h-4 w-4" />
    </Button>
  ) : (
    <Button className="gap-2 shadow-[var(--moge-glow-btn)]">
      <FilePlus className="h-4 w-4" />
      {isFromOutline ? '从大纲创建' : '新建文稿'}
    </Button>
  );

  /**
   * 处理设定选择确认
   */
  const handleSettingConfirm = (selectedIds: string[]) => {
    if (fieldOnChangeRef.current) {
      fieldOnChangeRef.current(selectedIds);
    }
  };

  return (
    <>
      <MogeFormDialog
        mode={mode === 'from-outline' ? 'create' : mode}
        title={isEditMode ? '编辑文稿' : isFromOutline ? '从大纲创建文稿' : '新建文稿'}
        description={
          isEditMode
            ? '修改文稿信息'
            : isFromOutline
              ? '选择大纲并填写信息后点击创建'
              : '填写信息后点击创建即可生成文稿'
        }
        open={open}
        onOpenChange={onOpenChange}
        trigger={trigger}
        createSchema={createManuscriptSchema}
        updateSchema={updateManuscriptSchema}
        defaultValues={{
          name: '',
          type: '',
          description: '',
          tags: [],
          outlineId: outlineId || undefined,
          targetWords: undefined,
          characters: [],
          systems: [],
          worlds: [],
          misc: [],
        }}
        onSubmit={onSubmit}
        fields={fields as FormFieldConfig<CreateManuscriptValues | UpdateManuscriptValues>[]}
        renderControl={renderControl}
        defaultTrigger={defaultTrigger}
        item={manuscript}
        onOpen={() => {
          void fetchNovelTypes();
          void fetchNovelTags();
        }}
      />

      {/* 设定选择器弹窗 */}
      {currentCategory && (
        <SettingSelectorDialog
          open={selectorOpen}
          onOpenChange={setSelectorOpen}
          category={currentCategory.key}
          categoryLabel={currentCategory.label}
          selectedIds={currentSettingIds}
          onConfirm={handleSettingConfirm}
          Icon={currentCategory.Icon}
          color={currentCategory.color}
        />
      )}
    </>
  );
}
