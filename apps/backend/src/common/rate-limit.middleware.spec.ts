import { RateLimitMiddleware } from './rate-limit.middleware';

interface MockResponse {
  status: jest.Mock<MockResponse, [number]>;
  json: jest.Mock<void, [unknown]>;
  setHeader: jest.Mock<void, [string, string]>;
}

function createResponse(): MockResponse {
  const response: MockResponse = {
    status: jest.fn((statusCode: number) => {
      void statusCode;
      return response;
    }),
    json: jest.fn((payload: unknown) => {
      void payload;
    }),
    setHeader: jest.fn((name: string, value: string) => {
      void name;
      void value;
    }),
  };

  return response;
}

function createRequest(ip = '127.0.0.1', path = '/auth/login') {
  return {
    ip,
    path,
    headers: {},
  };
}

describe('RateLimitMiddleware', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-23T08:00:00.000Z'));
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.useRealTimers();
  });

  it('allows requests under the configured limit', () => {
    process.env.RATE_LIMIT_WINDOW_MS = '60000';
    process.env.RATE_LIMIT_MAX = '2';
    const middleware = new RateLimitMiddleware();
    const response = createResponse();
    const next = jest.fn();

    middleware.use(createRequest(), response, next);
    middleware.use(createRequest(), response, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(response.status).not.toHaveBeenCalled();
  });

  it('blocks requests after the configured limit is exceeded', () => {
    process.env.RATE_LIMIT_WINDOW_MS = '60000';
    process.env.RATE_LIMIT_MAX = '1';
    const middleware = new RateLimitMiddleware();
    const response = createResponse();
    const next = jest.fn();

    middleware.use(createRequest(), response, next);
    middleware.use(createRequest(), response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(response.status).toHaveBeenCalledWith(429);
    expect(response.json).toHaveBeenCalledWith({
      code: 429,
      message: '请求过于频繁，请稍后再试',
    });
  });

  it('starts a new window after the previous one expires', () => {
    process.env.RATE_LIMIT_WINDOW_MS = '1000';
    process.env.RATE_LIMIT_MAX = '1';
    const middleware = new RateLimitMiddleware();
    const response = createResponse();
    const next = jest.fn();

    middleware.use(createRequest(), response, next);
    jest.setSystemTime(new Date('2026-06-23T08:00:02.000Z'));
    middleware.use(createRequest(), response, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(response.status).not.toHaveBeenCalled();
  });
});
