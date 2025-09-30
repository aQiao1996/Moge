/**
 * 设定库相关 API 接口
 * 提供角色、系统、世界、辅助设定的查询功能
 */
import { get, post, put, del } from '@/lib/request';

// 设定项接口
export interface SettingItem {
  id: number;
  name: string;
  type?: string;
  description?: string;
  era?: string; // 世界设定特有
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// 角色设定完整接口
export interface CharacterSetting {
  id: number;
  name: string;
  type?: string | null;
  gender?: string | null;
  age?: string | null;
  height?: string | null;
  appearance?: string | null;
  personality?: string | null;
  background?: string | null;
  occupation?: string | null;
  powerLevel?: string | null;
  abilities?: string | null;
  relationships?: string | number | boolean | string[] | null | undefined | object;
  tags: string[];
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
  [key: string]: string | number | boolean | string[] | null | undefined | object;
}

// 项目信息接口
export interface ProjectInfo {
  id: number;
  name: string;
  type: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
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

// ==================== 角色设定 CRUD 接口 ====================

/**
 * 创建角色设定
 * @param data 角色设定数据
 * @returns 创建的角色设定
 */
export const createCharacter = async (
  data: Partial<CharacterSetting>
): Promise<CharacterSetting> => {
  const response = await post<CharacterSetting>('/settings/characters', data);
  return response.data;
};

/**
 * 更新角色设定
 * @param id 角色设定ID
 * @param data 更新的角色设定数据
 * @returns 更新后的角色设定
 */
export const updateCharacter = async (
  id: number,
  data: Partial<CharacterSetting>
): Promise<CharacterSetting> => {
  const response = await put<CharacterSetting>(`/settings/characters/${id}`, data);
  return response.data;
};

/**
 * 删除角色设定
 * @param id 角色设定ID
 * @returns 删除结果
 */
export const deleteCharacter = async (id: number): Promise<{ message: string }> => {
  const response = await del<{ message: string }>(`/settings/characters/${id}`);
  return response.data;
};

/**
 * 获取角色设定的关联项目列表
 * @param id 角色设定ID
 * @returns 关联的项目列表
 */
export const getCharacterProjects = async (id: number): Promise<ProjectInfo[]> => {
  const response = await get<ProjectInfo[]>(`/settings/characters/${id}/projects`);
  return response.data || [];
};
