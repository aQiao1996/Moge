'use client';
import { useCallback } from 'react';
import { Users, Edit } from 'lucide-react';
import { type ControllerRenderProps, type FieldPath } from 'react-hook-form';

import {
  createCharacterSchema,
  updateCharacterSchema,
  type CreateCharacterValues,
  type UpdateCharacterValues,
  type Character,
  characterTypes,
  genderOptions,
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

interface CharacterDialogProps {
  mode: 'create' | 'edit';
  character?: Character;
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

  // 字段配置
  const fields: FieldConfig[] = [
    { name: 'name', label: '角色名称', required: true },
    { name: 'type', label: '角色类型', required: true },
    { name: 'gender', label: '性别', required: true },
    { name: 'age', label: '年龄' },
    { name: 'height', label: '身高' },
    { name: 'appearance', label: '外貌描述' },
    { name: 'specialMarks', label: '特殊标记' },
    { name: 'personality', label: '性格特点' },
    { name: 'background', label: '出身背景' },
    { name: 'occupation', label: '职业身份' },
    { name: 'powerLevel', label: '实力等级' },
    { name: 'abilities', label: '特殊能力' },
    { name: 'remark', label: '备注' },
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
        specialMarks: '例：左脸有疤痕',
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

  const onSubmit = async (values: FormValues) => {
    // TODO: 调用API创建/更新角色
    console.log('Character data:', values);

    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

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
        specialMarks: '',
        personality: '',
        background: '',
        occupation: '',
        powerLevel: '',
        abilities: '',
        relationships: [],
        tags: [],
        remark: '',
      }}
      onSubmit={onSubmit}
      fields={fields as FormFieldConfig<CreateCharacterValues | UpdateCharacterValues>[]}
      renderControl={renderControl}
      customSections={[
        {
          title: '角色关系',
          content: <RelationshipSection />,
        },
      ]}
      defaultTrigger={defaultTrigger}
      maxWidth="4xl"
      item={character}
    />
  );
}

// 角色关系组件
function RelationshipSection() {
  // 这里需要重新实现关系部分，因为它需要访问form context
  // 这是一个挑战，我们需要想办法传递form实例或使用其他方案
  return <div className="text-center text-[var(--moge-text-sub)]">角色关系功能正在重构中...</div>;
}
