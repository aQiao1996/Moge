/**
 * tRPC 客户端
 * 该文件导出了两种客户端:
 * 1. trpcClient: 用于客户端。它会自动从 authStore 获取 token 并附加到请求头。
 * 2. publicTrpcClient: 用于服务端。它是一个不带任何认证逻辑的公共客户端。
 */
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@moge/types';

// --- 基础配置 ---

/**
 * 获取 API 基础 URL
 */
function getBaseUrl(): string {
  if (typeof window !== 'undefined') return '';
  if (process.env.VERCEL_URL) return `httpshttps://${process.env.VERCEL_URL}`;
  return process.env.API_URL ?? 'http://localhost:8888';
}

/**
 * 获取 tRPC 接口的完整 URL
 */
const getTrpcUrl = () => {
  // 在浏览器中, 所有请求都走 Next.js 代理
  if (typeof window !== 'undefined') {
    return '/api/trpc';
  }
  // 在服务器中, 直接访问后端地址
  // 注意: 公共客户端(用于登录)和认证客户端(登录后)访问的后端路径是一样的
  return `${getBaseUrl()}/trpc`;
};

// --- 公共客户端 (用于服务端, 如 NextAuth authorize) ---

/**
 * 公共 tRPC 客户端, 不包含任何认证逻辑
 */
export const publicTrpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: getTrpcUrl(true),
    }),
  ],
});

// --- 认证客户端 (用于客户端) ---

let getToken: () => string | null = () => null;

/**
 * 注入一个从 authStore 获取 token 的方法, 以打破循环依赖
 */
export const setAuthTokenGetter = (getter: () => string | null) => {
  getToken = getter;
};

/**
 * React Hooks 客户端 (用于组件)
 */
export const api = createTRPCReact<AppRouter>();

/**
 * Vanilla 认证客户端 (用于 store 或组件外部)
 */
export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: getTrpcUrl(),
      headers() {
        const token = getToken();
        return {
          ...(token && { Authorization: `Bearer ${token}` }),
        };
      },
    }),
  ],
});
