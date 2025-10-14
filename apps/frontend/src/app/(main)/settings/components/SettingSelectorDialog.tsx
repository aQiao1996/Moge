'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Check } from 'lucide-react';
import { getSettingsByCategory } from '@/api/settings.api';

interface SettingItem {
  id: number;
  name: string;
  background?: string | null;
  description?: string | null;
  tags?: string[];
}

interface SettingSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: 'characters' | 'systems' | 'worlds' | 'misc';
  categoryLabel: string;
  selectedIds: string[];
  onConfirm: (selectedIds: string[]) => void;
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
}

/**
 * 设定选择器弹窗组件
 * 用于从设定库中选择设定添加到项目
 */
export default function SettingSelectorDialog({
  open,
  onOpenChange,
  category,
  categoryLabel,
  selectedIds,
  onConfirm,
  Icon,
  color,
}: SettingSelectorDialogProps) {
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>([]);

  /**
   * 加载设定库数据
   */
  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettingsByCategory(category);
      setSettings(data as SettingItem[]);
    } catch (error) {
      console.error('加载设定库数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 当弹窗打开时加载数据并初始化选中状态
  useEffect(() => {
    if (open) {
      setTempSelectedIds([...selectedIds]);
      void loadSettings();
      setSearchText('');
    }
  }, [open, selectedIds]);

  /**
   * 切换设定的选中状态
   */
  const toggleSetting = (id: string) => {
    setTempSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  /**
   * 过滤设定列表
   */
  const filteredSettings = settings.filter((setting) => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      setting.name.toLowerCase().includes(searchLower) ||
      (setting.background || '').toLowerCase().includes(searchLower) ||
      (setting.description || '').toLowerCase().includes(searchLower)
    );
  });

  /**
   * 确认选择
   */
  const handleConfirm = () => {
    onConfirm(tempSelectedIds);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${color}`} />
            从设定库添加{categoryLabel}
          </DialogTitle>
        </DialogHeader>

        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--moge-text-muted)]" />
          <Input
            placeholder={`搜索${categoryLabel}...`}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* 设定列表 */}
        <div className="max-h-[50vh] space-y-2 overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center text-[var(--moge-text-sub)]">加载中...</div>
          ) : filteredSettings.length === 0 ? (
            <Card
              className="border p-8 text-center"
              style={{
                backgroundColor: 'var(--moge-card-bg)',
                borderColor: 'var(--moge-card-border)',
              }}
            >
              <Icon className={`mx-auto mb-2 h-12 w-12 ${color} opacity-50`} />
              <p className="text-[var(--moge-text-sub)]">
                {searchText ? `没有找到匹配的${categoryLabel}` : `设定库中还没有${categoryLabel}`}
              </p>
            </Card>
          ) : (
            filteredSettings.map((setting) => {
              const isSelected = tempSelectedIds.includes(String(setting.id));
              const isAlreadyAdded = selectedIds.includes(String(setting.id));

              return (
                <Card
                  key={setting.id}
                  className={`cursor-pointer border p-4 transition-all ${
                    isSelected
                      ? 'bg-[var(--moge-primary-400)]/5 border-[var(--moge-primary-400)]'
                      : ''
                  }`}
                  style={{
                    backgroundColor: isSelected ? undefined : 'var(--moge-card-bg)',
                    borderColor: isSelected ? undefined : 'var(--moge-card-border)',
                  }}
                  onClick={() => toggleSetting(String(setting.id))}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${color}`} />
                        <h4 className="font-medium text-[var(--moge-text-main)]">{setting.name}</h4>
                        {isAlreadyAdded && (
                          <Badge variant="secondary" className="text-xs">
                            已添加
                          </Badge>
                        )}
                      </div>
                      <p className="line-clamp-2 text-sm text-[var(--moge-text-sub)]">
                        {setting.background || setting.description || '暂无描述'}
                      </p>
                      {setting.tags && setting.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {setting.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--moge-primary-400)] text-white">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleConfirm}>确认选择 ({tempSelectedIds.length})</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
