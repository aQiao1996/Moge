import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateOutlineValues, UpdateOutlineValues, Outline } from '@moge/types';
import { BaseService } from '../base/base.service';
import { AIService } from '../ai/ai.service';
import { Observable } from 'rxjs';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { MessageEvent } from '@nestjs/common';

interface FindAllOptions {
  pageNum?: number;
  pageSize?: number;
  search?: string;
  type?: string;
  era?: string;
  status?: Outline['status'];
  tags?: string[];
  sortBy?: 'name' | 'createdAt' | 'type';
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class OutlineService extends BaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService
  ) {
    super();
  }

  generateContentStream(id: string): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      const generate = async () => {
        try {
          // 1. 从数据库获取大纲元数据
          const outline = await this.prisma.outline.findUnique({
            where: { id: parseInt(id) },
          });
          if (!outline) {
            subscriber.error(new Error('Outline not found'));
            return;
          }

          // 2. 实例化支持流式的模型 (这里用我推荐的 Gemini Pro)
          const model = this.aiService.getStreamingModel('gemini');

          // 3. 创建一个优秀的 Prompt
          const prompt = ChatPromptTemplate.fromMessages([
            ['system', '你是一位经验丰富的小说家和创意作家，擅长构建引人入胜的故事大纲。'],
            [
              'human',
              `请根据以下信息，为我生成一份详细、结构清晰、章节分明的小说大纲。请使用 Markdown 格式输出。
              - 标题: {name}
              - 类型/题材: {type}
              - 所处时代: {era}
              - 标签: {tags}
              - 备注: {remark}
            `,
            ],
          ]);

          // 4. 创建 Chain
          const chain = prompt.pipe(model).pipe(new StringOutputParser());

          // 5. 调用 stream 方法获取流
          const stream = await chain.stream({
            name: outline.name,
            type: outline.type,
            era: outline.era,
            tags: outline.tags.join(', '),
            remark: outline.remark,
          });

          // 6. 遍历 LangChain 的流，并发送给前端
          for await (const chunk of stream) {
            if (subscriber.closed) {
              // 如果前端断开连接，则停止
              break;
            }
            subscriber.next({ data: chunk }); // SSE 的标准格式
          }

          subscriber.next({ data: '__DONE__' }); // 发送结束信号
          subscriber.complete(); // 告知前端数据已发送完毕
        } catch (error) {
          subscriber.error(error); // 发生错误
        }
      };

      void generate();
    });
  }

  async create(userId: string, data: CreateOutlineValues) {
    const { name, type, era, conflict, tags, remark } = data;
    const outline = await this.prisma.outline.create({
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

    // 转换为前端期望的字符串格式
    return {
      ...outline,
      id: outline.id.toString(),
      userId: outline.userId.toString(),
    };
  }

  async findAll(userId: string, options: FindAllOptions = {}) {
    const { search, type, era, tags, status, ...paginationOptions } = options;

    const { skip, take, orderBy } = this.buildPaginationAndSort<Outline>({
      ...paginationOptions,
      defaultSortBy: 'createdAt',
    });

    const where = this.buildWhereConditions(userId, { search, type, era, tags, status });

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

    // 转换 ID 为字符串格式
    const transformedList = list.map((outline) => ({
      ...outline,
      id: outline.id.toString(),
      userId: outline.userId.toString(),
    }));

    return { list: transformedList, total };
  }

  private buildWhereConditions(
    userId: string,
    filters: {
      search?: string;
      type?: string;
      era?: string;
      tags?: string[];
      status?: Outline['status'];
    }
  ) {
    const { search, type, era, tags, status } = filters;

    const where: {
      userId: number;
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' };
        remark?: { contains: string; mode: 'insensitive' };
      }>;
      type?: string;
      era?: string;
      status?: Outline['status'];
      tags?: { hasSome: string[] };
    } = {
      userId: parseInt(userId),
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { remark: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) where.type = type;

    if (era) where.era = era;

    if (status) where.status = status;

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    return where;
  }

  async findOne(id: number, userId: string) {
    const outline = await this.prisma.outline.findUnique({
      where: { id },
    });

    if (outline?.userId !== parseInt(userId)) {
      throw new ForbiddenException('无权访问此大纲');
    }

    // 转换为前端期望的字符串格式
    if (outline) {
      return {
        ...outline,
        id: outline.id.toString(),
        userId: outline.userId.toString(),
      };
    }

    return outline;
  }

  async update(id: number, userId: string, data: UpdateOutlineValues) {
    await this.findOne(id, userId);
    const updatedOutline = await this.prisma.outline.update({
      where: { id },
      data,
    });

    return {
      ...updatedOutline,
      id: updatedOutline.id.toString(),
      userId: updatedOutline.userId.toString(),
    };
  }

  async delete(id: number, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.outline.delete({
      where: { id },
    });
  }
}
