'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';
type Lang = 'zh' | 'en';

interface SettingsState {
  theme: Theme;
  lang: Lang;
  setTheme: (t: Theme) => void;
  setLang: (l: Lang) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      lang: 'zh',
      setTheme: (theme) => {
        set({ theme });
        document.documentElement.classList.toggle('dark', theme === 'dark');
        fetch('/set-theme', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme }),
        }).catch((error) => {
          console.log('🚀 ~ settings.ts:29 ~ error:', error);
        });
      },
      setLang: (lang) => set({ lang }),
    }),
    { name: 'moge-settings' }
  )
);
