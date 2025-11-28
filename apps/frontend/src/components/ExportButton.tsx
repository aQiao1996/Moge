'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileCode, Eye } from 'lucide-react';
import { toast } from 'sonner';
import {
  exportChapterToTxt,
  exportManuscriptToTxt,
  exportManuscriptToMarkdown,
  previewExport,
} from '@/api/export.api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ExportButtonProps {
  type: 'chapter' | 'manuscript';
  id: number;
  name?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
}

export default function ExportButton({
  type,
  id,
  name,
  variant = 'outline',
  size = 'default',
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [previewFormat, setPreviewFormat] = useState<'txt' | 'markdown'>('txt');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [preserveFormatting, setPreserveFormatting] = useState(false);

  const handleExportTxt = async () => {
    setLoading(true);
    try {
      if (type === 'chapter') {
        await exportChapterToTxt(id);
        toast.success('章节导出成功');
      } else {
        await exportManuscriptToTxt(id, {
          includeMetadata,
          preserveFormatting,
        });
        toast.success('文稿导出成功');
      }
    } catch (error) {
      console.error('导出失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportMarkdown = async () => {
    if (type !== 'manuscript') return;

    setLoading(true);
    try {
      await exportManuscriptToMarkdown(id);
      toast.success('Markdown导出成功');
    } catch (error) {
      console.error('导出失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (format: 'txt' | 'markdown') => {
    setLoading(true);
    try {
      const result = await previewExport(type, id, format);
      setPreviewContent(result.content);
      setPreviewFormat(result.format);
      setPreviewOpen(true);
    } catch (error) {
      console.error('预览失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} disabled={loading}>
            <Download className="mr-2 h-4 w-4" />
            导出
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>选择导出格式</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* TXT格式 */}
          <DropdownMenuItem onClick={() => void handleExportTxt()}>
            <FileText className="mr-2 h-4 w-4" />
            导出为 TXT
          </DropdownMenuItem>

          {/* Markdown格式（仅文稿） */}
          {type === 'manuscript' && (
            <DropdownMenuItem onClick={() => void handleExportMarkdown()}>
              <FileCode className="mr-2 h-4 w-4" />
              导出为 Markdown
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* 导出选项（仅文稿） */}
          {type === 'manuscript' && (
            <>
              <DropdownMenuLabel>导出选项</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={includeMetadata}
                onCheckedChange={setIncludeMetadata}
              >
                包含元数据
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={preserveFormatting}
                onCheckedChange={setPreserveFormatting}
              >
                保留格式
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* 预览 */}
          <DropdownMenuItem onClick={() => void handlePreview('txt')}>
            <Eye className="mr-2 h-4 w-4" />
            预览 TXT
          </DropdownMenuItem>
          {type === 'manuscript' && (
            <DropdownMenuItem onClick={() => void handlePreview('markdown')}>
              <Eye className="mr-2 h-4 w-4" />
              预览 Markdown
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 预览对话框 */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[80vh] max-w-4xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              导出预览 - {name || (type === 'chapter' ? '章节' : '文稿')} (
              {previewFormat.toUpperCase()})
            </DialogTitle>
            <DialogDescription>以下是导出后的内容预览</DialogDescription>
          </DialogHeader>
          <div className="mt-4 max-h-[60vh] overflow-y-auto rounded-md bg-gray-50 p-4">
            <pre className="whitespace-pre-wrap font-mono text-sm">{previewContent}</pre>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              关闭
            </Button>
            <Button
              onClick={() => {
                if (previewFormat === 'markdown' && type === 'manuscript') {
                  void handleExportMarkdown();
                } else {
                  void handleExportTxt();
                }
                setPreviewOpen(false);
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              下载文件
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
