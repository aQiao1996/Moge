'use client';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Users, Edit, Plus, Trash2 } from 'lucide-react';
import {
  useForm,
  useFieldArray,
  type ControllerRenderProps,
  type FieldPath,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  createCharacterSchema,
  updateCharacterSchema,
  type CreateCharacterValues,
  type UpdateCharacterValues,
  type Character,
  characterTypes,
  genderOptions,
  relationshipTypes,
} from '@moge/types';

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
import { Card } from '@/components/ui/card';

// 模拟已有角色数据（后续从API获取）
const mockCharacters = [
  { id: '1', name: '张三', type: 'protagonist' },
  { id: '2', name: '李四', type: 'antagonist' },
  { id: '3', name: '王五', type: 'supporting' },
];

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
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: CharacterDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen;

  const isEditMode = mode === 'edit';
  const schema = isEditMode ? updateCharacterSchema : createCharacterSchema;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
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
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'relationships',
  });

  useEffect(() => {
    if (open) {
      if (isEditMode && character) {
        form.reset(character);
      } else if (!isEditMode) {
        form.reset({
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
        });
      }
    }
  }, [open, isEditMode, character, form]);

  const onSubmit = async (values: FormValues) => {
    toast.dismiss();
    setSubmitting(true);
    try {
      // TODO: 调用API创建/更新角色
      console.log('Character data:', values);

      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(isEditMode ? '角色更新成功' : '角色创建成功');
      setOpen(false);
    } catch {
      toast.error(isEditMode ? '更新角色失败' : '创建角色失败');
    } finally {
      setSubmitting(false);
    }
  };

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

  const addRelationship = () => {
    append({
      relatedCharacter: '',
      customRelatedCharacter: '',
      relationshipType: '',
      customRelationshipType: '',
      relationshipDesc: '',
    });
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

  const dialogContent = (
    <DialogContent
      className="home-area max-h-[90vh] w-full max-w-4xl overflow-y-auto border backdrop-blur-xl"
      style={{
        backgroundColor: 'var(--moge-dialog-bg)',
        borderColor: 'var(--moge-dialog-border)',
        color: 'var(--moge-text-main)',
      }}
    >
      <DialogHeader>
        <DialogTitle>{isEditMode ? '编辑角色设定' : '新建角色设定'}</DialogTitle>
        <DialogDescription style={{ color: 'var(--moge-text-sub)' }}>
          {isEditMode ? '修改角色信息' : '填写角色信息，创建完整的角色设定'}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {/* 基础信息表单 */}
        <HookForm
          form={form}
          fields={[
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
          ]}
          loading={false}
          renderControl={renderControl}
          onSubmit={() => {}} // 不使用HookForm的提交
          renderSubmitButton={() => null} // 隐藏HookForm的提交按钮
        />

        {/* 角色关系部分 */}
        <div>
          <h3 className="mb-4 text-lg font-medium text-[var(--moge-text-main)]">角色关系</h3>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <Card
                key={field.id}
                className="p-4"
                style={{
                  backgroundColor: 'var(--moge-card-bg)',
                  borderColor: 'var(--moge-card-border)',
                }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-medium text-[var(--moge-text-main)]">
                    关系 {index + 1}
                  </h4>
                  <Button type="button" size="sm" variant="ghost" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--moge-text-main)]">
                        关联角色
                      </label>
                      <div className="space-y-2">
                        <MogeSelect
                          onValueChange={(value) => {
                            form.setValue(`relationships.${index}.relatedCharacter`, value);
                            if (value !== 'custom') {
                              form.setValue(`relationships.${index}.customRelatedCharacter`, '');
                            }
                          }}
                          value={form.watch(`relationships.${index}.relatedCharacter`) || ''}
                        >
                          <MogeSelectTrigger>
                            <MogeSelectValue placeholder="选择现有角色或自定义" />
                          </MogeSelectTrigger>
                          <MogeSelectContent>
                            <MogeSelectItem value="custom">自定义角色...</MogeSelectItem>
                            {mockCharacters.map((char) => (
                              <MogeSelectItem key={char.id} value={char.id}>
                                {char.name}
                              </MogeSelectItem>
                            ))}
                          </MogeSelectContent>
                        </MogeSelect>

                        {/* 自定义角色名输入框 */}
                        {form.watch(`relationships.${index}.relatedCharacter`) === 'custom' && (
                          <MogeInput
                            placeholder="请输入角色名称..."
                            {...form.register(`relationships.${index}.customRelatedCharacter`)}
                          />
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--moge-text-main)]">
                        关系类型
                      </label>
                      <MogeSelect
                        onValueChange={(value) => {
                          form.setValue(`relationships.${index}.relationshipType`, value);
                          if (value !== 'custom') {
                            form.setValue(`relationships.${index}.customRelationshipType`, '');
                          }
                        }}
                        value={form.watch(`relationships.${index}.relationshipType`) || ''}
                      >
                        <MogeSelectTrigger>
                          <MogeSelectValue placeholder="选择关系" />
                        </MogeSelectTrigger>
                        <MogeSelectContent>
                          {relationshipTypes.map((category) => (
                            <div key={category.category}>
                              <div className="px-2 py-1 text-xs font-medium text-[var(--moge-text-muted)]">
                                {category.category}
                              </div>
                              {category.options.map((option) => (
                                <MogeSelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </MogeSelectItem>
                              ))}
                            </div>
                          ))}
                        </MogeSelectContent>
                      </MogeSelect>
                    </div>
                  </div>

                  {/* 自定义关系类型输入框 */}
                  {form.watch(`relationships.${index}.relationshipType`) === 'custom' && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--moge-text-main)]">
                        自定义关系类型
                      </label>
                      <MogeInput
                        placeholder="请输入自定义关系类型..."
                        {...form.register(`relationships.${index}.customRelationshipType`)}
                      />
                    </div>
                  )}

                  {/* 关系描述 */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--moge-text-main)]">
                      关系描述
                    </label>
                    <MogeInput
                      placeholder="详细描述这段关系..."
                      {...form.register(`relationships.${index}.relationshipDesc`)}
                    />
                  </div>
                </div>
              </Card>
            ))}
            <Button type="button" variant="outline" onClick={addRelationship} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              添加关系
            </Button>
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button
            type="button"
            onClick={() => void form.handleSubmit(onSubmit)()}
            disabled={submitting}
            className="shadow-[var(--moge-glow-btn)]"
          >
            {submitting ? '处理中...' : isEditMode ? '保存' : '创建'}
          </Button>
        </div>
      </div>
    </DialogContent>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>}
      {dialogContent}
    </Dialog>
  );
}
