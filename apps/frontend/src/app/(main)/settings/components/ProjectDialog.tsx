'use client';
import { useCallback, useMemo, useState } from 'react';
import type { ControllerRenderProps, FieldPath } from 'react-hook-form';

import { Plus } from 'lucide-react';

import {
  createProjectSchema,
  updateProjectSchema,
  type CreateProjectValues,
  type UpdateProjectValues,
  type Project,
} from '@moge/types';

import MogeFormDialog, { type FieldConfig } from '@/app/components/MogeFormDialog';
import { MogeInput } from '@/app/components/MogeInput';
import { MogeTextarea } from '@/app/components/MogeTextarea';
import { MogeFormSelect } from '@/app/components/MogeFormSelect';
import { MogeMultiSelect } from '@/app/components/MogeMultiSelect';
import { Button } from '@/components/ui/button';
import { getSettingsLibrary, type SettingItem } from '@/api/settings.api';
import { useTranslations } from 'next-intl';

interface ProjectDialogProps {
  mode: 'create' | 'edit';
  item?: Project;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit?: (values: CreateProjectValues | UpdateProjectValues) => Promise<void>;
}

/**
 * 项目类型选项配置
 * 定义了小说项目可选的类型列表
 */
const projectTypeOptions = [
  { value: '玄幻', label: '玄幻' },
  { value: '仙侠', label: '仙侠' },
  { value: '都市', label: '都市' },
  { value: '历史', label: '历史' },
  { value: '科幻', label: '科幻' },
  { value: '武侠', label: '武侠' },
  { value: '军事', label: '军事' },
  { value: '游戏', label: '游戏' },
  { value: '竞技', label: '竞技' },
  { value: '悬疑', label: '悬疑' },
  { value: '轻小说', label: '轻小说' },
  { value: '短篇', label: '短篇' },
  { value: '其他', label: '其他' },
];

/**
 * 设定库数据类型定义
 * 包含角色、系统、世界和辅助设定的列表数据
 */
interface SettingsLibraryData {
  characters: SettingItem[];
  systems: SettingItem[];
  worlds: SettingItem[];
  misc: SettingItem[];
}

/**
 * 小说项目创建/编辑对话框组件
 * 提供项目的基本信息编辑功能，包括名称、类型、描述和设定库关联
 *
 * @param mode 对话框模式，'create' 创建模式或 'edit' 编辑模式
 * @param item 编辑模式下的项目数据
 * @param trigger 触发对话框的自定义元素
 * @param open 对话框是否打开（受控模式）
 * @param onOpenChange 对话框打开状态变化回调
 * @param onSubmit 表单提交回调函数
 */
export default function ProjectDialog({
  mode,
  item,
  trigger,
  open,
  onOpenChange,
  onSubmit,
}: ProjectDialogProps) {
  const isEditMode = mode === 'edit';
  const t = useTranslations('settings.project');
  const tCommon = useTranslations('common');

  const [settingsLibrary, setSettingsLibrary] = useState<SettingsLibraryData>({
    characters: [],
    systems: [],
    worlds: [],
    misc: [],
  });
  const [loadingSettings, setLoadingSettings] = useState(false);

  /**
   * 将设定库数据转换为下拉选项格式
   * 生成适用于 MogeMultiSelect 组件的选项数据
   */
  const settingsOptions = useMemo(
    () => ({
      characters: settingsLibrary.characters.map((item) => ({
        value: String(item.id),
        label: item.name,
        description: item.description,
      })),
      systems: settingsLibrary.systems.map((item) => ({
        value: String(item.id),
        label: item.name,
        description: item.description,
      })),
      worlds: settingsLibrary.worlds.map((item) => ({
        value: String(item.id),
        label: item.name,
        description: item.era ? `${item.description} (${item.era})` : item.description,
      })),
      misc: settingsLibrary.misc.map((item) => ({
        value: String(item.id),
        label: item.name,
        description: item.description,
      })),
    }),
    [settingsLibrary]
  );

  /**
   * 表单字段配置
   * 定义项目对话框中所有表单字段的元数据
   */
  const fields = useMemo<FieldConfig<CreateProjectValues>[]>(
    () => [
      { name: 'name', label: t('name'), required: true },
      { name: 'type', label: t('type'), required: true },
      { name: 'description', label: t('description') },
      { name: 'characters', label: t('charactersLabel'), section: t('settingsSection') },
      { name: 'systems', label: t('systemsLabel'), section: t('settingsSection') },
      { name: 'worlds', label: t('worldsLabel'), section: t('settingsSection') },
      { name: 'misc', label: t('miscLabel'), section: t('settingsSection') },
    ],
    [t]
  );

  /**
   * 渲染表单控件
   * 根据字段名称返回对应的输入组件
   *
   * @param field 表单字段控制器属性
   * @param name 字段名称
   * @returns 对应的表单控件JSX元素
   */
  const renderControl = useCallback(
    (
      field: ControllerRenderProps<CreateProjectValues, FieldPath<CreateProjectValues>>,
      name: FieldPath<CreateProjectValues>
    ) => {
      if (name === 'type') {
        return (
          <MogeFormSelect
            value={field.value as string}
            onChange={field.onChange}
            onBlur={field.onBlur}
            placeholder={t('typePlaceholder')}
            options={projectTypeOptions}
            disabled={field.disabled}
          />
        );
      }

      if (name === 'description') {
        return (
          <MogeTextarea
            placeholder={t('descriptionPlaceholder')}
            value={(field.value as string) || ''}
            onChange={(e) => field.onChange(e.target.value)}
            onBlur={field.onBlur}
            name={field.name}
            disabled={field.disabled}
            rows={3}
          />
        );
      }

      // 设定库关联字段 - 角色设定
      if (name === 'characters') {
        return (
          <MogeMultiSelect
            options={settingsOptions.characters}
            value={(field.value as string[]) || []}
            onChange={field.onChange}
            onBlur={field.onBlur}
            placeholder={t('charactersPlaceholder')}
            disabled={field.disabled}
            loading={loadingSettings}
            emptyMessage={t('charactersEmpty')}
            maxDisplay={3}
          />
        );
      }

      // 设定库关联字段 - 系统设定
      if (name === 'systems') {
        return (
          <MogeMultiSelect
            options={settingsOptions.systems}
            value={(field.value as string[]) || []}
            onChange={field.onChange}
            onBlur={field.onBlur}
            placeholder={t('systemsPlaceholder')}
            disabled={field.disabled}
            loading={loadingSettings}
            emptyMessage={t('systemsEmpty')}
            maxDisplay={3}
          />
        );
      }

      // 设定库关联字段 - 世界设定
      if (name === 'worlds') {
        return (
          <MogeMultiSelect
            options={settingsOptions.worlds}
            value={(field.value as string[]) || []}
            onChange={field.onChange}
            onBlur={field.onBlur}
            placeholder={t('worldsPlaceholder')}
            disabled={field.disabled}
            loading={loadingSettings}
            emptyMessage={t('worldsEmpty')}
            maxDisplay={3}
          />
        );
      }

      // 设定库关联字段 - 辅助设定
      if (name === 'misc') {
        return (
          <MogeMultiSelect
            options={settingsOptions.misc}
            value={(field.value as string[]) || []}
            onChange={field.onChange}
            onBlur={field.onBlur}
            placeholder={t('miscPlaceholder')}
            disabled={field.disabled}
            loading={loadingSettings}
            emptyMessage={t('miscEmpty')}
            maxDisplay={3}
          />
        );
      }

      return (
        <MogeInput
          placeholder={name === 'name' ? t('namePlaceholder') : ''}
          value={(field.value as string) || ''}
          onChange={(e) => field.onChange(e.target.value)}
          onBlur={field.onBlur}
          name={field.name}
          disabled={field.disabled}
        />
      );
    },
    [settingsOptions, loadingSettings, t]
  );

  /**
   * 处理表单提交
   * @param values 表单数据
   */
  const handleSubmit = useCallback(
    async (values: CreateProjectValues) => {
      if (onSubmit) {
        await onSubmit(values);
      }
    },
    [onSubmit]
  );

  /**
   * 处理对话框打开事件
   * 当对话框打开时加载设定库数据
   */
  const handleOpen = useCallback(() => {
    setLoadingSettings(true);
    getSettingsLibrary()
      .then((data) => {
        setSettingsLibrary(data);
      })
      .catch((error) => {
        console.error('Failed to load settings library:', error);
      })
      .finally(() => setLoadingSettings(false));
  }, []);

  return (
    <MogeFormDialog<CreateProjectValues>
      mode={mode}
      title={t(isEditMode ? 'editTitle' : 'createTitle')}
      description={t(isEditMode ? 'editDescription' : 'createDescription')}
      createSchema={createProjectSchema}
      updateSchema={updateProjectSchema}
      fields={fields}
      renderControl={renderControl}
      onSubmit={handleSubmit}
      onOpen={handleOpen}
      item={item as CreateProjectValues}
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
      defaultTrigger={
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t('createButton')}
        </Button>
      }
      maxWidth="lg"
      submitText={isEditMode ? tCommon('save') : tCommon('create')}
    />
  );
}
