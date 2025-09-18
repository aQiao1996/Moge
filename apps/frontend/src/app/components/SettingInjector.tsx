'use client';
import { useEffect } from 'react';
import { useSettings } from '@/stores/settingStore';

export default function SettingInjector() {
  const theme = useSettings((state) => state.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return null;
}
