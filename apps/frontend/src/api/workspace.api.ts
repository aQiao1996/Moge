/**
 * 工作台API
 */

import request from '@/lib/request';

/** 工作台汇总数据类型 */
export interface WorkspaceSummary {
  recentProjects: Array<{
    id: number;
    name: string;
    type: string;
    description?: string;
    updatedAt: string;
  }>;
  recentOutlines: Array<{
    id: number;
    name: string;
    type: string;
    status: string;
    updatedAt: string;
  }>;
  recentManuscripts: Array<{
    id: number;
    name: string;
    status: string;
    totalWords: number;
    lastEditedAt?: string;
    lastEditedChapterId?: number;
  }>;
  stats: {
    todayWords: number;
    weekWords: number;
    totalWords: number;
    projectCount: number;
    manuscriptCount: number;
  };
}

export interface WorkspaceTodo {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

export interface WorkspaceIdea {
  id: string;
  content: string;
  createdAt: string;
}

export interface WorkspaceItems {
  todos: WorkspaceTodo[];
  ideas: WorkspaceIdea[];
}

/** 写作统计数据类型 */
export interface WritingStats {
  todayWords: number;
  weekWords: number;
  totalWords: number;
}

/**
 * 获取工作台汇总数据
 */
export async function getWorkspaceSummary(): Promise<WorkspaceSummary> {
  const response = await request.get<WorkspaceSummary>('/workspace/summary');
  return response.data;
}

/**
 * 获取写作统计
 */
export async function getWritingStats(): Promise<WritingStats> {
  const response = await request.get<WritingStats>('/workspace/stats');
  return response.data;
}

/**
 * 获取工作台待办和灵感
 */
export async function getWorkspaceItems(): Promise<WorkspaceItems> {
  const response = await request.get<WorkspaceItems>('/workspace/items');
  return response.data;
}

/**
 * 创建工作台待办
 */
export async function createWorkspaceTodo(text: string): Promise<WorkspaceTodo> {
  const response = await request.post<WorkspaceTodo>('/workspace/todos', { text });
  return response.data;
}

/**
 * 更新工作台待办完成状态
 */
export async function updateWorkspaceTodo(id: string, done: boolean): Promise<WorkspaceItems> {
  const response = await request.patch<WorkspaceItems>(`/workspace/todos/${id}`, { done });
  return response.data;
}

/**
 * 删除工作台待办
 */
export async function deleteWorkspaceTodo(id: string): Promise<WorkspaceItems> {
  const response = await request.delete<WorkspaceItems>(`/workspace/todos/${id}`);
  return response.data;
}

/**
 * 创建工作台灵感
 */
export async function createWorkspaceIdea(content: string): Promise<WorkspaceIdea> {
  const response = await request.post<WorkspaceIdea>('/workspace/ideas', { content });
  return response.data;
}

/**
 * 删除工作台灵感
 */
export async function deleteWorkspaceIdea(id: string): Promise<WorkspaceItems> {
  const response = await request.delete<WorkspaceItems>(`/workspace/ideas/${id}`);
  return response.data;
}
