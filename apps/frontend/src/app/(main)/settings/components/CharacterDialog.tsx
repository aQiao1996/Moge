'use client';
import { useCallback, useState, useEffect } from 'react';
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
  CharacterType,
  Gender,
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

/**
 * 角色对话框组件属性接口
 */
interface CharacterDialogProps {
  mode: 'create' | 'edit';
  character?: Character & { id?: string | number };
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * 表单数据类型联合
 * 支持创建和更新两种模式
 */
type FormValues = CreateCharacterValues | UpdateCharacterValues;

/**
 * 角色设定创建/编辑对话框组件
 * 支持角色基本信息的填写、角色关系管理等功能
 *
 * @param mode 对话框模式 'create' | 'edit'
 * @param character 编辑模式时的角色数据
 * @param trigger 触发对话框的自定义元素
 * @param open 对话框是否打开
 * @param onOpenChange 对话框状态变化回调
 */
export default function CharacterDialog({
  mode,
  character,
  trigger,
  open,
  onOpenChange,
}: CharacterDialogProps) {
  const isEditMode = mode === 'edit';

  // 关系状态管理
  const [relationships, setRelationships] = useState<Relationship[]>([]);

  // 当对话框打开且有角色数据时，同步关系数据
  useEffect(() => {
    if (open && isEditMode && character?.relationships) {
      setRelationships(character.relationships as Relationship[]);
    } else if (open && !isEditMode) {
      setRelationships([]);
    }
  }, [open, isEditMode, character]);

  /**
   * 表单字段配置
   * 定义角色设定表单的所有字段
   */
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

  /**
   * 将数字类型的枚举值转换为字符串
   * 用于在 MogeSelect 组件中显示
   *
   * @param value 枚举值(可能是 number 或其他类型)
   * @returns 转换后的字符串值
   */
  const toSelectValue = (value: unknown): string => {
    if (typeof value === 'number') return String(value);
    return '';
  };

  /**
   * 渲染表单控件
   * 根据字段名称返回对应的输入组件
   *
   * @param field 表单字段控制器属性
   * @param name 字段名称
   * @returns 对应的表单控件 JSX 元素
   */
  const renderControl = useCallback(
    (
      field: ControllerRenderProps<FormValues, FieldPath<FormValues>>,
      name: FieldPath<FormValues>
    ) => {
      // 处理角色类型选择
      if (name === 'type') {
        return (
          <MogeSelect
            onValueChange={(value) => field.onChange(Number(value))}
            value={toSelectValue(field.value)}
          >
            <MogeSelectTrigger>
              <MogeSelectValue placeholder="请选择角色类型" />
            </MogeSelectTrigger>
            <MogeSelectContent>
              {characterTypes.map((type) => (
                <MogeSelectItem key={type.value} value={type.value.toString()}>
                  {type.label}
                </MogeSelectItem>
              ))}
            </MogeSelectContent>
          </MogeSelect>
        );
      }

      // 处理性别选择
      if (name === 'gender') {
        return (
          <MogeSelect
            onValueChange={(value) => field.onChange(Number(value))}
            value={toSelectValue(field.value)}
          >
            <MogeSelectTrigger>
              <MogeSelectValue placeholder="请选择性别" />
            </MogeSelectTrigger>
            <MogeSelectContent>
              {genderOptions.map((gender) => (
                <MogeSelectItem key={gender.value} value={gender.value.toString()}>
                  {gender.label}
                </MogeSelectItem>
              ))}
            </MogeSelectContent>
          </MogeSelect>
        );
      }

      // 处理多行文本字段(外貌、性格、背景等)
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

  /**
   * 添加新的角色关系
   * 向关系列表中添加一个空的关系对象
   */
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

  /**
   * 更新指定索引的关系数据
   *
   * @param index 关系在列表中的索引
   * @param field 要更新的字段名
   * @param value 新的字段值
   */
  const updateRelationship = (index: number, field: keyof Relationship, value: string) => {
    const newRelationships = [...relationships];
    newRelationships[index] = { ...newRelationships[index], [field]: value };
    setRelationships(newRelationships);
  };

  /**
   * 移除指定索引的关系
   *
   * @param index 要移除的关系索引
   */
  const removeRelationship = (index: number) => {
    setRelationships(relationships.filter((_, i) => i !== index));
  };

  /**
   * 表单提交处理
   * 调用 API 创建或更新角色设定,并显示相应的提示
   *
   * @param values 表单数据
   */
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
    }
  };

  /**
   * 渲染角色关系管理区域
   * 包含关系列表和添加、编辑、删除功能
   *
   * @returns 关系管理区域的 JSX 元素
   */
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
      item={isEditMode ? character : undefined}
      defaultValues={{
        name: '',
        type: CharacterType.PROTAGONIST,
        gender: Gender.MALE,
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
    />
  );
}
