import { validateEnvironment } from './environment';

describe('validateEnvironment', () => {
  it('rejects a missing JWT secret with an actionable startup error', () => {
    expect(() => validateEnvironment({ NODE_ENV: 'test' })).toThrow(
      'JWT_SECRET 必须配置且长度不少于 32 个字符'
    );
  });

  it('rejects a JWT secret shorter than 32 characters', () => {
    expect(() => validateEnvironment({ JWT_SECRET: 'too-short' })).toThrow(
      'JWT_SECRET 必须配置且长度不少于 32 个字符'
    );
  });

  it('returns the environment when the JWT secret is valid', () => {
    const environment = {
      NODE_ENV: 'test',
      JWT_SECRET: 'a-secure-jwt-secret-with-32-chars',
    };

    expect(validateEnvironment(environment)).toBe(environment);
  });
});
