import { z } from 'zod';

// 灵感记录定义
export const ideaRecordSchema = z.object({
  title: z.string().min(1, '请输入灵感标题'),
  type: z.string().optional(), // 灵感类型：剧情、角色、设定、对话等
  content: z.string().optional(),
  source: z.string().optional(), // 灵感来源
  priority: z.string().optional(), // 优先级：高、中、低
  status: z.string().optional(), // 状态：待开发、已使用、已废弃
  relatedChapters: z.string().optional(), // 相关章节
});

// 参考资料定义
export const referenceMaterialSchema = z.object({
  title: z.string().min(1, '请输入资料标题'),
  type: z.string().optional(), // 资料类型：图片、文档、链接、音频、视频
  content: z.string().optional(),
  url: z.string().optional(), // 链接地址
  filePath: z.string().optional(), // 文件路径
  description: z.string().optional(),
  tags: z.string().optional(), // 标签
  source: z.string().optional(), // 来源
});

// 创作笔记定义
export const creativeNoteSchema = z.object({
  title: z.string().min(1, '请输入笔记标题'),
  type: z.string().optional(), // 笔记类型：大纲草稿、人物关系、情节线索、章节规划
  content: z.string().optional(),
  relatedChapters: z.string().optional(), // 相关章节
  importance: z.string().optional(), // 重要程度
  lastModified: z.string().optional(), // 最后修改时间
});

// 专业术语定义
export const terminologySchema = z.object({
  term: z.string().min(1, '请输入术语名称'),
  category: z.string().optional(), // 分类：武技、法术、官职、地名、物品等
  definition: z.string().optional(), // 术语解释
  pronunciation: z.string().optional(), // 发音/读音
  usage: z.string().optional(), // 使用场景
  examples: z.string().optional(), // 使用示例
  relatedTerms: z.string().optional(), // 相关术语
});

// 模板库定义
export const templateSchema = z.object({
  name: z.string().min(1, '请输入模板名称'),
  type: z.string().optional(), // 模板类型：剧情桥段、对话模板、场景描述、战斗描述
  content: z.string().optional(),
  description: z.string().optional(),
  useCount: z.number().optional(), // 使用次数
  variables: z.string().optional(), // 可变参数说明
  tags: z.string().optional(), // 标签
});

// 项目标签定义
export const projectTagSchema = z.object({
  name: z.string().min(1, '请输入标签名称'),
  category: z.string().optional(), // 标签分类：角色、情节、设定、风格等
  description: z.string().optional(),
  color: z.string().optional(), // 标签颜色
  useCount: z.number().optional(), // 使用次数
  relatedContent: z.string().optional(), // 关联内容
});

// 辅助设定表单数据类型
export const miscSchema = z.object({
  // 基础信息
  name: z.string().min(1, '请输入辅助设定名称'),
  type: z.string().min(1, '请选择辅助设定类型'),
  description: z.string().optional(), // 整体描述

  // 各类辅助内容 - 字段名匹配数据库
  inspirations: z.array(ideaRecordSchema).optional(),
  references: z.array(referenceMaterialSchema).optional(),
  notes: z.array(creativeNoteSchema).optional(),
  terminology: z.array(terminologySchema).optional(),
  templates: z.array(templateSchema).optional(),
  projectTags: z.array(projectTagSchema).optional(),

  // 标签和备注
  tags: z.array(z.string()).optional(),
  remarks: z.string().optional(),
});

// 创建辅助设定的schema
export const createMiscSchema = miscSchema;

// 更新辅助设定的schema
export const updateMiscSchema = miscSchema.partial().extend({
  id: z.string(),
});

// 导出类型
export type IdeaRecord = z.infer<typeof ideaRecordSchema>;
export type ReferenceMaterial = z.infer<typeof referenceMaterialSchema>;
export type CreativeNote = z.infer<typeof creativeNoteSchema>;
export type Terminology = z.infer<typeof terminologySchema>;
export type Template = z.infer<typeof templateSchema>;
export type ProjectTag = z.infer<typeof projectTagSchema>;
export type Misc = z.infer<typeof miscSchema>;
export type CreateMiscValues = z.infer<typeof createMiscSchema>;
export type UpdateMiscValues = z.infer<typeof updateMiscSchema>;

// 辅助设定类型选项
export const miscTypes = [
  { value: 'creative_tools', label: '创作工具集' },
  { value: 'idea_collection', label: '灵感收集' },
  { value: 'reference_library', label: '参考资料库' },
  { value: 'terminology_dict', label: '术语词典' },
  { value: 'template_bank', label: '模板库' },
  { value: 'project_notes', label: '项目笔记' },
  { value: 'other', label: '其他类型' },
] as const;

// 灵感类型选项
export const ideaTypes = [
  { value: 'plot', label: '剧情灵感' },
  { value: 'character', label: '角色灵感' },
  { value: 'setting', label: '设定灵感' },
  { value: 'dialogue', label: '对话灵感' },
  { value: 'scene', label: '场景灵感' },
  { value: 'conflict', label: '冲突灵感' },
  { value: 'twist', label: '转折灵感' },
  { value: 'ending', label: '结局灵感' },
  { value: 'other', label: '其他' },
] as const;

// 参考资料类型选项
export const materialTypes = [
  { value: 'image', label: '图片素材' },
  { value: 'document', label: '文档资料' },
  { value: 'link', label: '网页链接' },
  { value: 'audio', label: '音频资料' },
  { value: 'video', label: '视频资料' },
  { value: 'book', label: '书籍资料' },
  { value: 'article', label: '文章资料' },
  { value: 'research', label: '研究资料' },
  { value: 'other', label: '其他' },
] as const;

// 笔记类型选项
export const noteTypes = [
  { value: 'outline_draft', label: '大纲草稿' },
  { value: 'character_relations', label: '人物关系' },
  { value: 'plot_thread', label: '情节线索' },
  { value: 'chapter_plan', label: '章节规划' },
  { value: 'timeline', label: '时间线' },
  { value: 'worldbuilding', label: '世界构建' },
  { value: 'research_notes', label: '调研笔记' },
  { value: 'revision_notes', label: '修改笔记' },
  { value: 'other', label: '其他' },
] as const;

// 术语分类选项
export const terminologyCategories = [
  { value: 'martial_arts', label: '武技招式' },
  { value: 'magic_spell', label: '法术咒语' },
  { value: 'official_title', label: '官职称谓' },
  { value: 'place_name', label: '地名场所' },
  { value: 'item_name', label: '物品道具' },
  { value: 'skill_ability', label: '技能能力' },
  { value: 'organization', label: '组织机构' },
  { value: 'cultural_term', label: '文化术语' },
  { value: 'technical_term', label: '专业术语' },
  { value: 'slang', label: '俚语方言' },
  { value: 'other', label: '其他' },
] as const;

// 模板类型选项
export const templateTypes = [
  { value: 'plot_bridge', label: '剧情桥段' },
  { value: 'dialogue_template', label: '对话模板' },
  { value: 'scene_description', label: '场景描述' },
  { value: 'battle_description', label: '战斗描述' },
  { value: 'character_intro', label: '角色介绍' },
  { value: 'emotion_expression', label: '情感表达' },
  { value: 'transition', label: '过渡转场' },
  { value: 'suspense_building', label: '悬念营造' },
  { value: 'other', label: '其他' },
] as const;

// 标签分类选项
export const tagCategories = [
  { value: 'character', label: '角色相关' },
  { value: 'plot', label: '情节相关' },
  { value: 'setting', label: '设定相关' },
  { value: 'style', label: '风格相关' },
  { value: 'theme', label: '主题相关' },
  { value: 'mood', label: '氛围相关' },
  { value: 'genre', label: '类型相关' },
  { value: 'technical', label: '技法相关' },
  { value: 'other', label: '其他' },
] as const;
