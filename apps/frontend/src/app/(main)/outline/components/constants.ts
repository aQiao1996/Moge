import type { Outline } from '@moge/types';

/**
 * 大纲状态配置映射
 * 定义了各种状态对应的显示文本和徽章样式
 */
export const statusConfig: Record<
  NonNullable<Outline['status']>,
  { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  DRAFT: { text: '草稿', variant: 'secondary' },
  GENERATING: { text: '生成中', variant: 'outline' },
  GENERATED: { text: '已生成', variant: 'secondary' },
  PUBLISHED: { text: '已完成', variant: 'default' },
  DISCARDED: { text: '已放弃', variant: 'destructive' },
};
