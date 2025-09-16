// 临时解决方案：导出一个简单的占位符类型，让前端能够正常工作
// 实际的路由类型将在运行时由后端提供

/**
 * AppRouter 类型定义 - 占位符类型，避免在客户端引入 @trpc/server
 * 实际类型会在运行时通过 tRPC 客户端推导
 */
export type AppRouter = any;
