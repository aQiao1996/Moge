import { z } from 'zod';

// 系统功能模块定义
export const systemModuleSchema = z.object({
  name: z.string().min(1, '请输入功能名称'),
  description: z.string().optional(),
  mechanism: z.string().optional(), // 运作机制
  trigger: z.string().optional(), // 触发条件
  limitation: z.string().optional(), // 限制约束
});

// 等级体系定义
export const levelSystemSchema = z.object({
  name: z.string().min(1, '请输入等级名称'),
  description: z.string().optional(),
  requirement: z.string().optional(), // 升级条件
  benefits: z.string().optional(), // 等级效果
});

// 道具装备定义
export const itemSchema = z.object({
  name: z.string().min(1, '请输入道具名称'),
  category: z.string().optional(), // 道具分类
  description: z.string().optional(),
  attributes: z.string().optional(), // 属性效果
  obtainMethod: z.string().optional(), // 获取途径
});

// 数值参数定义
export const parameterSchema = z.object({
  name: z.string().min(1, '请输入参数名称'),
  value: z.string().optional(), // 参数值或公式
  description: z.string().optional(),
});

// 系统设定表单数据类型
export const systemSchema = z.object({
  name: z.string().min(1, '请输入系统名称'),
  type: z.string().min(1, '请选择系统类型'),
  description: z.string().optional(),

  // 功能模块
  modules: z.array(systemModuleSchema).optional(),

  // 等级体系
  levels: z.array(levelSystemSchema).optional(),

  // 道具装备
  items: z.array(itemSchema).optional(),

  // 数值参数
  parameters: z.array(parameterSchema).optional(),

  // 运作规则
  rules: z.string().optional(),

  // 触发条件
  triggers: z.string().optional(),

  // 限制约束
  constraints: z.string().optional(),

  // 标签
  tags: z.array(z.string()).optional(),

  // 备注
  remarks: z.string().optional(),
});

// 创建系统设定的schema
export const createSystemSchema = systemSchema;

// 更新系统设定的schema
export const updateSystemSchema = systemSchema.partial().extend({
  id: z.string(),
});

// 导出类型
export type SystemModule = z.infer<typeof systemModuleSchema>;
export type LevelSystem = z.infer<typeof levelSystemSchema>;
export type Item = z.infer<typeof itemSchema>;
export type Parameter = z.infer<typeof parameterSchema>;
export type System = z.infer<typeof systemSchema>;
export type CreateSystemValues = z.infer<typeof createSystemSchema>;
export type UpdateSystemValues = z.infer<typeof updateSystemSchema>;

// 系统类型选项
export const systemTypes = [
  { value: 'upgrade', label: '升级系统' },
  { value: 'signin', label: '签到系统' },
  { value: 'lottery', label: '抽奖系统' },
  { value: 'shop', label: '商城系统' },
  { value: 'task', label: '任务系统' },
  { value: 'achievement', label: '成就系统' },
  { value: 'cultivation', label: '修炼系统' },
  { value: 'combat', label: '战斗系统' },
  { value: 'equipment', label: '装备系统' },
  { value: 'skill', label: '技能系统' },
  { value: 'talent', label: '天赋系统' },
  { value: 'attribute', label: '属性系统' },
  { value: 'synthesis', label: '合成系统' },
  { value: 'copy', label: '副本系统' },
  { value: 'guild', label: '公会系统' },
  { value: 'pet', label: '宠物系统' },
  { value: 'other', label: '其他系统' },
] as const;

// 道具分类选项
export const itemCategories = [
  { value: 'weapon', label: '武器' },
  { value: 'armor', label: '防具' },
  { value: 'accessory', label: '饰品' },
  { value: 'consumable', label: '消耗品' },
  { value: 'material', label: '材料' },
  { value: 'treasure', label: '宝物' },
  { value: 'skill_book', label: '技能书' },
  { value: 'formula', label: '配方' },
  { value: 'other', label: '其他' },
] as const;
