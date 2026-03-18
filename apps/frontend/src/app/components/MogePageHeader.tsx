import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MogePageHeaderProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
  iconClassName?: string;
}

/**
 * 一级页面统一头部
 * 统一标题、图标、描述和右侧操作区的布局与视觉节奏
 */
export default function MogePageHeader({
  title,
  description,
  icon: Icon,
  actions,
  className,
  iconClassName,
}: MogePageHeaderProps) {
  return (
    <div
      className={cn('flex flex-col gap-4 md:flex-row md:items-start md:justify-between', className)}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <Icon className={cn('h-8 w-8 shrink-0 text-[var(--moge-primary)]', iconClassName)} />
          <div className="min-w-0">
            <h1 className="font-han text-3xl font-bold text-[var(--moge-text-main)]">{title}</h1>
            {description && (
              <p className="mt-2 text-sm leading-6 text-[var(--moge-text-sub)]">{description}</p>
            )}
          </div>
        </div>
      </div>

      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
