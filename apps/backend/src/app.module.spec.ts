import { AppModule } from './app.module';
import { AI_JOB_PROCESSORS, AiJobsWorkerService } from './ai-jobs/ai-jobs-worker.service';
import { AppAiJobProcessorsService } from './ai-jobs/app-ai-job-processors.service';

describe('AppModule AI job worker wiring', () => {
  it('registers the AI job worker at the application level', () => {
    const metadataProviders = Reflect.getMetadata('providers', AppModule) as unknown[];

    expect(metadataProviders).toContain(AiJobsWorkerService);
  });

  it('registers the aggregate AI job processors at the application level', () => {
    const metadataProviders = Reflect.getMetadata('providers', AppModule) as unknown[];

    expect(metadataProviders).toContain(AppAiJobProcessorsService);
    expect(metadataProviders).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          provide: AI_JOB_PROCESSORS,
          useExisting: AppAiJobProcessorsService,
        }),
      ])
    );
  });
});
