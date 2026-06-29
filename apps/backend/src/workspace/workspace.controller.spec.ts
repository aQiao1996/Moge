import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { NextFunction, Request, Response } from 'express';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface RequestWithUser extends Request {
  user?: {
    id: number;
  };
}

describe('WorkspaceController', () => {
  let app: INestApplication;
  const workspaceService = {
    getAiUsageOverview: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    workspaceService.getAiUsageOverview.mockResolvedValue({
      totalCalls: 3,
      successCount: 2,
      failedCount: 1,
      averageLatencyMs: 1200,
      appliedCandidateCount: 1,
      recentRecords: [],
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [WorkspaceController],
      providers: [
        {
          provide: WorkspaceService,
          useValue: workspaceService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

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

  it('routes AI usage overview requests to workspace service', async () => {
    await request(app.getHttpServer() as Parameters<typeof request>[0])
      .get('/workspace/ai-usage')
      .expect(200);

    expect(workspaceService.getAiUsageOverview).toHaveBeenCalledWith(100);
  });
});
