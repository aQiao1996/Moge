/**
 * 字典工具函数
 * 提供字典值到标签的转换功能
 */

import type { Dict } from '@moge/types';

/**
 * 根据字典项数组和值获取对应的标签
 * @param items 字典项数组
 * @param value 值（如 'fantasy'）
 * @returns 标签（如 '玄幻'），如果未找到则返回原值
 */
export function getDictLabel(items: Dict[], value: string | undefined | null): string {
  if (!value) return '';
  const item = items.find((item) => item.value === value);
  return item ? item.label : value;
}

/**
 * 根据字典项数组和标签获取对应的值
 * @param items 字典项数组
 * @param label 标签（如 '玄幻'）
 * @returns 值（如 'fantasy'），如果未找到则返回 undefined
 */
export function getDictValue(items: Dict[], label: string | undefined | null): string | undefined {
  if (!label) return undefined;
  const item = items.find((item) => item.label === label);
  return item?.value;
}
