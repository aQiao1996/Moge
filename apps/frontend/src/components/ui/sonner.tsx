'use client';

import { useSettings } from '@/stores/settingStore';
import type { ToasterProps } from 'sonner';
import { Toaster as Sonner } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useSettings((state) => state.theme);

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
