import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { dict_items } from '../../generated/prisma';

interface CreateDictItemData {
  categoryCode: string;
  code: string;
  label: string;
  value?: string;
  sortOrder?: number;
  isEnabled?: boolean;
  description?: string;
}

interface UpdateDictItemData {
  categoryCode?: string;
  code?: string;
  label?: string;
  value?: string;
  sortOrder?: number;
  isEnabled?: boolean;
  description?: string;
}

@Injectable()
export class DictService {
  constructor(private readonly prisma: PrismaService) {}

  async findByType(type: string): Promise<dict_items[]> {
    return this.prisma.dict_items.findMany({
      where: { categoryCode: type },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(data: CreateDictItemData): Promise<dict_items> {
    return this.prisma.dict_items.create({
      data: {
        categoryCode: data.categoryCode,
        code: data.code,
        label: data.label,
        value: data.value || null,
        sortOrder: data.sortOrder || 0,
        isEnabled: data.isEnabled !== undefined ? data.isEnabled : true,
        description: data.description || null,
      },
    });
  }

  async update(id: number, data: UpdateDictItemData): Promise<dict_items> {
    return this.prisma.dict_items.update({
      where: { id },
      data: {
        ...data,
        value: data.value || null,
        description: data.description || null,
      },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.dict_items.delete({
      where: { id },
    });
  }

  async toggle(id: number, isEnabled: boolean): Promise<dict_items> {
    return this.prisma.dict_items.update({
      where: { id },
      data: { isEnabled },
    });
  }
}
