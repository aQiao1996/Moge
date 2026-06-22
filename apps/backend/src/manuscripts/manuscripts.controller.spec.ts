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
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    manuscriptsService.reorderVolumes.mockResolvedValue({ message: '卷排序更新成功' });
    manuscriptsService.reorderChapters.mockResolvedValue({ message: '章节排序更新成功' });

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
});
