/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import NextAuth from 'next-auth';
import GitlabProvider from 'next-auth/providers/gitlab';

// * 解决 next-auth 类型问题,不然 eslint 报错
const handler = NextAuth({
  // Configure one or more authentication providers
  debug: process.env.NODE_ENV === 'development',
  providers: [
    GitlabProvider({
      clientId: process.env.GITLAB_CLIENT_ID,
      clientSecret: process.env.GITLAB_CLIENT_SECRET,
    }),
  ],
});

export { handler as GET, handler as POST };
