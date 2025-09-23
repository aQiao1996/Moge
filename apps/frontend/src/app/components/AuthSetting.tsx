'use client';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/stores/settingStore';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

export default function AuthSetting({ isAbsolute = true }) {
  const { lang, setLang } = useSettings();
  const { theme, setTheme } = useTheme();

  const [themeAnim, setThemeAnim] = useState('');
  const [langAnim, setLangAnim] = useState('');

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleTheme = () => {
    setThemeAnim('rotate-90');
    setTheme(theme === 'light' || theme === 'system' ? 'dark' : 'light');
    setTimeout(() => {
      setThemeAnim('');
    }, 250);
  };

  const handleLang = () => {
    const newLang = lang === 'zh' ? 'en' : 'zh';
    setLangAnim('scale-95');
    setLang(newLang);
    setTimeout(() => {
      setLangAnim('');
    }, 200);
  };

  if (!mounted) {
    // 防止布局移位
    return (
      <div className={`right-4 top-4 z-10 flex items-center gap-2 ${isAbsolute ? 'absolute' : ''}`}>
        <div className="h-8 w-8 rounded-full border border-[var(--moge-btn-border)] bg-[var(--moge-btn-bg)]"></div>
        <div className="h-8 w-8 rounded-full border border-[var(--moge-btn-border)] bg-[var(--moge-btn-bg)]"></div>
      </div>
    );
  }

  return (
    <div className={`right-4 top-4 z-10 flex items-center gap-2 ${isAbsolute ? 'absolute' : ''}`}>
      {/* 换肤 */}
      <Button
        onClick={handleTheme}
        title="切换主题"
        style={{
          borderColor: 'var(--moge-btn-border)',
          backgroundColor: 'var(--moge-btn-bg)',
          color: 'var(--moge-btn-text)',
        }}
        className={`duration-250 grid h-8 w-8 place-items-center rounded-full border p-0 backdrop-blur-sm transition-transform hover:bg-[var(--moge-btn-hover)] ${themeAnim}`}
      >
        {theme === 'light' ? '☀️' : '🌙'}
      </Button>

      {/* 换语言 */}
      <Button
        onClick={handleLang}
        title="切换语言"
        style={{
          borderColor: 'var(--moge-btn-border)',
          backgroundColor: 'var(--moge-btn-bg)',
          color: 'var(--moge-btn-text)',
        }}
        className={`h-8 w-8 rounded-full border px-1 py-1 text-xs font-normal backdrop-blur-sm transition-transform duration-200 hover:bg-[var(--moge-btn-hover)] ${langAnim}`}
      >
        {lang.toUpperCase()}
      </Button>
    </div>
  );
}
