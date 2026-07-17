import { BadRequestException, type ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

interface MockResponse {
  status: jest.Mock<MockResponse, [number]>;
  json: jest.Mock<void, [unknown]>;
}

function createHost(path = '/test', method = 'GET') {
  const response: MockResponse = {
    status: jest.fn((statusCode: number) => {
      void statusCode;
      return response;
    }),
    json: jest.fn((payload: unknown) => {
      void payload;
    }),
  };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ path, method }),
    }),
  } as unknown as ArgumentsHost;

  return { host, response };
}

describe('HttpExceptionFilter', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('normalizes validation messages into the shared error response', () => {
    const filter = new HttpExceptionFilter();
    const { host, response } = createHost('/projects', 'POST');

    filter.catch(new BadRequestException({ message: ['名称不能为空', '类型不合法'] }), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith({
      code: HttpStatus.BAD_REQUEST,
      timestamp: expect.any(String) as string,
      path: '/projects',
      method: 'POST',
      message: '名称不能为空 & 类型不合法',
    });
  });

  it('converts unexpected exceptions into a safe 500 response', () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const filter = new HttpExceptionFilter();
    const { host, response } = createHost('/workspace/summary', 'GET');

    filter.catch(new Error('database password leaked'), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.json).toHaveBeenCalledWith({
      code: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: expect.any(String) as string,
      path: '/workspace/summary',
      method: 'GET',
      message: '服务器内部错误',
    });
  });
});
