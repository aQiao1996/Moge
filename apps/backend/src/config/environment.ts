const JWT_SECRET_MIN_LENGTH = 32;
const JWT_SECRET_ERROR = 'JWT_SECRET 必须配置且长度不少于 32 个字符';

/**
 * 校验应用启动所需的环境变量。
 *
 * @param environment 当前进程环境配置
 * @returns 校验通过的原始配置
 * @throws JWT 密钥缺失或长度不足时抛出错误
 */
export function validateEnvironment(environment: Record<string, unknown>): Record<string, unknown> {
  const jwtSecret = environment.JWT_SECRET;

  if (typeof jwtSecret !== 'string' || jwtSecret.trim().length < JWT_SECRET_MIN_LENGTH) {
    throw new Error(JWT_SECRET_ERROR);
  }

  return environment;
}
