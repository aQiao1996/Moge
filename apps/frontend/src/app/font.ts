import localFont from 'next/font/local';

export const hanFont = localFont({
  src: '../../public/fonts/钟齐志莽行书.woff2',
  display: 'swap', // 防闪烁
  variable: '--font-han', // CSS 变量名
  weight: '100 900',
});
