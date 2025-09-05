'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SiGitlab } from '@icons-pack/react-simple-icons';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('登录信息:', { email, password });
  };

  return (
    <div className="min-h-screen flex items-stretch bg-gradient-to-br from-[#0A0A0B] via-[#0D1B2A] to-[#123456] relative overflow-hidden">
      {/* 浮动粒子背景 */}
      <div className="absolute inset-0">
        {Array.from<undefined>({ length: 28 }).map((_, i) => (
          <span
            key={i}
            className="absolute block w-2 h-2 bg-[#00F2FE]/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* 左侧品牌区 */}
      <div className="hidden md:flex md:w-1/2 items-center justify-center relative">
        <div className="text-center text-white">
          <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#00F2FE] to-[#4FACF7] drop-shadow-[0_0_10px_#00F2FE]">
            墨阁
          </h1>
          <p className="mt-4 text-lg text-white/70 drop-shadow-[0_0_5px_#00F2FE]">
            AI 生成 · 小说世界 · 无限灵感
          </p>
        </div>
      </div>

      {/* 右侧玻璃登录区 */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-[#00F2FE]/20">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white text-center">欢迎回来</CardTitle>
            <CardDescription className="text-center text-white/70">
              登录后可体验 AI 小说生成
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/90">
                  邮箱
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-[#00F2FE] focus:border-transparent"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/90">
                  密码
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-[#00F2FE] focus:border-transparent"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#00F2FE] to-[#4FACF7] text-black font-bold shadow-lg shadow-[#00F2FE]/40 hover:shadow-[0_0_20px] hover:shadow-[#00F2FE]/60 transition-all duration-300 cursor-pointer"
              >
                立即登录
              </Button>
            </form>

            {/* 一键 GitLab 登录 */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-black/20 px-2 text-white/60">Or</span>
              </div>
            </div>
            <Button
              variant="outline"
              // onClick={() => void signIn('gitlab')}
              className="w-full border-white/20 text-white/90
           bg-gradient-to-br from-white/5 to-white/10
           hover:shadow-[0_0_20px] hover:shadow-[#00F2FE]/60
           transition-all duration-300 cursor-pointer"
            >
              <SiGitlab className="w-5 h-5 mr-2" fill="currentColor" />
              使用 GitLab 登录
            </Button>
          </CardContent>
          <CardFooter className="justify-center text-white/60 text-sm">
            还没有账户？
            <Link
              href="/signup"
              className="ml-1 text-[#00F2FE] hover:text-[#0099a3] transition-colors duration-200"
            >
              立即注册
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* 底部粒子动画 */}
      <style jsx>{`
        @keyframes float {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-20px) scale(1.1);
            opacity: 1;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 0.6;
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
