import { z } from 'zod';

// 地理环境定义
export const geographicLocationSchema = z.object({
  name: z.string().min(1, '请输入地点名称'),
  type: z.string().optional(), // 地点类型：城市、山脉、河流等
  description: z.string().optional(),
  climate: z.string().optional(), // 气候条件
  terrain: z.string().optional(), // 地形地貌
  specialFeatures: z.string().optional(), // 特殊特征
});

// 政治势力定义
export const politicalForceSchema = z.object({
  name: z.string().min(1, '请输入势力名称'),
  type: z.string().optional(), // 势力类型：国家、门派、家族等
  description: z.string().optional(),
  territory: z.string().optional(), // 控制区域
  leadership: z.string().optional(), // 领导结构
  ideology: z.string().optional(), // 核心理念
  strength: z.string().optional(), // 实力等级
  relationships: z.string().optional(), // 对外关系
});

// 文化习俗定义
export const culturalCustomSchema = z.object({
  name: z.string().min(1, '请输入习俗名称'),
  category: z.string().optional(), // 分类：节日、仪式、传统等
  description: z.string().optional(),
  origin: z.string().optional(), // 起源
  significance: z.string().optional(), // 意义
  practices: z.string().optional(), // 具体做法
});

// 修炼/力量体系等级定义
export const cultivationLevelSchema = z.object({
  name: z.string().min(1, '请输入境界名称'),
  rank: z.number().optional(), // 等级序号
  description: z.string().optional(),
  requirements: z.string().optional(), // 突破条件
  abilities: z.string().optional(), // 境界能力
  lifespan: z.string().optional(), // 寿命影响
  resources: z.string().optional(), // 所需资源
});

// 历史事件定义
export const historicalEventSchema = z.object({
  name: z.string().min(1, '请输入事件名称'),
  timeframe: z.string().optional(), // 时间段
  description: z.string().optional(),
  participants: z.string().optional(), // 参与者
  causes: z.string().optional(), // 起因
  consequences: z.string().optional(), // 后果
  significance: z.string().optional(), // 历史意义
});

// 历史人物定义
export const historicalFigureSchema = z.object({
  name: z.string().min(1, '请输入人物名称'),
  title: z.string().optional(), // 称号
  era: z.string().optional(), // 所处时代
  description: z.string().optional(),
  achievements: z.string().optional(), // 主要成就
  background: z.string().optional(), // 背景故事
  legacy: z.string().optional(), // 历史影响
});

// 世界设定表单数据类型
export const worldSchema = z.object({
  // 基础信息
  name: z.string().min(1, '请输入世界名称'),
  type: z.string().min(1, '请选择世界类型'),
  era: z.string().optional(), // 时代背景
  description: z.string().optional(), // 整体描述

  // 地理环境
  generalClimate: z.string().optional(), // 总体气候
  majorTerrain: z.string().optional(), // 主要地形
  geographicLocations: z.array(geographicLocationSchema).optional(),

  // 政治势力
  politicalSystem: z.string().optional(), // 政治制度
  majorConflicts: z.string().optional(), // 主要冲突
  politicalForces: z.array(politicalForceSchema).optional(),

  // 文化体系
  socialStructure: z.string().optional(), // 社会结构
  languages: z.string().optional(), // 语言文字
  religions: z.string().optional(), // 宗教信仰
  culturalCustoms: z.array(culturalCustomSchema).optional(),

  // 修炼/力量体系
  powerSystemName: z.string().optional(), // 力量体系名称
  powerSystemDescription: z.string().optional(), // 体系描述
  cultivationResources: z.string().optional(), // 修炼资源
  cultivationLevels: z.array(cultivationLevelSchema).optional(),

  // 历史脉络
  worldHistory: z.string().optional(), // 世界历史概述
  currentEvents: z.string().optional(), // 当前时代事件
  historicalEvents: z.array(historicalEventSchema).optional(),
  historicalFigures: z.array(historicalFigureSchema).optional(),

  // 标签和备注
  tags: z.array(z.string()).optional(),
  remark: z.string().optional(),
});

// 创建世界设定的schema
export const createWorldSchema = worldSchema;

// 更新世界设定的schema
export const updateWorldSchema = worldSchema.partial().extend({
  id: z.string(),
});

// 导出类型
export type GeographicLocation = z.infer<typeof geographicLocationSchema>;
export type PoliticalForce = z.infer<typeof politicalForceSchema>;
export type CulturalCustom = z.infer<typeof culturalCustomSchema>;
export type CultivationLevel = z.infer<typeof cultivationLevelSchema>;
export type HistoricalEvent = z.infer<typeof historicalEventSchema>;
export type HistoricalFigure = z.infer<typeof historicalFigureSchema>;
export type World = z.infer<typeof worldSchema>;
export type CreateWorldValues = z.infer<typeof createWorldSchema>;
export type UpdateWorldValues = z.infer<typeof updateWorldSchema>;

// 世界类型选项
export const worldTypes = [
  { value: 'fantasy', label: '奇幻世界' },
  { value: 'cultivation', label: '修仙世界' },
  { value: 'modern_urban', label: '现代都市' },
  { value: 'historical', label: '历史架空' },
  { value: 'sci_fi', label: '科幻未来' },
  { value: 'apocalypse', label: '末世废土' },
  { value: 'martial_arts', label: '武侠江湖' },
  { value: 'magic', label: '魔法世界' },
  { value: 'steampunk', label: '蒸汽朋克' },
  { value: 'cyberpunk', label: '赛博朋克' },
  { value: 'ancient', label: '上古洪荒' },
  { value: 'other', label: '其他类型' },
] as const;

// 地点类型选项
export const locationTypes = [
  { value: 'city', label: '城市' },
  { value: 'town', label: '城镇' },
  { value: 'village', label: '村庄' },
  { value: 'mountain', label: '山脉' },
  { value: 'river', label: '河流' },
  { value: 'lake', label: '湖泊' },
  { value: 'forest', label: '森林' },
  { value: 'desert', label: '沙漠' },
  { value: 'plain', label: '平原' },
  { value: 'valley', label: '山谷' },
  { value: 'island', label: '岛屿' },
  { value: 'ruin', label: '遗迹' },
  { value: 'dungeon', label: '地下城' },
  { value: 'secret_realm', label: '秘境' },
  { value: 'other', label: '其他' },
] as const;

// 势力类型选项
export const forceTypes = [
  { value: 'nation', label: '国家' },
  { value: 'kingdom', label: '王国' },
  { value: 'empire', label: '帝国' },
  { value: 'sect', label: '宗门' },
  { value: 'clan', label: '家族' },
  { value: 'guild', label: '公会' },
  { value: 'organization', label: '组织' },
  { value: 'religion', label: '宗教' },
  { value: 'academy', label: '学院' },
  { value: 'mercenary', label: '佣兵团' },
  { value: 'rebel', label: '反叛军' },
  { value: 'corporation', label: '公司' },
  { value: 'other', label: '其他' },
] as const;

// 文化习俗分类选项
export const customCategories = [
  { value: 'festival', label: '节日庆典' },
  { value: 'ritual', label: '仪式典礼' },
  { value: 'tradition', label: '传统习俗' },
  { value: 'etiquette', label: '礼仪规范' },
  { value: 'lifestyle', label: '生活方式' },
  { value: 'belief', label: '信仰习惯' },
  { value: 'art', label: '艺术文化' },
  { value: 'education', label: '教育制度' },
  { value: 'marriage', label: '婚姻制度' },
  { value: 'other', label: '其他' },
] as const;
