import { z } from 'zod';

/**
 * 小说项目创建表单 Schema
 */
export const createProjectSchema = z.object({
  name: z.string().min(1, '项目名称不能为空').max(50, '项目名称不能超过50个字符'),
  type: z.string().min(1, '请选择项目类型'),
  description: z.string().max(500, '项目描述不能超过500个字符').optional(),
  tags: z.array(z.string()).max(10, '标签不能超过10个').optional(),
});

/**
 * 小说项目更新表单 Schema
 */
export const updateProjectSchema = createProjectSchema.partial();

/**
 * 项目创建数据类型
 */
export type CreateProjectValues = z.infer<typeof createProjectSchema>;

/**
 * 项目更新数据类型
 */
export type UpdateProjectValues = z.infer<typeof updateProjectSchema>;
