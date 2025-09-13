/**
 * tRPC 客户端配置和通用 API 调用方法
 */

/**
 * 调用后端 tRPC 接口的通用方法
 * @param endpoint API 端点 (例如: 'auth.login')
 * @param data 请求数据
 * @param token 认证令牌
 * @returns API 响应结果
 */
export async function callTrpcApi(
  endpoint: string,
  data?: unknown,
  token?: string | null
): Promise<unknown> {
  const response = await fetch(`/api/trpc/${endpoint}`, {
    method: data ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(data && { body: JSON.stringify(data) }),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as { message?: string };
    throw new Error(errorData.message || `${endpoint} 请求失败`);
  }

  return await response.json();
}

/**
 * API 配置
 */
export const apiConfig = {
  baseUrl: '/api/trpc',
  timeout: 10000, // 10秒超时
  retryCount: 3, // 重试次数
  retryDelay: 1000, // 重试延迟
};
