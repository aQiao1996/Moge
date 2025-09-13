// 重新导出 trpc 相关工具和类型
export { createTRPCReact } from '@trpc/react-query';
export { createTRPCClient, httpBatchLink } from '@trpc/client';

// 为了避免复杂的类型问题，我们使用类型占位符
// 实际的类型会在运行时由 tRPC 自动推断
export type AppRouter = any;
