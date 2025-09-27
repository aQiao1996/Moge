export interface Dict {
  id: number;
  categoryCode: string;
  code: string;
  label: string;
  value: string | null;
  description?: string | null; // 可选字段，兼容旧数据
  sortOrder: number;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
