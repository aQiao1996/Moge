import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateOutlineValues, UpdateOutlineValues } from '@moge/types';

interface FindAllOptions {
  pageNum?: number;
  pageSize?: number;
  search?: string;
  type?: string;
  era?: string;
  tags?: string[];
  sortBy?: 'name' | 'createdAt' | 'type';
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class OutlineService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: CreateOutlineValues) {
    const { name, type, era, conflict, tags, remark } = data;
    return this.prisma.outline.create({
      data: {
        name,
        type,
        era,
        conflict,
        tags,
        remark,
        user: {
          connect: {
            id: parseInt(userId),
          },
        },
      },
    });
  }

  async findAll(userId: string, options: FindAllOptions = {}) {
    const {
      pageNum = 1,
      pageSize = 10,
      search,
      type,
      era,
      tags,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const skip = (pageNum - 1) * pageSize;
    const take = Number(pageSize);

    // 构建查询条件
    const where: {
      userId: number;
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' };
        remark?: { contains: string; mode: 'insensitive' };
      }>;
      type?: string;
      era?: string;
      tags?: { hasSome: string[] };
    } = {
      userId: parseInt(userId),
    };

    // 搜索条件
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { remark: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 类型筛选
    if (type) {
      where.type = type;
    }

    // 时代筛选
    if (era) {
      where.era = era;
    }

    // 标签筛选
    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }

    // 构建排序条件
    const orderBy: {
      name?: 'asc' | 'desc';
      type?: 'asc' | 'desc';
      createdAt?: 'asc' | 'desc';
    } = {};
    if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else if (sortBy === 'type') {
      orderBy.type = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const [list, total] = await this.prisma.$transaction([
      this.prisma.outline.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      this.prisma.outline.count({
        where,
      }),
    ]);

    return { list, total };
  }

  async findOne(id: number, userId: string) {
    const outline = await this.prisma.outline.findUnique({
      where: { id },
    });

    if (outline?.userId !== parseInt(userId)) {
      throw new ForbiddenException('无权访问此大纲');
    }

    return outline;
  }

  async update(id: number, userId: string, data: UpdateOutlineValues) {
    await this.findOne(id, userId);
    return this.prisma.outline.update({
      where: { id },
      data,
    });
  }
}
