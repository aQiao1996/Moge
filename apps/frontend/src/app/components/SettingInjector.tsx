'use client';

import { useEffect } from 'react';
import { useSettings } from '@/stores/settingStore';

export default function SettingInjector() {
  const theme = useSettings((state) => state.theme);

  useEffect(() => {
    // On theme change, update the class on the <html> element
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return null;
}
