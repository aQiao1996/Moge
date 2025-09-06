'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { BookOpen, Clock, Edit, Trash2, FilePlus } from 'lucide-react';

type Outline = { id: string; name: string; type: string; summary: string; createdAt: string };

export default function Home() {
  const [list] = useState<Outline[]>([]);
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto max-w-6xl">
      {/* 工具栏 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-han text-2xl font-bold text-[var(--moge-text-main)]">我的大纲</h1>
          <p className="mt-1 text-sm text-[var(--moge-text-sub)]">共 {list.length} 条</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-[var(--moge-glow-btn)]">
              <FilePlus className="h-4 w-4" />
              新增大纲
            </Button>
          </DialogTrigger>
          <DialogContent
            className="home-area w-full max-w-2xl border backdrop-blur-xl"
            style={{
              backgroundColor: 'var(--moge-dialog-bg)',
              borderColor: 'var(--moge-dialog-border)',
              color: 'var(--moge-text-main)',
            }}
          >
            <DialogHeader>
              <DialogTitle>新建大纲</DialogTitle>
              <DialogDescription style={{ color: 'var(--moge-text-sub)' }}>
                填写信息后点击创建即可生成大纲
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-3">
                <Label className="text-right">小说名称</Label>
                <Input className="col-span-3" placeholder="会说话的核弹" />
              </div>
              <div className="grid grid-cols-4 items-center gap-3">
                <Label className="text-right">小说类型</Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="请选择" />
                  </SelectTrigger>
                  <SelectContent>
                    {['科幻', '奇幻', '悬疑', '言情', '历史'].map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-3">
                <Label className="text-right">故事时代</Label>
                <Input className="col-span-3" placeholder="例：近未来 2150 年" />
              </div>
              <div className="grid grid-cols-4 items-center gap-3">
                <Label className="text-right">核心冲突</Label>
                <Textarea
                  className="col-span-3"
                  rows={3}
                  placeholder="例：一颗会说话的核弹要求主角 24 小时内帮它自杀……"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-3">
                <Label className="text-right">风格标签</Label>
                <div className="col-span-3 flex flex-wrap gap-2">
                  {['黑暗', '轻松', '多视角', '群像', '热血', '反套路'].map((t) => (
                    <Badge key={t} variant="secondary" className="cursor-pointer">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-3">
                <Label className="text-right">备注</Label>
                <Textarea className="col-span-3" rows={2} placeholder="备忘信息" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button className="shadow-[var(--moge-glow-btn)]">创建</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 列表/空态 */}
      {list.length === 0 ? (
        <Card
          className="border p-10 text-center backdrop-blur-xl"
          style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
        >
          <BookOpen className="mx-auto h-12 w-12 text-[var(--moge-text-muted)]" />
          <p className="mt-4 text-[var(--moge-text-sub)]">
            暂无大纲，点击右上角「新增大纲」创建第一条
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {list.map((it) => (
            <Card
              key={it.id}
              className="border p-4 backdrop-blur-xl transition hover:shadow-[var(--moge-glow-card)]"
              style={{
                backgroundColor: 'var(--moge-card-bg)',
                borderColor: 'var(--moge-card-border)',
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-han font-semibold text-[var(--moge-text-main)]">
                      {it.name}
                    </h3>
                    <Badge className="text-xs">{it.type}</Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-[var(--moge-text-sub)]">
                    {it.summary}
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-[var(--moge-text-muted)]">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {it.createdAt}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
