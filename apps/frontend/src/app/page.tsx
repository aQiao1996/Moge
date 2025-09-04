import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '墨阁',
  description: '墨阁描述',
  icons: { icon: '/favicon.ico', apple: '/favicon.ico' },
};

export default function Home() {
  return (
    <div>
      <h1>Hello, world!</h1>
    </div>
  );
}
