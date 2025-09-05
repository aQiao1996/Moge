'use client';

import { useSettings } from '@/stores/settings';
import { useState } from 'react';

export function AuthSettings() {
  const { theme, lang, setTheme, setLang } = useSettings();

  /* 控制动画类 */
  const [themeAnim, setThemeAnim] = useState('');
  const [langAnim, setLangAnim] = useState('');

  const handleTheme = () => {
    setThemeAnim('rotate-90'); // 顺时针转 90°
    setTheme(theme === 'light' ? 'dark' : 'light');
    setTimeout(() => setThemeAnim(''), 250); // 移除类，允许下次再触
  };

  const handleLang = () => {
    setLangAnim('scale-95'); // 轻微缩小
    setLang(lang === 'zh' ? 'en' : 'zh');
    setTimeout(() => setLangAnim(''), 200);
  };

  return (
    <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
      {/* 换肤 */}
      <button
        onClick={handleTheme}
        title="切换主题"
        className={`duration-250 grid h-8 w-8 cursor-pointer place-items-center rounded-full border border-white/10 bg-white/5 text-white/80 backdrop-blur-sm transition-transform hover:bg-white/10 ${themeAnim}`}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      {/* 换语言 */}
      <button
        onClick={handleLang}
        title="切换语言"
        className={`h-8 w-8 cursor-pointer rounded-full border border-white/10 bg-white/5 px-1 py-1 text-xs font-semibold text-white/80 backdrop-blur-sm transition-transform duration-200 hover:bg-white/10 ${langAnim}`}
      >
        {lang.toUpperCase()}
      </button>
    </div>
  );
}
