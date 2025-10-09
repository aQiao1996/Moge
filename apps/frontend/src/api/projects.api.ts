/**
 * 项目管理相关 API 接口
 * 提供小说项目的 CRUD 功能和设定关联管理
 */
import { get, post, put, del } from '@/lib/request';

// 项目接口
export interface Project {
  id: number;
  name: string;
  type: string;
  description?: string | null;
  tags: string[];
  characters: string[];
  systems: string[];
  worlds: string[];
  misc: string[];
  createdAt: string;
  updatedAt: string;
  [key: string]: string | number | boolean | string[] | null | undefined | object;
}

// 项目设定详情接口
export interface ProjectSettings {
  characters: Array<{
    id: number;
    name: string;
    type?: string | null;
    gender?: string | null;
    age?: string | null;
    tags: string[];
    createdAt: string;
    updatedAt: string;
  }>;
  systems: Array<{
    id: number;
    name: string;
    type?: string | null;
    description?: string | null;
    tags: string[];
    createdAt: string;
    updatedAt: string;
  }>;
  worlds: Array<{
    id: number;
    name: string;
    type?: string | null;
    era?: string | null;
    description?: string | null;
    tags: string[];
    createdAt: string;
    updatedAt: string;
  }>;
  misc: Array<{
    id: number;
    name: string;
    type?: string | null;
    description?: string | null;
    tags: string[];
    createdAt: string;
    updatedAt: string;
  }>;
}

/**
 * 获取用户的所有项目
 * @returns 项目列表
 */
export const getProjects = async (): Promise<Project[]> => {
  try {
    const response = await get<Project[]>('/projects');
    return response.data || [];
  } catch (error) {
    console.error('获取项目列表失败:', error);
    return [];
  }
};

/**
 * 根据ID获取单个项目详情
 * @param id 项目ID
 * @returns 项目详情
 */
export const getProjectById = async (id: number): Promise<Project> => {
  const response = await get<Project>(`/projects/${id}`);
  return response.data;
};

/**
 * 创建项目
 * @param data 项目数据
 * @returns 创建的项目
 */
export const createProject = async (data: Partial<Project>): Promise<Project> => {
  const response = await post<Project>('/projects', data);
  return response.data;
};

/**
 * 更新项目
 * @param id 项目ID
 * @param data 更新的项目数据
 * @returns 更新后的项目
 */
export const updateProject = async (id: number, data: Partial<Project>): Promise<Project> => {
  const response = await put<Project>(`/projects/${id}`, data);
  return response.data;
};

/**
 * 删除项目
 * @param id 项目ID
 * @returns 删除结果
 */
export const deleteProject = async (id: number): Promise<{ message: string }> => {
  const response = await del<{ message: string }>(`/projects/${id}`);
  return response.data;
};

/**
 * 获取项目关联的所有设定
 * @param id 项目ID
 * @returns 项目关联的所有设定的详细信息
 */
export const getProjectSettings = async (id: number): Promise<ProjectSettings> => {
  try {
    const response = await get<ProjectSettings>(`/projects/${id}/settings`);
    return (
      response.data || {
        characters: [],
        systems: [],
        worlds: [],
        misc: [],
      }
    );
  } catch (error) {
    console.error('获取项目设定失败:', error);
    return {
      characters: [],
      systems: [],
      worlds: [],
      misc: [],
    };
  }
};

/**
 * 更新项目关联的角色设定
 * @param id 项目ID
 * @param characterIds 角色设定ID数组
 * @returns 更新后的项目
 */
export const updateProjectCharacters = async (
  id: number,
  characterIds: number[]
): Promise<Project> => {
  const response = await put<Project>(`/projects/${id}/characters`, { characterIds });
  return response.data;
};

/**
 * 更新项目关联的系统设定
 * @param id 项目ID
 * @param systemIds 系统设定ID数组
 * @returns 更新后的项目
 */
export const updateProjectSystems = async (id: number, systemIds: number[]): Promise<Project> => {
  const response = await put<Project>(`/projects/${id}/systems`, { systemIds });
  return response.data;
};

/**
 * 更新项目关联的世界设定
 * @param id 项目ID
 * @param worldIds 世界设定ID数组
 * @returns 更新后的项目
 */
export const updateProjectWorlds = async (id: number, worldIds: number[]): Promise<Project> => {
  const response = await put<Project>(`/projects/${id}/worlds`, { worldIds });
  return response.data;
};

/**
 * 更新项目关联的辅助设定
 * @param id 项目ID
 * @param miscIds 辅助设定ID数组
 * @returns 更新后的项目
 */
export const updateProjectMisc = async (id: number, miscIds: number[]): Promise<Project> => {
  const response = await put<Project>(`/projects/${id}/misc`, { miscIds });
  return response.data;
};
