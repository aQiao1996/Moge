import { z } from 'zod';

// 字典分类定义
export const dictCategorySchema = z.object({
  id: z.number(),
  code: z.string().min(1, '请输入分类编码'),
  name: z.string().min(1, '请输入分类名称'),
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// 字典项定义
export const dictItemSchema = z.object({
  id: z.number(),
  categoryCode: z.string().min(1, '请选择所属分类'),
  label: z.string().min(1, '请输入显示标签'),
  value: z.string().min(1, '请输入存储值'),
  sortOrder: z.number().default(0),
  isEnabled: z.boolean().default(true),
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// 创建字典分类的schema
export const createDictCategorySchema = z.object({
  code: z.string().min(1, '请输入分类编码'),
  name: z.string().min(1, '请输入分类名称'),
  description: z.string().optional(),
});

// 更新字典分类的schema
export const updateDictCategorySchema = createDictCategorySchema.partial();

// 创建字典项的schema
export const createDictItemSchema = z.object({
  categoryCode: z.string().min(1, '请选择所属分类'),
  label: z.string().min(1, '请输入显示标签'),
  value: z.string().min(1, '请输入存储值'),
  sortOrder: z.number().default(0),
  isEnabled: z.boolean().default(true),
  description: z.string().optional(),
});

// 更新字典项的schema
export const updateDictItemSchema = createDictItemSchema.partial();

// 导出类型
export type DictCategory = z.infer<typeof dictCategorySchema>;
export type DictItem = z.infer<typeof dictItemSchema>;
export type CreateDictCategoryValues = z.infer<typeof createDictCategorySchema>;
export type UpdateDictCategoryValues = z.infer<typeof updateDictCategorySchema>;
export type CreateDictItemValues = z.infer<typeof createDictItemSchema>;
export type UpdateDictItemValues = z.infer<typeof updateDictItemSchema>;

// 预设的字典分类
export const dictCategories = [
  {
    code: 'novel_types',
    name: '小说类型',
    description: '小说的类型分类，如玄幻、都市、历史等',
  },
  {
    code: 'novel_tags',
    name: '小说标签',
    description: '小说的标签库，按不同维度分类管理',
  },
  {
    code: 'character_types',
    name: '角色类型',
    description: '角色的类型分类，如主角、配角、反派等',
  },
  {
    code: 'system_types',
    name: '系统类型',
    description: '金手指系统的类型分类',
  },
  {
    code: 'world_types',
    name: '世界类型',
    description: '世界背景的类型分类',
  },
  {
    code: 'misc_types',
    name: '辅助设定类型',
    description: '辅助设定的类型分类',
  },
  {
    code: 'terminology',
    name: '专业术语',
    description: '各行业专业词汇、技术名词等',
  },
  {
    code: 'templates',
    name: '模板库',
    description: '常用的剧情桥段、对话模板等',
  },
] as const;

// 字典标签分类定义
export const dictTagCategories = [
  {
    code: 'theme_tags',
    name: '题材标签',
    description: '修仙、穿越、重生、系统、异能、末世等',
  },
  {
    code: 'style_tags',
    name: '风格标签',
    description: '热血、爽文、虐文、轻松、搞笑、治愈等',
  },
  {
    code: 'plot_tags',
    name: '情节标签',
    description: '复仇、成长、争霸、探险、恋爱、商战等',
  },
  {
    code: 'character_tags',
    name: '角色标签',
    description: '废材流、天才流、老怪流、女强、男强等',
  },
] as const;
