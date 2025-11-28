/**
 * AI 辅助面板组件
 *
 * 功能:
 * - AI 续写章节内容
 * - AI 润色文字
 * - AI 扩写内容
 * - 显示 AI 生成进度
 */
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Wand2, Sparkles, Expand, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { aiContinueChapter, aiPolishText, aiExpandText } from '../api/client';

export interface AIAssistPanelProps {
  /**
   * 当前章节 ID
   */
  chapterId: number;
  /**
   * 当前章节内容
   */
  content: string;
  /**
   * 选中的文本
   */
  selectedText?: string;
  /**
   * AI 续写回调
   */
  onContinue?: (generatedText: string) => void;
  /**
   * AI 润色回调
   */
  onPolish?: (polishedText: string) => void;
  /**
   * AI 扩写回调
   */
  onExpand?: (expandedText: string) => void;
}

export default function AIAssistPanel({
  chapterId,
  content,
  selectedText,
  onContinue,
  onPolish,
  onExpand,
}: AIAssistPanelProps) {
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [activeTab, setActiveTab] = useState<'continue' | 'polish' | 'expand'>('continue');

  /**
   * 处理 AI 续写
   */
  const handleContinue = async () => {
    if (!content.trim()) {
      toast.error('请先输入章节内容');
      return;
    }

    setLoading(true);
    setGeneratedText('');

    try {
      const response = await aiContinueChapter(chapterId, prompt || undefined);
      setGeneratedText(response.data.text);
      if (onContinue) {
        onContinue(response.data.text);
      }
      toast.success('AI 续写完成');
    } catch (error) {
      console.error('AI 续写失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理 AI 润色
   */
  const handlePolish = async () => {
    const textToPolish = selectedText || content;
    if (!textToPolish.trim()) {
      toast.error('请先选择要润色的文本或输入章节内容');
      return;
    }

    setLoading(true);
    setGeneratedText('');

    try {
      const response = await aiPolishText(chapterId, textToPolish, prompt || undefined);
      setGeneratedText(response.data.text);
      if (onPolish) {
        onPolish(response.data.text);
      }
      toast.success('AI 润色完成');
    } catch (error) {
      console.error('AI 润色失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理 AI 扩写
   */
  const handleExpand = async () => {
    const textToExpand = selectedText || content;
    if (!textToExpand.trim()) {
      toast.error('请先选择要扩写的文本或输入章节内容');
      return;
    }

    setLoading(true);
    setGeneratedText('');

    try {
      const response = await aiExpandText(chapterId, textToExpand, prompt || undefined);
      setGeneratedText(response.data.text);
      if (onExpand) {
        onExpand(response.data.text);
      }
      toast.success('AI 扩写完成');
    } catch (error) {
      console.error('AI 扩写失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 插入生成的文本到编辑器
   */
  const handleInsert = () => {
    if (!generatedText) return;

    switch (activeTab) {
      case 'continue':
        if (onContinue) {
          onContinue(generatedText);
        }
        break;
      case 'polish':
        if (onPolish) {
          onPolish(generatedText);
        }
        break;
      case 'expand':
        if (onExpand) {
          onExpand(generatedText);
        }
        break;
    }

    setGeneratedText('');
    toast.success('已插入到编辑器');
  };

  return (
    <Card
      className="flex h-full flex-col border p-4 backdrop-blur-xl"
      style={{
        backgroundColor: 'var(--moge-card-bg)',
        borderColor: 'var(--moge-card-border)',
      }}
    >
      {/* 头部标题 */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[var(--moge-text-main)]">AI 辅助</h3>
        <p className="text-sm text-[var(--moge-text-muted)]">使用 AI 辅助创作更高效</p>
      </div>

      {/* 功能 Tab */}
      <div className="mb-4 flex gap-2">
        <Button
          variant={activeTab === 'continue' ? 'default' : 'outline'}
          size="sm"
          className="flex-1"
          onClick={() => setActiveTab('continue')}
        >
          <Wand2 className="mr-2 h-4 w-4" />
          续写
        </Button>
        <Button
          variant={activeTab === 'polish' ? 'default' : 'outline'}
          size="sm"
          className="flex-1"
          onClick={() => setActiveTab('polish')}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          润色
        </Button>
        <Button
          variant={activeTab === 'expand' ? 'default' : 'outline'}
          size="sm"
          className="flex-1"
          onClick={() => setActiveTab('expand')}
        >
          <Expand className="mr-2 h-4 w-4" />
          扩写
        </Button>
      </div>

      {/* 提示词输入 */}
      <div className="mb-4">
        <label className="mb-2 block text-sm text-[var(--moge-text-sub)]">
          自定义提示词（可选）
        </label>
        <Textarea
          placeholder={
            activeTab === 'continue'
              ? '例如：继续描写主角的内心活动...'
              : activeTab === 'polish'
                ? '例如：使用更优美的语言...'
                : '例如：扩展战斗场面的描写...'
          }
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="resize-none"
          rows={3}
        />
      </div>

      {/* 选中文本提示 */}
      {selectedText && (
        <div className="mb-4">
          <Badge variant="secondary" className="text-xs">
            已选择 {selectedText.length} 个字符
          </Badge>
        </div>
      )}

      {/* 生成按钮 */}
      <Button
        onClick={() => {
          void (activeTab === 'continue'
            ? handleContinue()
            : activeTab === 'polish'
              ? handlePolish()
              : handleExpand());
        }}
        disabled={loading}
        className="mb-4"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            生成中...
          </>
        ) : (
          <>
            {activeTab === 'continue' && <Wand2 className="mr-2 h-4 w-4" />}
            {activeTab === 'polish' && <Sparkles className="mr-2 h-4 w-4" />}
            {activeTab === 'expand' && <Expand className="mr-2 h-4 w-4" />}
            开始生成
          </>
        )}
      </Button>

      {/* 生成结果 */}
      {generatedText && (
        <div className="flex-1 overflow-hidden">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--moge-text-sub)]">生成结果</span>
            <Button size="sm" onClick={handleInsert}>
              插入到编辑器
            </Button>
          </div>
          <div className="h-full overflow-y-auto rounded-md border border-[var(--moge-card-border)] bg-[var(--moge-input-bg)] p-3">
            <p className="whitespace-pre-wrap text-sm text-[var(--moge-text-main)]">
              {generatedText}
            </p>
          </div>
        </div>
      )}

      {/* 空状态 */}
      {!generatedText && !loading && (
        <div className="flex flex-1 items-center justify-center text-center text-sm text-[var(--moge-text-muted)]">
          <p>点击「开始生成」按钮使用 AI 辅助创作</p>
        </div>
      )}
    </Card>
  );
}
