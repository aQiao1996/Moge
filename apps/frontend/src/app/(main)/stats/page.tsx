'use client';

import { Card } from '@/components/ui/card';
import { BarChart } from 'lucide-react';

export default function StatsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-han text-2xl font-bold text-[var(--moge-text-main)]">统计</h1>
        </div>
      </div>
      <Card
        className="border p-10 text-center backdrop-blur-xl"
        style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
      >
        <BarChart className="mx-auto h-12 w-12 text-[var(--moge-text-muted)]" />
        <p className="mt-4 text-[var(--moge-text-sub)]">统计功能正在开发中，敬请期待...</p>
      </Card>
    </div>
  );
}
