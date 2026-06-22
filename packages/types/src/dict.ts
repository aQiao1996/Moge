export interface Dict {
  id: number;
  categoryCode: string;
  label: string;
  value: string;
  description?: string | null; // 可选字段，兼容旧数据
  sortOrder: number;
  isEnabled: boolean;
  scope?: DictScope;
  userId?: number | null;
  projectId?: number | null;
  shareStatus?: DictShareStatus;
  version?: number;
  sourceItemId?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export type DictScope = 'SYSTEM' | 'USER' | 'PROJECT';

export type DictShareStatus = 'PRIVATE' | 'SHARED' | 'ARCHIVED';

export interface DictItemVersion {
  id: number;
  dictItemId: number;
  version: number;
  label: string;
  value: string;
  description?: string | null;
  sortOrder: number;
  isEnabled: boolean;
  createdAt: Date;
}
