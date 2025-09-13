/**
 * API 响应基础接口
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  success?: boolean;
  code?: string;
  timestamp?: string;
}

/**
 * API 错误接口
 */
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

/**
 * 分页请求参数
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 分页响应数据
 */
export interface PaginationResponse<T> {
  list: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * 请求状态枚举
 */
export enum RequestStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

/**
 * HTTP 方法枚举
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

// 从后端应用重新导出 tRPC 的 AppRouter 类型
// 这是实现前后端类型安全共享的关键
export type { AppRouter } from '../../../apps/backend/src/trpc/trpc.router';
