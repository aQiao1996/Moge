/**
 * 小说项目接口定义
 */
export interface Project {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  settings: {
    characters: number;
    systems: number;
    worlds: number;
    misc: number;
  };
}
