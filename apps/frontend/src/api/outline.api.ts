/**
 * 大纲管理相关 API 接口
 * 提供小说大纲的 CRUD 功能和卷、章节的管理
 */
import httpRequest from '@/lib/request';
import type {
  CreateOutlineValues,
  Outline,
  OutlineContent,
  OutlineWithStructure,
  UpdateOutlineContentValues,
  UpdateOutlineValues,
  OutlineVolume,
  OutlineChapter,
} from '@moge/types';

interface GetOutlinesResponse {
  list: Outline[];
  total: number;
}

interface GetOutlinesParams {
  pageNum?: number;
  pageSize?: number;
  search?: string;
  type?: string;
  era?: string;
  tags?: string[];
  sortBy?: 'name' | 'createdAt' | 'type';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 设定项接口
 */
interface SettingItem {
  id: number;
  name: string;
  background?: string | null;
  description?: string | null;
  tags?: string[];
}

/**
 * 大纲关联设定数据接口
 */
interface OutlineSettingsResponse {
  characters: SettingItem[];
  systems: SettingItem[];
  worlds: SettingItem[];
  misc: SettingItem[];
}

/**
 * 创建新大纲
 * @param data 大纲数据
 * @returns 创建的大纲对象
 */
export const createOutlineApi = async (data: CreateOutlineValues): Promise<Outline> => {
  const response = await httpRequest.post<Outline>('/outline', data);
  return response.data;
};

/**
 * 获取大纲列表（支持分页、搜索、筛选、排序）
 * @param params 查询参数
 * @returns 大纲列表和总数
 */
export const getOutlinesApi = async (params: GetOutlinesParams): Promise<GetOutlinesResponse> => {
  // 过滤掉 undefined、null、空字符串和空数组
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      if (value === undefined || value === null || value === '') {
        return false;
      }
      if (Array.isArray(value) && value.length === 0) {
        return false;
      }
      return true;
    })
  );

  const response = await httpRequest.get<GetOutlinesResponse>('/outline', filteredParams);
  return response.data;
};

/**
 * 根据 ID 获取大纲基本信息
 * @param id 大纲 ID
 * @returns 大纲对象
 */
export const getOutlineByIdApi = async (id: string): Promise<Outline> => {
  const response = await httpRequest.get<Outline>(`/outline/${id}`);
  return response.data;
};

/**
 * 获取大纲详情（包含完整的卷、章节和内容结构）
 * @param id 大纲 ID
 * @returns 带结构的大纲详情
 */
export const getOutlineDetailApi = async (id: string): Promise<OutlineWithStructure> => {
  const response = await httpRequest.get<OutlineWithStructure>(`/outline/${id}/detail`);
  return response.data;
};

/**
 * 获取大纲内容
 * @deprecated 使用 getOutlineDetailApi 替代
 * @param id 大纲 ID
 * @returns 大纲内容或 null
 */
export const getOutlineContentApi = async (id: string): Promise<OutlineContent | null> => {
  try {
    const response = await httpRequest.get<OutlineContent>(`/outline/${id}/content`);
    return response.data;
  } catch {
    // 如果内容不存在，返回 null
    return null;
  }
};

/**
 * 更新大纲内容
 * @param id 大纲 ID
 * @param data 内容数据
 * @returns 更新后的内容对象
 */
export const updateOutlineContentApi = async (
  id: string,
  data: UpdateOutlineContentValues
): Promise<OutlineContent> => {
  const response = await httpRequest.put<OutlineContent>(`/outline/${id}/content`, data);
  return response.data;
};

/**
 * 更新大纲基本信息
 * @param id 大纲 ID
 * @param data 更新数据
 * @returns 更新后的大纲对象
 */
export const updateOutlineApi = async (id: string, data: UpdateOutlineValues): Promise<Outline> => {
  const response = await httpRequest.patch<Outline>(`/outline/${id}`, data);
  return response.data;
};

/**
 * 删除大纲
 * @param id 大纲 ID
 */
export const deleteOutlineApi = async (id: string): Promise<void> => {
  await httpRequest.delete(`/outline/${id}`);
};

/**
 * 更新卷信息
 * @param outlineId 大纲 ID
 * @param volumeId 卷 ID
 * @param data 卷数据（标题、描述）
 * @returns 更新后的卷对象
 */
export const updateVolumeApi = async (
  outlineId: string,
  volumeId: string,
  data: { title: string; description?: string }
): Promise<OutlineVolume> => {
  const response = await httpRequest.put<OutlineVolume>(
    `/outline/${outlineId}/volume/${volumeId}`,
    data
  );
  return response.data;
};

/**
 * 更新章节信息
 * @param outlineId 大纲 ID
 * @param chapterId 章节 ID
 * @param data 章节数据（标题、内容）
 * @returns 更新后的章节对象
 */
export const updateChapterApi = async (
  outlineId: string,
  chapterId: string,
  data: { title: string; content?: string }
): Promise<OutlineChapter> => {
  const response = await httpRequest.put<OutlineChapter>(
    `/outline/${outlineId}/chapter/${chapterId}`,
    data
  );
  return response.data;
};

/**
 * 获取大纲关联的设定详情
 * @param id 大纲 ID
 * @returns 关联的设定数据
 */
export const getOutlineSettingsApi = async (id: string): Promise<OutlineSettingsResponse> => {
  const response = await httpRequest.get<OutlineSettingsResponse>(`/outline/${id}/settings`);
  return response.data;
};

/**
 * 更新大纲关联的角色设定
 * @param id 大纲 ID
 * @param characters 角色设定 ID 数组
 */
export const updateOutlineCharactersApi = async (id: string, characters: number[]) => {
  const response = await httpRequest.put(`/outline/${id}/characters`, { characters });
  return response.data;
};

/**
 * 更新大纲关联的系统设定
 * @param id 大纲 ID
 * @param systems 系统设定 ID 数组
 */
export const updateOutlineSystemsApi = async (id: string, systems: number[]) => {
  const response = await httpRequest.put(`/outline/${id}/systems`, { systems });
  return response.data;
};

/**
 * 更新大纲关联的世界设定
 * @param id 大纲 ID
 * @param worlds 世界设定 ID 数组
 */
export const updateOutlineWorldsApi = async (id: string, worlds: number[]) => {
  const response = await httpRequest.put(`/outline/${id}/worlds`, { worlds });
  return response.data;
};

/**
 * 更新大纲关联的辅助设定
 * @param id 大纲 ID
 * @param misc 辅助设定 ID 数组
 */
export const updateOutlineMiscApi = async (id: string, misc: number[]) => {
  const response = await httpRequest.put(`/outline/${id}/misc`, { misc });
  return response.data;
};
