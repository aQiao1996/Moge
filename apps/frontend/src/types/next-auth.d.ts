import type { DefaultSession, User as DefaultUser } from 'next-auth';

declare module 'next-auth' {
  /**
   * 扩展 Session 类型, 以便在 useSession() 返回的 session 对象中包含 id
   */
  interface Session {
    backendToken?: string; // 添加后端 token
    user: {
      id: string;
    } & DefaultSession['user'];
  }

  /**
   * 扩展 User 类型, 以便在 authorize 的返回值和 jwt 回调的 user 参数中携带 backendToken
   */
  interface User extends DefaultUser {
    backendToken?: string;
  }
}

declare module 'next-auth/jwt' {
  /**
   * 扩展 JWT 类型, 以便在 token 对象中存储 id 和 backendToken
   */
  interface JWT {
    id?: string;
    backendToken?: string;
  }
}
