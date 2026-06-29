/**
 * 项目管理相关 API 接口
 * 提供小说项目的 CRUD 功能和设定关联管理
 */
import { get, post, put, del } from '@/lib/request';
import type {
  AIProviderValue,
  AiContextLengthStrategyValue,
  AiPromptPreset,
  AiTaskType,
  AiResultApplyStrategyValue,
  ProjectMemberRoleValue,
  UpdateProjectAiConfigValues,
} from '@moge/types';

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

export interface ProjectAiConfig {
  id: number;
  projectId: number;
  provider: AIProviderValue;
  model: string;
  temperature: string;
  maxTokens: number;
  defaultContinuePresetId?: number | null;
  defaultPolishPresetId?: number | null;
  defaultExpandPresetId?: number | null;
  defaultOutlinePresetId?: number | null;
  enableCharacterContext: boolean;
  enableSystemContext: boolean;
  enableWorldContext: boolean;
  enableMiscContext: boolean;
  enableChapterSummaryContext: boolean;
  enableProjectMemoryContext: boolean;
  contextLengthStrategy: AiContextLengthStrategyValue;
  resultApplyStrategy: AiResultApplyStrategyValue;
  asyncTaskThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: number;
  projectId: number;
  userId: number;
  role: ProjectMemberRoleValue;
  user?: {
    id: number;
    username: string;
    email?: string | null;
    name?: string | null;
    avatarUrl?: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMemoryItem {
  id: number;
  projectId: number;
  category: string;
  title: string;
  content: string;
  priority: number;
  sourceType: string;
  sourceId?: number | null;
  status: 'ACTIVE' | 'ARCHIVED';
  createdBy?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectKnowledgeDocument {
  id: number;
  projectId: number;
  title: string;
  documentType: string;
  content: string;
  source: string;
  status: 'ACTIVE' | 'ARCHIVED';
  createdBy?: number | null;
  createdAt: string;
  updatedAt: string;
}

export type UpdateProjectAiConfigPayload = Omit<
  UpdateProjectAiConfigValues,
  | 'defaultContinuePresetId'
  | 'defaultPolishPresetId'
  | 'defaultExpandPresetId'
  | 'defaultOutlinePresetId'
> & {
  defaultContinuePresetId?: number | null;
  defaultPolishPresetId?: number | null;
  defaultExpandPresetId?: number | null;
  defaultOutlinePresetId?: number | null;
};

export interface CreateProjectPromptPresetPayload {
  code: string;
  name: string;
  taskType: AiTaskType;
  description?: string;
  systemPrompt: string;
  userPromptTemplate: string;
  outputFormat?: string;
  notes?: string;
}

export interface UpdateProjectPromptPresetPayload {
  code?: string;
  name?: string;
  description?: string;
}

export interface AppendProjectPromptPresetVersionPayload {
  systemPrompt: string;
  userPromptTemplate: string;
  outputFormat?: string;
  notes?: string;
}

export interface ProjectMemoryItemPayload {
  category: string;
  title: string;
  content: string;
  priority?: number;
  sourceType?: string;
  sourceId?: number | null;
}

export interface ProjectKnowledgeDocumentPayload {
  title: string;
  documentType: string;
  content: string;
  source?: string;
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

export const getProjectAiConfig = async (id: number): Promise<ProjectAiConfig> => {
  const response = await get<ProjectAiConfig>(`/projects/${id}/ai-config`);
  return response.data;
};

export const getProjectPromptPresets = async (id: number): Promise<AiPromptPreset[]> => {
  const response = await get<AiPromptPreset[]>(`/projects/${id}/ai-prompt-presets`);
  return response.data || [];
};

export const createProjectPromptPreset = async (
  id: number,
  data: CreateProjectPromptPresetPayload
): Promise<AiPromptPreset> => {
  const response = await post<AiPromptPreset>(`/projects/${id}/ai-prompt-presets`, data);
  return response.data;
};

export const createUserPromptPreset = async (
  id: number,
  data: CreateProjectPromptPresetPayload
): Promise<AiPromptPreset> => {
  const response = await post<AiPromptPreset>(`/projects/${id}/ai-prompt-presets/user`, data);
  return response.data;
};

export const updateProjectPromptPreset = async (
  id: number,
  presetId: number,
  data: UpdateProjectPromptPresetPayload
): Promise<AiPromptPreset> => {
  const response = await put<AiPromptPreset>(`/projects/${id}/ai-prompt-presets/${presetId}`, data);
  return response.data;
};

export const updateUserPromptPreset = async (
  id: number,
  presetId: number,
  data: UpdateProjectPromptPresetPayload
): Promise<AiPromptPreset> => {
  const response = await put<AiPromptPreset>(
    `/projects/${id}/ai-prompt-presets/user/${presetId}`,
    data
  );
  return response.data;
};

export const appendProjectPromptPresetVersion = async (
  id: number,
  presetId: number,
  data: AppendProjectPromptPresetVersionPayload
): Promise<AiPromptPreset> => {
  const response = await post<AiPromptPreset>(
    `/projects/${id}/ai-prompt-presets/${presetId}/versions`,
    data
  );
  return response.data;
};

export const appendUserPromptPresetVersion = async (
  id: number,
  presetId: number,
  data: AppendProjectPromptPresetVersionPayload
): Promise<AiPromptPreset> => {
  const response = await post<AiPromptPreset>(
    `/projects/${id}/ai-prompt-presets/user/${presetId}/versions`,
    data
  );
  return response.data;
};

export const cloneProjectPromptPreset = async (
  id: number,
  presetId: number
): Promise<AiPromptPreset> => {
  const response = await post<AiPromptPreset>(
    `/projects/${id}/ai-prompt-presets/${presetId}/clone`
  );
  return response.data;
};

export const disableProjectPromptPreset = async (
  id: number,
  presetId: number
): Promise<AiPromptPreset> => {
  const response = await del<AiPromptPreset>(`/projects/${id}/ai-prompt-presets/${presetId}`);
  return response.data;
};

export const disableUserPromptPreset = async (
  id: number,
  presetId: number
): Promise<AiPromptPreset> => {
  const response = await del<AiPromptPreset>(`/projects/${id}/ai-prompt-presets/user/${presetId}`);
  return response.data;
};

export const updateProjectAiConfig = async (
  id: number,
  data: UpdateProjectAiConfigPayload
): Promise<ProjectAiConfig> => {
  const response = await put<ProjectAiConfig>(`/projects/${id}/ai-config`, data);
  return response.data;
};

export const getProjectMemoryItems = async (id: number): Promise<ProjectMemoryItem[]> => {
  const response = await get<ProjectMemoryItem[]>(`/projects/${id}/memory`);
  return response.data || [];
};

export const createProjectMemoryItem = async (
  id: number,
  data: ProjectMemoryItemPayload
): Promise<ProjectMemoryItem> => {
  const response = await post<ProjectMemoryItem>(`/projects/${id}/memory`, data);
  return response.data;
};

export const updateProjectMemoryItem = async (
  id: number,
  memoryId: number,
  data: Partial<ProjectMemoryItemPayload>
): Promise<ProjectMemoryItem> => {
  const response = await put<ProjectMemoryItem>(`/projects/${id}/memory/${memoryId}`, data);
  return response.data;
};

export const deleteProjectMemoryItem = async (
  id: number,
  memoryId: number
): Promise<{ message: string }> => {
  const response = await del<{ message: string }>(`/projects/${id}/memory/${memoryId}`);
  return response.data;
};

export const getProjectKnowledgeDocuments = async (
  id: number
): Promise<ProjectKnowledgeDocument[]> => {
  const response = await get<ProjectKnowledgeDocument[]>(`/projects/${id}/knowledge-documents`);
  return response.data || [];
};

export const createProjectKnowledgeDocument = async (
  id: number,
  data: ProjectKnowledgeDocumentPayload
): Promise<ProjectKnowledgeDocument> => {
  const response = await post<ProjectKnowledgeDocument>(
    `/projects/${id}/knowledge-documents`,
    data
  );
  return response.data;
};

export const updateProjectKnowledgeDocument = async (
  id: number,
  documentId: number,
  data: Partial<ProjectKnowledgeDocumentPayload>
): Promise<ProjectKnowledgeDocument> => {
  const response = await put<ProjectKnowledgeDocument>(
    `/projects/${id}/knowledge-documents/${documentId}`,
    data
  );
  return response.data;
};

export const deleteProjectKnowledgeDocument = async (
  id: number,
  documentId: number
): Promise<{ message: string }> => {
  const response = await del<{ message: string }>(
    `/projects/${id}/knowledge-documents/${documentId}`
  );
  return response.data;
};

export const getProjectMembers = async (id: number): Promise<ProjectMember[]> => {
  const response = await get<ProjectMember[]>(`/projects/${id}/members`);
  return response.data || [];
};

export const addProjectMember = async (
  id: number,
  data: { userId: number; role: Exclude<ProjectMemberRoleValue, 'OWNER'> }
): Promise<ProjectMember> => {
  const response = await post<ProjectMember>(`/projects/${id}/members`, data);
  return response.data;
};

export const updateProjectMember = async (
  id: number,
  userId: number,
  data: { role: Exclude<ProjectMemberRoleValue, 'OWNER'> }
): Promise<ProjectMember> => {
  const response = await put<ProjectMember>(`/projects/${id}/members/${userId}`, data);
  return response.data;
};

export const removeProjectMember = async (
  id: number,
  userId: number
): Promise<{ message: string }> => {
  const response = await del<{ message: string }>(`/projects/${id}/members/${userId}`);
  return response.data;
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
