import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { Request, Response, NextFunction } from 'express';
import { ManuscriptsController } from './manuscripts.controller';
import { ManuscriptsService } from './manuscripts.service';

interface RequestWithUser extends Request {
  user?: {
    id: number;
  };
}

describe('ManuscriptsController', () => {
  let app: INestApplication;
  const manuscriptsService = {
    reorderVolumes: jest.fn(),
    reorderChapters: jest.fn(),
    getChapterSummary: jest.fn(),
    saveChapterSummary: jest.fn(),
    createChapterSummaryJob: jest.fn(),
    discardAiCandidate: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    manuscriptsService.reorderVolumes.mockResolvedValue({ message: '卷排序更新成功' });
    manuscriptsService.reorderChapters.mockResolvedValue({ message: '章节排序更新成功' });
    manuscriptsService.getChapterSummary.mockResolvedValue({ chapterId: 7, summary: '章节摘要' });
    manuscriptsService.saveChapterSummary.mockResolvedValue({ chapterId: 7, summary: '新摘要' });
    manuscriptsService.createChapterSummaryJob.mockResolvedValue({
      id: 501,
      taskType: 'CHAPTER_SUMMARIZE',
      status: 'QUEUED',
      chapterId: 7,
    });
    manuscriptsService.discardAiCandidate.mockResolvedValue({
      id: 206,
      applyStatus: 'DISCARDED',
      appliedBy: 100,
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ManuscriptsController],
      providers: [
        {
          provide: ManuscriptsService,
          useValue: manuscriptsService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use((req: RequestWithUser, _res: Response, next: NextFunction) => {
      req.user = { id: 100 };
      next();
    });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('routes volume reorder requests to reorderVolumes instead of updateVolume', async () => {
    await request(app.getHttpServer() as Parameters<typeof request>[0])
      .put('/manuscripts/volumes/reorder')
      .send({ volumeIds: [3, 1, 2] })
      .expect(200);

    expect(manuscriptsService.reorderVolumes).toHaveBeenCalledWith([3, 1, 2], 100);
  });

  it('routes chapter reorder requests to reorderChapters instead of updateChapter', async () => {
    await request(app.getHttpServer() as Parameters<typeof request>[0])
      .put('/manuscripts/chapters/reorder')
      .send({ chapterIds: [8, 5, 6] })
      .expect(200);

    expect(manuscriptsService.reorderChapters).toHaveBeenCalledWith([8, 5, 6], 100);
  });

  it('routes chapter summary reads to getChapterSummary', async () => {
    await request(app.getHttpServer() as Parameters<typeof request>[0])
      .get('/manuscripts/chapters/7/summary')
      .expect(200);

    expect(manuscriptsService.getChapterSummary).toHaveBeenCalledWith(7, 100);
  });

  it('routes chapter summary saves to saveChapterSummary', async () => {
    await request(app.getHttpServer() as Parameters<typeof request>[0])
      .post('/manuscripts/chapters/7/summary')
      .send({ summary: '新摘要' })
      .expect(201);

    expect(manuscriptsService.saveChapterSummary).toHaveBeenCalledWith(
      7,
      { summary: '新摘要' },
      100
    );
  });

  it('routes chapter summary job creation to createChapterSummaryJob', async () => {
    await request(app.getHttpServer() as Parameters<typeof request>[0])
      .post('/manuscripts/chapters/7/summary-job')
      .expect(201);

    expect(manuscriptsService.createChapterSummaryJob).toHaveBeenCalledWith(7, 100);
  });

  it('routes AI candidate discard requests to discardAiCandidate', async () => {
    await request(app.getHttpServer() as Parameters<typeof request>[0])
      .post('/manuscripts/ai/candidates/206/discard')
      .expect(201);

    expect(manuscriptsService.discardAiCandidate).toHaveBeenCalledWith(206, 100);
  });
});
