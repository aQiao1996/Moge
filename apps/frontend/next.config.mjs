/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /**
   * 配置开发环境下的代理，解决跨域问题
   * @see https://nextjs.org/docs/api-reference/next.config.js/rewrites
   */
  async rewrites() {
    return [
      {
        // 源路径：所有以 /moge-api/ 开头的请求
        source: '/moge-api/:path*',
        // 目标路径：代理到环境变量中定义的后端服务地址
        destination: `${process.env.NEXT_APP_API_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;