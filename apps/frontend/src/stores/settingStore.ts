'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Theme is no longer managed here
type Lang = 'zh' | 'en';

interface SettingsState {
  lang: Lang;
  setLang: (l: Lang) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      lang: 'zh',
      setLang: (lang) => set({ lang }),
    }),
    { name: 'moge-settings' }
  )
);
