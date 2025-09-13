import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { TRPCClient } from '@trpc/client';

/**
 * 获取 API 基础 URL
 * 根据不同的运行环境返回合适的 URL
 */
function getBaseUrl(): string {
  // 浏览器环境：使用相对路径，让浏览器自动使用当前域名
  if (typeof window !== 'undefined') return '';

  // Vercel 部署环境：使用 Vercel 提供的 URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  // Render 部署环境：使用内部主机名
  if (process.env.RENDER_INTERNAL_HOSTNAME)
    return `http://${process.env.RENDER_INTERNAL_HOSTNAME}:${process.env.PORT}`;

  // 本地开发环境：默认使用 localhost:3001 (后端端口)
  return `http://localhost:${process.env.PORT ?? 3001}`;
}

/**
 * 创建 tRPC 客户端
 * 用于在前端调用后端的 tRPC 接口
 * 添加明确的类型注解以满足 lint 要求
 */
export const trpcClient: TRPCClient<any> = createTRPCClient({
  links: [
    httpBatchLink({
      // API 端点：/api/trpc 是后端 tRPC 服务的统一入口
      url: `${getBaseUrl()}/api/trpc`,
    }),
  ],
});
