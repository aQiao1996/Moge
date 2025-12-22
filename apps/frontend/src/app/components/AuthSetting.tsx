'use client';
import { Button } from '@/components/ui/button';
// import { useSettings } from '@/stores/settingStore';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

/**
 * AuthSetting组件的属性接口
 */
interface AuthSettingProps {
  isAbsolute?: boolean; // 是否使用绝对定位,默认为true
}

/**
 * 主题和语言设置组件
 * 提供明暗主题切换和中英文语言切换功能。
 */
export default function AuthSetting({ isAbsolute = true }: AuthSettingProps) {
  // const { lang, setLang } = useSettings();
  const { theme, setTheme } = useTheme();

  // 动画状态
  const [themeAnim, setThemeAnim] = useState('');
  // const [langAnim, setLangAnim] = useState('');

  // 组件挂载状态,用于防止主题切换时的水合错误
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * 处理主题切换
   * 在light和dark主题之间切换,system主题视为light
   * 使用 View Transitions API 实现圆形扩散动画
   */
  const handleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
    // 检查浏览器是否支持 View Transitions API
    if (!document.startViewTransition) {
      // 不支持则直接切换
      setTheme(theme === 'light' || theme === 'system' ? 'dark' : 'light');
      return;
    }

    // 获取点击位置
    const x = event.clientX;
    const y = event.clientY;

    // 计算覆盖整个屏幕所需的半径（从点击位置到屏幕最远角的距离）
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // 启动 View Transition
    const transition = document.startViewTransition(() => {
      setTheme(theme === 'light' || theme === 'system' ? 'dark' : 'light');
    });

    // 等待 transition 准备就绪后执行动画
    void transition.ready.then(() => {
      // 按钮旋转动画
      setThemeAnim('rotate-90');
      setTimeout(() => {
        setThemeAnim('');
      }, 250);

      // 圆形扩散动画 - 统一使用 new(root) 从小圆扩散到大圆
      document.documentElement.animate(
        {
          clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`],
        },
        {
          duration: 500,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  };

  /**
   * 处理语言切换
   * 在中文和英文之间切换
   */
  // const handleLang = () => {
  //   const newLang = lang === 'zh' ? 'en' : 'zh';
  //   setLangAnim('scale-95');
  //   setLang(newLang);
  //   setTimeout(() => {
  //     setLangAnim('');
  //   }, 200);
  // };

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
      {/* 主题切换按钮 */}
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

      {/* 语言切换按钮 */}
      {/* <Button
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
      </Button> */}
    </div>
  );
}
