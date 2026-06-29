import { AiJobsModule } from './ai-jobs.module';
import { AiJobsWorkerService } from './ai-jobs-worker.service';

describe('AiJobsModule', () => {
  it('does not instantiate the worker before feature processors are visible', () => {
    const metadataProviders = Reflect.getMetadata('providers', AiJobsModule) as unknown[];

    expect(metadataProviders).not.toContain(AiJobsWorkerService);
  });
});
