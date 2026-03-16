import { NotFoundException } from '@nestjs/common';
import { ExportService } from './export.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { ManuscriptsService } from '../manuscripts/manuscripts.service';

describe('ExportService', () => {
  it('returns failed chapters instead of swallowing batch export errors', async () => {
    const prisma = {
      manuscript_chapter: {
        findFirst: jest.fn(),
      },
    } as unknown as PrismaService;
    const manuscriptsService = {} as ManuscriptsService;
    const service = new ExportService(prisma, manuscriptsService);

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
});
