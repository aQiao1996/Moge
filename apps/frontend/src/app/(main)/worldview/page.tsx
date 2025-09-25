'use client';

import { Card } from '@/components/ui/card';
import { Globe2 } from 'lucide-react';

export default function WorldviewPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-han text-2xl font-bold text-[var(--moge-text-main)]">世界观</h1>
        </div>
      </div>
      <Card
        className="border p-10 text-center backdrop-blur-xl"
        style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
      >
        <Globe2 className="mx-auto h-12 w-12 text-[var(--moge-text-muted)]" />
        <p className="mt-4 text-[var(--moge-text-sub)]">世界观功能正在开发中，敬请期待...</p>
      </Card>
    </div>
  );
}
