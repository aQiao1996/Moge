import { SecurityHeadersMiddleware } from './security-headers.middleware';

interface MockResponse {
  removeHeader: jest.Mock<void, [string]>;
  setHeader: jest.Mock<void, [string, string]>;
}

function createResponse(): MockResponse {
  return {
    removeHeader: jest.fn((name: string) => {
      void name;
    }),
    setHeader: jest.fn((name: string, value: string) => {
      void name;
      void value;
    }),
  };
}

describe('SecurityHeadersMiddleware', () => {
  it('sets conservative security headers for every response', () => {
    const middleware = new SecurityHeadersMiddleware();
    const response = createResponse();
    const next = jest.fn();

    middleware.use({}, response, next);

    expect(response.removeHeader).toHaveBeenCalledWith('X-Powered-By');
    expect(response.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    expect(response.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    expect(response.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'no-referrer');
    expect(response.setHeader).toHaveBeenCalledWith('Cross-Origin-Resource-Policy', 'same-origin');
    expect(response.setHeader).toHaveBeenCalledWith(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()'
    );
    expect(next).toHaveBeenCalledTimes(1);
  });
});
