import httpRequest from '@/lib/request';
import type { Dict, CreateDictItemValues, UpdateDictItemValues } from '@moge/types';

/**
 * 根据类型获取字典数据
 * @param type 字典类型代码
 * @returns 字典项数组
 */
export const getDictApi = (type: string) => {
  return httpRequest.get<Dict[]>('/dict', { type });
};

/**
 * 获取字典统计数据
 * 返回各分类的词条数量统计
 * @returns 包含分类代码和数量的统计数组
 */
export const getDictStatisticsApi = () => {
  return httpRequest.get<{ categoryCode: string; count: number }[]>('/dict/statistics');
};

/**
 * 创建新的字典项
 * @param data 字典项数据
 * @returns 创建的字典项对象
 */
export const createDictItemApi = (data: CreateDictItemValues) => {
  return httpRequest.post<Dict>('/dict', data);
};

/**
 * 更新字典项信息
 * @param id 字典项ID
 * @param data 更新数据
 * @returns 更新后的字典项对象
 */
export const updateDictItemApi = (id: number, data: UpdateDictItemValues) => {
  return httpRequest.put<Dict>(`/dict/${id}`, data);
};

/**
 * 删除字典项
 * @param id 字典项ID
 */
export const deleteDictItemApi = (id: number) => {
  return httpRequest.delete(`/dict/${id}`);
};

/**
 * 切换字典项启用状态
 * @param id 字典项ID
 * @param isEnabled 是否启用
 * @returns 更新后的字典项对象
 */
export const toggleDictItemApi = (id: number, isEnabled: boolean) => {
  return httpRequest.patch<Dict>(`/dict/${id}/toggle`, { isEnabled });
};
