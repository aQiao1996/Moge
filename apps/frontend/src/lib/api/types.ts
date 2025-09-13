/**
 * 前端特有的 API 类型定义
 * 共享类型请使用 @moge/types
 */

// 重新导出共享类型，方便前端使用
export * from '@moge/types';

/**
 * 前端特有的 API 配置
 */
export interface FrontendApiConfig {
  baseUrl: string;
  timeout: number;
  retryCount: number;
  retryDelay: number;
}
