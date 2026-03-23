import { NotFoundException } from '@nestjs/common';
import { ExportService } from './export.service';
import type { PrismaService } from '../prisma/prisma.service';

describe('ExportService', () => {
  it('returns failed chapters instead of swallowing batch export errors', async () => {
    const prisma = {
      manuscript_chapter: {
        findFirst: jest.fn(),
      },
    } as unknown as PrismaService;
    const service = new ExportService(prisma);

    jest
      .spyOn(service, 'exportChapterToTxt')
      .mockResolvedValueOnce('chapter 1 content')
      .mockRejectedValueOnce(new NotFoundException('章节不存在或无权访问'));

    await expect(service.exportChaptersBatch([1, 2], 100, { format: 'txt' })).resolves.toEqual({
      items: {
        1: 'chapter 1 content',
      },
      failures: [
        {
          chapterId: 2,
          message: '章节不存在或无权访问',
        },
      ],
      total: 2,
      successCount: 1,
      failureCount: 1,
    });
  });

  it('builds file payloads inside the service', async () => {
    const prisma = {
      manuscript_chapter: {
        findFirst: jest.fn().mockResolvedValue({
          title: '第一章',
          wordCount: 1280,
          content: {
            content: '正文内容',
          },
          manuscript: {
            name: '测试文稿',
          },
        }),
      },
    } as unknown as PrismaService;
    const service = new ExportService(prisma);

    const result = await service.exportChapterToTxtFile(1, 100);

    expect(result.filename).toBe('chapter_1.txt');
    expect(result.contentType).toBe('text/plain; charset=utf-8');
    expect(result.content).toContain('测试文稿');
  });

  it('preserves volume structure when exporting manuscript markdown', async () => {
    const prisma = {
      manuscripts: {
        findFirst: jest.fn().mockResolvedValue({
          id: 8,
          name: '结构化文稿',
          outlineId: null,
        }),
      },
      outline: {
        findUnique: jest.fn(),
      },
      manuscript_chapter: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 1,
            title: '序章',
            content: {
              content: '无卷章节内容',
            },
          },
        ]),
      },
      manuscript_volume: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 100,
            title: '风起',
            description: '卷描述',
            chapters: [
              {
                id: 2,
                title: '开端',
                content: {
                  content: '第一卷第一章',
                },
              },
              {
                id: 3,
                title: '交锋',
                content: null,
              },
            ],
          },
        ]),
      },
    } as unknown as PrismaService;
    const service = new ExportService(prisma);

    const result = await service.exportManuscriptToMarkdownFile(8, 100);

    expect(result.content).toContain('## 目录');
    expect(result.content).toContain('- [序章](#序章)');
    expect(result.content).toContain('- [第一卷 风起](#第一卷-风起)');
    expect(result.content).toContain('  - [第一章 开端](#第一章-开端)');
    expect(result.content).toContain('## 第一卷 风起');
    expect(result.content).toContain('### 第一章 开端');
    expect(result.content).toContain('### 第二章 交锋');
  });

  it('preserves manuscript volume order in txt export', async () => {
    const prisma = {
      manuscripts: {
        findFirst: jest.fn().mockResolvedValue({
          id: 9,
          name: '排序文稿',
          outlineId: null,
          createdAt: new Date('2025-01-01T00:00:00.000Z'),
          updatedAt: new Date('2025-01-02T00:00:00.000Z'),
          lastEditedAt: null,
          totalWords: 1200,
        }),
      },
      outline: {
        findUnique: jest.fn(),
      },
      manuscript_chapter: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      manuscript_volume: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 2,
            title: '第二卷',
            chapters: [
              {
                id: 12,
                title: '卷二章节',
                content: {
                  content: '卷二内容',
                },
              },
            ],
          },
          {
            id: 1,
            title: '第一卷',
            chapters: [
              {
                id: 11,
                title: '卷一章节',
                content: {
                  content: '卷一内容',
                },
              },
            ],
          },
        ]),
      },
    } as unknown as PrismaService;
    const service = new ExportService(prisma);

    const result = await service.exportManuscriptToTxtFile(9, 100, { format: 'txt' });

    expect(result.content.indexOf('第一卷 第二卷')).toBeLessThan(
      result.content.indexOf('第二卷 第一卷')
    );
  });
});
