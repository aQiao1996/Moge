/**
 * tRPC React Query 客户端 & Vanilla 客户端
 */
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@moge/types';

/**
 * 存储获取 token 的方法
 * @internal
 */
let getToken: () => string | null = () => null;

/**
 * 设置获取认证 token 的方法
 * @param getter - 一个返回 token 或 null 的函数
 * @description
 * 此函数用于从外部模块 (如 authStore) 向 tRPC 客户端注入获取 token 的能力,
 * 以此来打破模块间的循环依赖。
 */
export const setAuthTokenGetter = (getter: () => string | null) => {
  getToken = getter;
};

/**
 * 获取 API 基础 URL
 * @returns API 基础 URL 字符串
 */
function getBaseUrl(): string {
  if (typeof window !== 'undefined') return '';
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3001}`;
}

/**
 * tRPC React Hooks 客户端
 * @description 用于在 React 组件中调用 API,提供 useQuery, useMutation 等 hooks。
 */
export const api = createTRPCReact<AppRouter>();

/**
 * tRPC Vanilla 客户端
 * @description 用于在非 React 组件环境 (如 store, server-side) 中调用 API。
 */
export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      /**
       * 自动将认证 token 注入到每个请求的 header 中
       */
      headers() {
        const token = getToken(); // 调用注入的 getter 方法获取 token
        return {
          ...(token && { Authorization: `Bearer ${token}` }),
        };
      },
    }),
  ],
});
