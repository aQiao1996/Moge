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
});
