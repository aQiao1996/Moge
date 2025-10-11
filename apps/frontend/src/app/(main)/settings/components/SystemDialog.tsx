'use client';
import { useCallback, useState } from 'react';
import { Zap, Plus, X } from 'lucide-react';
import { type ControllerRenderProps, type FieldPath } from 'react-hook-form';

import {
  createSystemSchema,
  updateSystemSchema,
  type CreateSystemValues,
  type UpdateSystemValues,
  type System,
  systemTypes,
  itemCategories,
  type SystemModule,
  type LevelSystem,
  type Item,
  type Parameter,
} from '@moge/types';

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
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { createSystem, updateSystem } from '@/api/settings.api';

interface SystemDialogProps {
  mode: 'create' | 'edit';
  system?: System & { id?: number | string };
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type FormValues = CreateSystemValues | UpdateSystemValues;
console.log('🚀 ~ SystemDialog.tsx:13 ~ systemTypes:', systemTypes);

export default function SystemDialog({ mode, system, open, onOpenChange }: SystemDialogProps) {
  const isEditMode = mode === 'edit';

  // 动态数组状态
  const [modules, setModules] = useState<SystemModule[]>(system?.modules || []);
  const [levels, setLevels] = useState<LevelSystem[]>(system?.levels || []);
  const [items, setItems] = useState<Item[]>(system?.items || []);
  const [parameters, setParameters] = useState<Parameter[]>(system?.parameters || []);

  // 字段配置
  const fields: FieldConfig<FormValues>[] = [
    { name: 'name', label: '系统名称', required: !isEditMode },
    { name: 'type', label: '系统类型', required: !isEditMode },
    { name: 'description', label: '系统描述' },
    { name: 'rules', label: '运作规则' },
    { name: 'triggers', label: '触发条件' },
    { name: 'constraints', label: '限制约束' },
    { name: 'remarks', label: '备注' },
  ];

  const renderControl = useCallback(
    (
      field: ControllerRenderProps<
        CreateSystemValues | UpdateSystemValues,
        FieldPath<CreateSystemValues | UpdateSystemValues>
      >,
      name: FieldPath<CreateSystemValues | UpdateSystemValues>
    ) => {
      if (name === 'type') {
        return (
          <MogeSelect onValueChange={field.onChange} value={field.value as string}>
            <MogeSelectTrigger>
              <MogeSelectValue placeholder="请选择系统类型" />
            </MogeSelectTrigger>
            <MogeSelectContent>
              {systemTypes.map((type) => (
                <MogeSelectItem key={type.value} value={type.value}>
                  {type.label}
                </MogeSelectItem>
              ))}
            </MogeSelectContent>
          </MogeSelect>
        );
      }

      if (
        name === 'description' ||
        name === 'rules' ||
        name === 'triggers' ||
        name === 'constraints' ||
        name === 'remarks'
      ) {
        return (
          <MogeTextarea
            placeholder={`请输入${fields.find((f) => f.name === name)?.label}`}
            value={field.value as string}
            onChange={field.onChange}
            className="min-h-[80px]"
          />
        );
      }

      return (
        <MogeInput
          placeholder={`请输入${fields.find((f) => f.name === name)?.label}`}
          value={field.value as string}
          onChange={field.onChange}
        />
      );
    },
    [fields, isEditMode]
  );

  // 处理提交
  const onSubmit = async (values: FormValues) => {
    // 移除可能存在的id字段(编辑模式下form可能包含id)
    const { id: _removedId, ...restValues } = values as FormValues & { id?: string };
    void _removedId; // id通过URL参数传递,不需要在表单数据中
    const submitData = {
      ...restValues,
      modules,
      levels,
      items,
      parameters,
    };

    if (isEditMode && system?.id) {
      // 确保id是number类型
      const systemId = typeof system.id === 'string' ? parseInt(system.id) : system.id;
      await updateSystem(systemId, submitData);
    } else {
      await createSystem(submitData);
    }
  };

  // 功能模块管理
  const addModule = () => {
    setModules([
      ...modules,
      { name: '', description: '', mechanism: '', trigger: '', limitation: '' },
    ]);
  };

  const updateModule = (index: number, field: keyof SystemModule, value: string) => {
    const newModules = [...modules];
    newModules[index] = { ...newModules[index], [field]: value };
    setModules(newModules);
  };

  const removeModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index));
  };

  // 等级体系管理
  const addLevel = () => {
    setLevels([...levels, { name: '', description: '', requirement: '', benefits: '' }]);
  };

  const updateLevel = (index: number, field: keyof LevelSystem, value: string) => {
    const newLevels = [...levels];
    newLevels[index] = { ...newLevels[index], [field]: value };
    setLevels(newLevels);
  };

  const removeLevel = (index: number) => {
    setLevels(levels.filter((_, i) => i !== index));
  };

  // 道具装备管理
  const addItem = () => {
    setItems([
      ...items,
      { name: '', category: '', description: '', attributes: '', obtainMethod: '' },
    ]);
  };

  const updateItem = (index: number, field: keyof Item, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // 数值参数管理
  const addParameter = () => {
    setParameters([...parameters, { name: '', value: '', description: '' }]);
  };

  const updateParameter = (index: number, field: keyof Parameter, value: string) => {
    const newParameters = [...parameters];
    newParameters[index] = { ...newParameters[index], [field]: value };
    setParameters(newParameters);
  };

  const removeParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  // 渲染模块管理区域
  const renderModulesSection = () => (
    <Card
      className="p-4"
      style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
    >
      <div className="mb-3 flex items-center justify-between">
        <Label className="text-sm font-medium text-[var(--moge-text-main)]">功能模块</Label>
        <Button type="button" variant="outline" size="sm" onClick={addModule}>
          <Plus className="mr-1 h-3 w-3" />
          添加模块
        </Button>
      </div>
      <div className="space-y-3">
        {modules.map((module, index) => (
          <Card
            key={index}
            className="p-3"
            style={{ backgroundColor: 'var(--moge-bg)', borderColor: 'var(--moge-border)' }}
          >
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-xs text-[var(--moge-text-sub)]">模块 {index + 1}</Label>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeModule(index)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="grid gap-2">
              <MogeInput
                placeholder="功能名称"
                value={module.name}
                onChange={(e) => updateModule(index, 'name', e.target.value)}
              />
              <MogeTextarea
                placeholder="功能描述"
                value={module.description || ''}
                onChange={(e) => updateModule(index, 'description', e.target.value)}
                className="min-h-[60px]"
              />
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <MogeInput
                  placeholder="运作机制"
                  value={module.mechanism || ''}
                  onChange={(e) => updateModule(index, 'mechanism', e.target.value)}
                />
                <MogeInput
                  placeholder="触发条件"
                  value={module.trigger || ''}
                  onChange={(e) => updateModule(index, 'trigger', e.target.value)}
                />
                <MogeInput
                  placeholder="限制约束"
                  value={module.limitation || ''}
                  onChange={(e) => updateModule(index, 'limitation', e.target.value)}
                />
              </div>
            </div>
          </Card>
        ))}
        {modules.length === 0 && (
          <div className="py-4 text-center text-sm text-[var(--moge-text-muted)]">
            暂无功能模块，点击"添加模块"开始创建
          </div>
        )}
      </div>
    </Card>
  );

  // 渲染等级体系区域
  const renderLevelsSection = () => (
    <Card
      className="p-4"
      style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
    >
      <div className="mb-3 flex items-center justify-between">
        <Label className="text-sm font-medium text-[var(--moge-text-main)]">等级体系</Label>
        <Button type="button" variant="outline" size="sm" onClick={addLevel}>
          <Plus className="mr-1 h-3 w-3" />
          添加等级
        </Button>
      </div>
      <div className="space-y-3">
        {levels.map((level, index) => (
          <Card
            key={index}
            className="p-3"
            style={{ backgroundColor: 'var(--moge-bg)', borderColor: 'var(--moge-border)' }}
          >
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-xs text-[var(--moge-text-sub)]">等级 {index + 1}</Label>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeLevel(index)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="grid gap-2">
              <MogeInput
                placeholder="等级名称"
                value={level.name}
                onChange={(e) => updateLevel(index, 'name', e.target.value)}
              />
              <MogeTextarea
                placeholder="等级描述"
                value={level.description || ''}
                onChange={(e) => updateLevel(index, 'description', e.target.value)}
                className="min-h-[60px]"
              />
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <MogeInput
                  placeholder="升级条件"
                  value={level.requirement || ''}
                  onChange={(e) => updateLevel(index, 'requirement', e.target.value)}
                />
                <MogeInput
                  placeholder="等级效果"
                  value={level.benefits || ''}
                  onChange={(e) => updateLevel(index, 'benefits', e.target.value)}
                />
              </div>
            </div>
          </Card>
        ))}
        {levels.length === 0 && (
          <div className="py-4 text-center text-sm text-[var(--moge-text-muted)]">
            暂无等级体系，点击"添加等级"开始创建
          </div>
        )}
      </div>
    </Card>
  );

  // 渲染道具装备区域
  const renderItemsSection = () => (
    <Card
      className="p-4"
      style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
    >
      <div className="mb-3 flex items-center justify-between">
        <Label className="text-sm font-medium text-[var(--moge-text-main)]">道具装备</Label>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="mr-1 h-3 w-3" />
          添加道具
        </Button>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <Card
            key={index}
            className="p-3"
            style={{ backgroundColor: 'var(--moge-bg)', borderColor: 'var(--moge-border)' }}
          >
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-xs text-[var(--moge-text-sub)]">道具 {index + 1}</Label>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <MogeInput
                  placeholder="道具名称"
                  value={item.name}
                  onChange={(e) => updateItem(index, 'name', e.target.value)}
                />
                <MogeSelect
                  value={item.category || ''}
                  onValueChange={(value) => updateItem(index, 'category', value)}
                >
                  <MogeSelectTrigger>
                    <MogeSelectValue placeholder="道具分类" />
                  </MogeSelectTrigger>
                  <MogeSelectContent>
                    {itemCategories.map((category) => (
                      <MogeSelectItem key={category.value} value={category.value}>
                        {category.label}
                      </MogeSelectItem>
                    ))}
                  </MogeSelectContent>
                </MogeSelect>
              </div>
              <MogeTextarea
                placeholder="道具描述"
                value={item.description || ''}
                onChange={(e) => updateItem(index, 'description', e.target.value)}
                className="min-h-[60px]"
              />
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <MogeInput
                  placeholder="属性效果"
                  value={item.attributes || ''}
                  onChange={(e) => updateItem(index, 'attributes', e.target.value)}
                />
                <MogeInput
                  placeholder="获取途径"
                  value={item.obtainMethod || ''}
                  onChange={(e) => updateItem(index, 'obtainMethod', e.target.value)}
                />
              </div>
            </div>
          </Card>
        ))}
        {items.length === 0 && (
          <div className="py-4 text-center text-sm text-[var(--moge-text-muted)]">
            暂无道具装备，点击"添加道具"开始创建
          </div>
        )}
      </div>
    </Card>
  );

  // 渲染数值参数区域
  const renderParametersSection = () => (
    <Card
      className="p-4"
      style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
    >
      <div className="mb-3 flex items-center justify-between">
        <Label className="text-sm font-medium text-[var(--moge-text-main)]">数值参数</Label>
        <Button type="button" variant="outline" size="sm" onClick={addParameter}>
          <Plus className="mr-1 h-3 w-3" />
          添加参数
        </Button>
      </div>
      <div className="space-y-3">
        {parameters.map((parameter, index) => (
          <Card
            key={index}
            className="p-3"
            style={{ backgroundColor: 'var(--moge-bg)', borderColor: 'var(--moge-border)' }}
          >
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-xs text-[var(--moge-text-sub)]">参数 {index + 1}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeParameter(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <MogeInput
                  placeholder="参数名称"
                  value={parameter.name}
                  onChange={(e) => updateParameter(index, 'name', e.target.value)}
                />
                <MogeInput
                  placeholder="参数值/公式"
                  value={parameter.value || ''}
                  onChange={(e) => updateParameter(index, 'value', e.target.value)}
                />
              </div>
              <MogeInput
                placeholder="参数描述"
                value={parameter.description || ''}
                onChange={(e) => updateParameter(index, 'description', e.target.value)}
              />
            </div>
          </Card>
        ))}
        {parameters.length === 0 && (
          <div className="py-4 text-center text-sm text-[var(--moge-text-muted)]">
            暂无数值参数，点击"添加参数"开始创建
          </div>
        )}
      </div>
    </Card>
  );

  // 默认触发器
  const defaultTrigger = (
    <Button>
      <Zap className="mr-2 h-4 w-4" />
      新建系统设定
    </Button>
  );

  return (
    <MogeFormDialog
      mode={mode}
      title={isEditMode ? '编辑系统设定' : '新建系统设定'}
      description={isEditMode ? '修改系统设定信息' : '创建一个新的系统/金手指设定'}
      open={open}
      onOpenChange={onOpenChange}
      createSchema={createSystemSchema}
      updateSchema={updateSystemSchema}
      defaultValues={{
        name: '',
        type: '',
        description: '',
        rules: '',
        triggers: '',
        constraints: '',
        tags: [],
        remarks: '',
      }}
      onSubmit={onSubmit}
      fields={fields as FormFieldConfig<CreateSystemValues | UpdateSystemValues>[]}
      renderControl={renderControl}
      customSections={[
        {
          title: '功能模块',
          content: renderModulesSection(),
        },
        {
          title: '等级体系',
          content: renderLevelsSection(),
        },
        {
          title: '道具装备',
          content: renderItemsSection(),
        },
        {
          title: '数值参数',
          content: renderParametersSection(),
        },
      ]}
      defaultTrigger={defaultTrigger}
      item={system}
      maxWidth="4xl"
    />
  );
}
