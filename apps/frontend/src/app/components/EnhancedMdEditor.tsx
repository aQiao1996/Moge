/**
 * 增强版 Markdown 编辑器
 * 支持 @ 引用功能
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import MdEditor, { MdEditorRef } from './MdEditor';
import AtMentionSearch from '@/components/AtMentionSearch';
import { type SearchResult } from '@/api/search.api';

interface EnhancedMdEditorProps {
  value: string;
  onChange: (value: string) => void;
  projectId?: number;
  placeholder?: string;
  height?: number;
  onTextSelect?: (selectedText: string) => void;
}

export default function EnhancedMdEditor({
  value,
  onChange,
  projectId,
  placeholder,
  height,
  onTextSelect,
}: EnhancedMdEditorProps) {
  const [showAtSearch, setShowAtSearch] = useState(false);
  const [atPosition, setAtPosition] = useState(0);
  const editorRef = useRef<MdEditorRef>(null);
  const valueRef = useRef(value);

  // 更新值引用
  valueRef.current = value;

  /**
   * 处理内容变化，检测 @ 输入
   */
  const handleContentChange = useCallback(
    (newValue: string) => {
      // 检测是否输入了 @
      const lastChar = newValue[newValue.length - 1];
      const prevLength = valueRef.current.length;

      // 如果新增了字符且最后一个字符是 @
      if (newValue.length > prevLength && lastChar === '@') {
        setAtPosition(newValue.length - 1);
        setShowAtSearch(true);
      }

      onChange(newValue);
    },
    [onChange]
  );

  /**
   * 处理设定选择
   */
  const handleSettingSelect = useCallback(
    (item: SearchResult) => {
      // 生成链接格式
      const link = `[@${item.name}](moge://${item.type}/${item.id})`;

      // 替换 @ 字符为链接
      const newValue =
        valueRef.current.slice(0, atPosition) + link + valueRef.current.slice(atPosition + 1);

      onChange(newValue);
      setShowAtSearch(false);
    },
    [atPosition, onChange]
  );

  return (
    <div className="relative">
      <MdEditor
        ref={editorRef}
        value={value}
        onChange={handleContentChange}
        placeholder={placeholder}
        height={height}
        onTextSelect={onTextSelect}
      />

      <AtMentionSearch
        projectId={projectId}
        open={showAtSearch}
        onOpenChange={setShowAtSearch}
        onSelect={handleSettingSelect}
      />
    </div>
  );
}
