export interface Dict {
  id: number;
  categoryCode: string;
  code: string;
  label: string;
  value: string | null;
  sortOrder: number;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
