/**
 * 设定库相关 API 接口
 * 提供角色、系统、世界、辅助设定的查询功能
 */
import { get } from '@/lib/request';

// 设定项接口
export interface SettingItem {
  id: string;
  name: string;
  description?: string;
  type?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 设定库响应接口
export interface SettingsLibraryResponse {
  characters: SettingItem[];
  systems: SettingItem[];
  worlds: SettingItem[];
  misc: SettingItem[];
}

/**
 * 获取设定库中的所有设定数据
 * 用于项目创建时的设定关联选择
 *
 * @returns 返回四个分类的设定数据
 */
export const getSettingsLibrary = async (): Promise<SettingsLibraryResponse> => {
  try {
    // 并行请求四个分类的设定数据
    const [charactersRes, systemsRes, worldsRes, miscRes] = await Promise.all([
      get<SettingItem[]>('/settings/characters/library'),
      get<SettingItem[]>('/settings/systems/library'),
      get<SettingItem[]>('/settings/worlds/library'),
      get<SettingItem[]>('/settings/misc/library'),
    ]);

    return {
      characters: charactersRes.data || [],
      systems: systemsRes.data || [],
      worlds: worldsRes.data || [],
      misc: miscRes.data || [],
    };
  } catch (error) {
    console.error('获取设定库数据失败:', error);
    // 返回空数据，避免阻塞界面
    return {
      characters: [],
      systems: [],
      worlds: [],
      misc: [],
    };
  }
};

/**
 * 按分类获取设定数据
 * @param category 设定分类 ('characters' | 'systems' | 'worlds' | 'misc')
 * @returns 返回指定分类的设定列表
 */
export const getSettingsByCategory = async (
  category: 'characters' | 'systems' | 'worlds' | 'misc'
): Promise<SettingItem[]> => {
  try {
    const response = await get<SettingItem[]>(`/settings/${category}/library`);
    return response.data || [];
  } catch (error) {
    console.error(`获取${category}设定失败:`, error);
    return [];
  }
};
