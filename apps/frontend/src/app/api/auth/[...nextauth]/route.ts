/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import NextAuth, { type NextAuthOptions } from 'next-auth';
import GitlabProvider from 'next-auth/providers/gitlab';
import CredentialsProvider from 'next-auth/providers/credentials';
import { publicTrpcClient } from '@/lib/trpc';

export const authOptions: NextAuthOptions = {
  // 配置认证提供者
  providers: [
    // 自定义账号密码登录
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      // `authorize` 函数是实际的验证逻辑
      async authorize(credentials) {
        if (!credentials) return null;

        try {
          // 调用后端的公共 tRPC 接口进行验证
          const result = await publicTrpcClient.auth.login.mutate({
            username: credentials.username,
            password: credentials.password,
          });

          // 如果后端返回了 user 和 token, 则验证成功
          if (result.user && result.token) {
            // 返回给 NextAuth 的对象将同时包含 user 和 token
            // 这个对象会在下面的 jwt callback 中被处理
            return {
              ...result.user,
              backendToken: result.token,
            };
          }
          return null;
        } catch (error) {
          // 如果 tRPC 调用本身抛出错误, 我们将错误的 message 传递出去
          // NextAuth 会捕获这个错误, 并将其 message 作为 signIn 返回结果的 error 字段
          if (error instanceof Error) {
            throw new Error(error.message);
          }
          // 对于未知错误, 抛出一个通用错误
          throw new Error('认证时发生未知错误');
        }
      },
    }),
    // GitLab 登录
    GitlabProvider({
      clientId: process.env.GITLAB_CLIENT_ID,
      clientSecret: process.env.GITLAB_CLIENT_SECRET,
    }),
  ],

  // 配置 Session 策略为 JWT
  session: { strategy: 'jwt' },

  // 配置 Callbacks, 用于控制 session 和 token 的内容
  callbacks: {
    // `jwt` callback 在创建或更新 JWT 时被调用
    jwt({ token, user }) {
      // 初始登录时, `user` 对象是 authorize 函数返回的对象
      if (user) {
        token.id = user.id;
        token.backendToken = user.backendToken;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },

    // `session` callback 在客户端访问 session 时被调用
    session({ session, token }) {
      // 把 JWT 中的数据扩展到 session 对象上, 这样客户端就能通过 useSession() 获取
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.backendToken = token.backendToken; // 将 backendToken 添加到 session 中
      }
      return session;
    },
  },

  // 指定自定义登录页面
  pages: { signIn: '/login' },

  // 用于加密 JWT 的密钥
  secret: process.env.NEXTAUTH_SECRET,

  // 开启 Debug 模式 (仅限开发环境)
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
