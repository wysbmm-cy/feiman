import React from 'react';
import { EditorPage } from './Editor';

/**
 * SmartEditor - 智能编辑器
 * 根据当前模式自动选择正确的编辑器
 * 注意：C++ 模式的 CppIDEContainer 包装已经在 App.tsx 中处理
 */
export function SmartEditor() {
  return <EditorPage />;
}
