import NextAuth, { type NextAuthOptions } from 'next-auth';
import type { NextRequest } from 'next/server';
import GitlabProvider, { type GitLabProfile } from 'next-auth/providers/gitlab';
import CredentialsProvider from 'next-auth/providers/credentials';
import httpRequest from '@/lib/request';

const authOptions: NextAuthOptions = {
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
        if (!credentials) {
          return null;
        }

        try {
          console.log('🚀 NextAuth authorize 开始调用后端登录API');
          // 调用后端 HTTP API 进行身份验证
          const response = await httpRequest.post<{
            user: { id: string; username: string; email: string; name: string; avatarUrl: string };
            token: string;
          }>(
            '/auth/login',
            { username: credentials.username, password: credentials.password },
            { requiresToken: false }
          );

          const result = response.data;

          // 如果后端返回了 user 和 token，则认证成功
          if (result.user && result.token) {
            return {
              id: result.user.id,
              email: result.user.email || null,
              name: result.user.name || null,
              image: result.user.avatarUrl || null,
              username: result.user.username,
              avatarUrl: result.user.avatarUrl,
              backendToken: result.token,
            };
          }
          return null;
        } catch (error) {
          if (error instanceof Error) {
            // 直接抛出后端的错误信息，让NextAuth显示给用户
            throw new Error(error.message);
          }
          throw new Error('认证时发生未知错误');
        }
      },
    }),
    // GitLab 登录
    GitlabProvider({
      clientId: process.env.GITLAB_CLIENT_ID!,
      clientSecret: process.env.GITLAB_CLIENT_SECRET!,
      profile: async (profile: GitLabProfile) => {
        // 调用后端 HTTP API 处理 GitLab 登录/注册逻辑
        const response = await httpRequest.post<{
          user: {
            id: string;
            username: string;
            email: string;
            name: string;
            avatarUrl: string;
          };
          token: string;
        }>(
          '/auth/gitlab-login',
          {
            provider: 'gitlab',
            providerAccountId: profile.id.toString(),
            email: profile.email,
            name: profile.name || profile.username,
            avatarUrl: profile.avatar_url,
          },
          { requiresToken: false }
        );

        const result = response.data;

        return {
          id: result.user.id,
          username: result.user.username || result.user.email,
          name: result.user.name,
          email: result.user.email,
          avatarUrl: result.user.avatarUrl,
          backendToken: result.token,
        };
      },
    }),
  ],

  // 配置 Session 策略为 JWT
  session: { strategy: 'jwt' },

  // 配置 Callbacks, 用于控制 session 和 token 的内容
  callbacks: {
    jwt({ token, user, trigger, session }) {
      // 初始登录: user 对象存在
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.backendToken = user.backendToken;
        token.name = user.name;
        token.email = user.email;
        token.avatarUrl = user.avatarUrl;
      }

      // 客户端更新 session: trigger 为 'update'
      if (trigger === 'update' && session) {
        // 将客户端传来的新 session 数据合并到 token 中
        return { ...token, ...session } as typeof token;
      }

      return token;
    },

    // `session` callback 在客户端访问 session 时被调用
    session({ session, token }) {
      // 把 JWT 中的数据扩展到 session 对象上, 这样客户端就能通过 useSession() 获取
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.avatarUrl = token.avatarUrl as string;
        session.backendToken = token.backendToken as string;
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

const handler = NextAuth(authOptions) as {
  (req: NextRequest, context: { params: Record<string, string | string[]> }): Promise<Response>;
};

export { handler as GET, handler as POST };
