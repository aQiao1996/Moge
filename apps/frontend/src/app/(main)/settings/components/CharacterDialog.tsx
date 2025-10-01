'use client';
import { useCallback, useState } from 'react';
import { Users, Edit, Plus, X } from 'lucide-react';
import { type ControllerRenderProps, type FieldPath } from 'react-hook-form';
import { toast } from 'sonner';

import {
  createCharacterSchema,
  updateCharacterSchema,
  type CreateCharacterValues,
  type UpdateCharacterValues,
  type Character,
  type Relationship,
  characterTypes,
  genderOptions,
  relationshipTypes,
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
import { createCharacter, updateCharacter, type CharacterSetting } from '@/api/settings.api';

interface CharacterDialogProps {
  mode: 'create' | 'edit';
  character?: Character & { id?: string | number };
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type FormValues = CreateCharacterValues | UpdateCharacterValues;

export default function CharacterDialog({
  mode,
  character,
  trigger,
  open,
  onOpenChange,
}: CharacterDialogProps) {
  const isEditMode = mode === 'edit';

  // 关系状态管理
  const [relationships, setRelationships] = useState<Relationship[]>(
    character?.relationships || []
  );

  // 字段配置
  const fields: FieldConfig<FormValues>[] = [
    { name: 'name', label: '角色名称', required: true },
    { name: 'type', label: '角色类型', required: true },
    { name: 'gender', label: '性别', required: true },
    { name: 'age', label: '年龄' },
    { name: 'height', label: '身高' },
    { name: 'appearance', label: '外貌描述' },
    { name: 'personality', label: '性格特点' },
    { name: 'background', label: '出身背景' },
    { name: 'occupation', label: '职业身份' },
    { name: 'powerLevel', label: '实力等级' },
    { name: 'abilities', label: '特殊能力' },
    { name: 'remarks', label: '备注' },
  ];

  const renderControl = useCallback(
    (
      field: ControllerRenderProps<FormValues, FieldPath<FormValues>>,
      name: FieldPath<FormValues>
    ) => {
      if (name === 'type') {
        return (
          <MogeSelect onValueChange={field.onChange} value={field.value as string}>
            <MogeSelectTrigger>
              <MogeSelectValue placeholder="请选择角色类型" />
            </MogeSelectTrigger>
            <MogeSelectContent>
              {characterTypes.map((type) => (
                <MogeSelectItem key={type.value} value={type.value}>
                  {type.label}
                </MogeSelectItem>
              ))}
            </MogeSelectContent>
          </MogeSelect>
        );
      }

      if (name === 'gender') {
        return (
          <MogeSelect onValueChange={field.onChange} value={field.value as string}>
            <MogeSelectTrigger>
              <MogeSelectValue placeholder="请选择性别" />
            </MogeSelectTrigger>
            <MogeSelectContent>
              {genderOptions.map((gender) => (
                <MogeSelectItem key={gender.value} value={gender.value}>
                  {gender.label}
                </MogeSelectItem>
              ))}
            </MogeSelectContent>
          </MogeSelect>
        );
      }

      if (['appearance', 'personality', 'background', 'abilities', 'remark'].includes(name)) {
        const placeholders = {
          appearance: '描述角色的外貌特征、体型等...',
          personality: '描述角色的性格特点、说话方式等...',
          background: '描述角色的出身、成长经历等...',
          abilities: '描述角色的特殊能力、技能等...',
          remark: '其他补充信息...',
        };

        return (
          <MogeTextarea
            rows={3}
            placeholder={placeholders[name as keyof typeof placeholders]}
            value={(field.value as string) || ''}
            onChange={field.onChange}
            onBlur={field.onBlur}
            name={field.name}
          />
        );
      }

      const placeholders = {
        name: '角色姓名',
        age: '例：25岁 或 青年',
        height: '例：175cm',
        occupation: '例：剑客、学生、商人',
        powerLevel: '例：筑基期、A级异能者',
      };

      return (
        <MogeInput
          placeholder={placeholders[name as keyof typeof placeholders] || ''}
          value={(field.value as string) || ''}
          onChange={field.onChange}
          onBlur={field.onBlur}
          name={field.name}
        />
      );
    },
    []
  );

  // 关系管理函数
  const addRelationship = () => {
    setRelationships([
      ...relationships,
      {
        relatedCharacter: '',
        customRelatedCharacter: '',
        relationshipType: '',
        customRelationshipType: '',
        relationshipDesc: '',
      },
    ]);
  };

  const updateRelationship = (index: number, field: keyof Relationship, value: string) => {
    const newRelationships = [...relationships];
    newRelationships[index] = { ...newRelationships[index], [field]: value };
    setRelationships(newRelationships);
  };

  const removeRelationship = (index: number) => {
    setRelationships(relationships.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const submitData = {
        ...values,
        relationships,
      };

      if (isEditMode && character?.id) {
        // 编辑模式 - 将 string id 转换为 number
        const characterId =
          typeof character.id === 'string' ? parseInt(character.id) : character.id;
        await updateCharacter(characterId, submitData as Partial<CharacterSetting>);
        toast.success('角色设定更新成功');
      } else {
        // 创建模式
        await createCharacter(submitData as Partial<CharacterSetting>);
        toast.success('角色设定创建成功');
      }

      // 关闭对话框会触发列表刷新
      if (onOpenChange) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error('保存角色设定失败:', error);
      // 错误由全局错误处理机制处理
    }
  };

  // 渲染关系管理区域
  const renderRelationshipSection = () => (
    <Card
      className="p-4"
      style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
    >
      <div className="mb-3 flex items-center justify-between">
        <Label className="text-sm font-medium text-[var(--moge-text-main)]">角色关系</Label>
        <Button type="button" variant="outline" size="sm" onClick={addRelationship}>
          <Plus className="mr-1 h-3 w-3" />
          添加关系
        </Button>
      </div>
      <div className="space-y-3">
        {relationships.map((relationship, index) => (
          <Card
            key={index}
            className="p-3"
            style={{ backgroundColor: 'var(--moge-bg)', borderColor: 'var(--moge-border)' }}
          >
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-xs text-[var(--moge-text-sub)]">关系 {index + 1}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeRelationship(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="grid gap-3">
              {/* 关联角色选择 */}
              <div>
                <Label className="mb-1 block text-xs text-[var(--moge-text-sub)]">关联角色</Label>
                <MogeSelect
                  value={relationship.relatedCharacter || ''}
                  onValueChange={(value) => {
                    updateRelationship(index, 'relatedCharacter', value);
                    if (value !== 'custom') {
                      updateRelationship(index, 'customRelatedCharacter', '');
                    }
                  }}
                >
                  <MogeSelectTrigger>
                    <MogeSelectValue placeholder="选择角色或自定义" />
                  </MogeSelectTrigger>
                  <MogeSelectContent>
                    <MogeSelectItem value="张三">张三</MogeSelectItem>
                    <MogeSelectItem value="李四">李四</MogeSelectItem>
                    <MogeSelectItem value="王五">王五</MogeSelectItem>
                    <MogeSelectItem value="custom">自定义角色...</MogeSelectItem>
                  </MogeSelectContent>
                </MogeSelect>
                {relationship.relatedCharacter === 'custom' && (
                  <MogeInput
                    placeholder="输入角色名称"
                    value={relationship.customRelatedCharacter || ''}
                    onChange={(e) =>
                      updateRelationship(index, 'customRelatedCharacter', e.target.value)
                    }
                    className="mt-2"
                  />
                )}
              </div>

              {/* 关系类型选择 */}
              <div>
                <Label className="mb-1 block text-xs text-[var(--moge-text-sub)]">关系类型</Label>
                <MogeSelect
                  value={relationship.relationshipType || ''}
                  onValueChange={(value) => {
                    updateRelationship(index, 'relationshipType', value);
                    if (value !== 'custom') {
                      updateRelationship(index, 'customRelationshipType', '');
                    }
                  }}
                >
                  <MogeSelectTrigger>
                    <MogeSelectValue placeholder="选择关系类型" />
                  </MogeSelectTrigger>
                  <MogeSelectContent>
                    {relationshipTypes.map((category) => (
                      <div key={category.category}>
                        {category.options.map((option) => (
                          <MogeSelectItem key={option.value} value={option.value}>
                            {option.label}
                          </MogeSelectItem>
                        ))}
                      </div>
                    ))}
                  </MogeSelectContent>
                </MogeSelect>
                {relationship.relationshipType === 'custom' && (
                  <MogeInput
                    placeholder="输入关系类型"
                    value={relationship.customRelationshipType || ''}
                    onChange={(e) =>
                      updateRelationship(index, 'customRelationshipType', e.target.value)
                    }
                    className="mt-2"
                  />
                )}
              </div>

              {/* 关系描述 */}
              <div>
                <Label className="mb-1 block text-xs text-[var(--moge-text-sub)]">关系描述</Label>
                <MogeTextarea
                  placeholder="描述两人之间的具体关系..."
                  value={relationship.relationshipDesc || ''}
                  onChange={(e) => updateRelationship(index, 'relationshipDesc', e.target.value)}
                  className="min-h-[60px]"
                />
              </div>
            </div>
          </Card>
        ))}
        {relationships.length === 0 && (
          <div className="py-4 text-center text-sm text-[var(--moge-text-muted)]">
            暂无角色关系，点击"添加关系"开始创建
          </div>
        )}
      </div>
    </Card>
  );

  const defaultTrigger = isEditMode ? (
    <Button size="sm" variant="ghost" title="编辑角色信息">
      <Edit className="h-4 w-4" />
    </Button>
  ) : (
    <Button className="gap-2 shadow-[var(--moge-glow-btn)]">
      <Users className="h-4 w-4" />
      新建角色设定
    </Button>
  );

  return (
    <MogeFormDialog
      mode={mode}
      title={isEditMode ? '编辑角色设定' : '新建角色设定'}
      description={isEditMode ? '修改角色信息' : '填写角色信息，创建完整的角色设定'}
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
      createSchema={createCharacterSchema}
      updateSchema={updateCharacterSchema}
      defaultValues={{
        name: '',
        type: '',
        gender: '',
        age: '',
        height: '',
        appearance: '',
        personality: '',
        background: '',
        occupation: '',
        powerLevel: '',
        abilities: '',
        relationships: [],
        tags: [],
        remarks: '',
      }}
      onSubmit={onSubmit}
      fields={fields as FormFieldConfig<CreateCharacterValues | UpdateCharacterValues>[]}
      renderControl={renderControl}
      customSections={[
        {
          title: '角色关系',
          content: renderRelationshipSection(),
        },
      ]}
      defaultTrigger={defaultTrigger}
      maxWidth="4xl"
      item={character}
    />
  );
}
