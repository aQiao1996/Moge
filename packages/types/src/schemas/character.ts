import { z } from 'zod';

// 角色关系类型定义
export const relationshipSchema = z.object({
  relatedCharacter: z.string().optional(),
  customRelatedCharacter: z.string().optional(), // 自定义角色名
  relationshipType: z.string().min(1, '请选择关系类型'),
  customRelationshipType: z.string().optional(), // 自定义关系类型
  relationshipDesc: z.string().optional(),
});

// 角色设定表单数据类型
export const characterSchema = z.object({
  name: z.string().min(1, '请输入角色名称'),
  type: z.string().min(1, '请选择角色类型'),
  gender: z.string().min(1, '请选择性别'),
  age: z.string().optional(),
  height: z.string().optional(),
  appearance: z.string().optional(),
  personality: z.string().optional(),
  background: z.string().optional(),
  occupation: z.string().optional(),
  powerLevel: z.string().optional(),
  abilities: z.string().optional(),
  relationships: z.array(relationshipSchema).optional(),
  tags: z.array(z.string()).optional(),
  remarks: z.string().optional(),
});

// 创建角色设定的schema
export const createCharacterSchema = characterSchema;

// 更新角色设定的schema
export const updateCharacterSchema = characterSchema.partial().extend({
  id: z.union([z.string(), z.number()]),
});

// 导出类型
export type Relationship = z.infer<typeof relationshipSchema>;
export type Character = z.infer<typeof characterSchema>;
export type CreateCharacterValues = z.infer<typeof createCharacterSchema>;
export type UpdateCharacterValues = z.infer<typeof updateCharacterSchema>;

// 角色类型选项
export const characterTypes = [
  { value: 'protagonist', label: '主角' },
  { value: 'important', label: '重要配角' },
  { value: 'supporting', label: '普通配角' },
  { value: 'antagonist', label: '反派' },
  { value: 'minor', label: '路人' },
] as const;

// 性别选项
export const genderOptions = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' },
] as const;

// 关系类型选项
export const relationshipTypes = [
  {
    category: '家庭关系',
    options: [
      { value: 'father', label: '父亲' },
      { value: 'mother', label: '母亲' },
      { value: 'son', label: '儿子' },
      { value: 'daughter', label: '女儿' },
      { value: 'brother', label: '兄弟' },
      { value: 'sister', label: '姐妹' },
      { value: 'spouse', label: '配偶' },
    ],
  },
  {
    category: '社会关系',
    options: [
      { value: 'master', label: '师父' },
      { value: 'disciple', label: '徒弟' },
      { value: 'friend', label: '朋友' },
      { value: 'colleague', label: '同事' },
      { value: 'boss', label: '上司' },
      { value: 'subordinate', label: '下属' },
    ],
  },
  {
    category: '情感关系',
    options: [
      { value: 'lover', label: '恋人' },
      { value: 'crush', label: '暗恋对象' },
      { value: 'ex', label: '前任' },
      { value: 'enemy', label: '仇人' },
      { value: 'rival', label: '死敌' },
    ],
  },
  { category: '其他', options: [{ value: 'custom', label: '自定义...' }] },
] as const;
