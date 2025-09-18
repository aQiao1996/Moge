import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { dict_items } from '../../generated/prisma';

@Injectable()
export class DictService {
  constructor(private readonly prisma: PrismaService) {}

  async findByType(type: string): Promise<dict_items[]> {
    return this.prisma.dict_items.findMany({
      where: { categoryCode: type },
      orderBy: { sortOrder: 'asc' },
    });
  }
}
