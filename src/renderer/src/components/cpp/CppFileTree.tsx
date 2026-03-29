import React, { useState, useEffect } from 'react';
import {
  FileCode,
  Plus,
  Trash2,
  ChevronRight,
  FolderOpen
} from 'lucide-react';

export interface CppFile {
  id: string;
  name: string;
  code: string;
  createdAt: string;
}

interface CppFileTreeProps {
  files: CppFile[];
  activeFileId: string | null;
  onSelectFile: (fileId: string) => void;
  onAddFile: () => void;
  onDeleteFile: (fileId: string) => void;
}

export function CppFileTree({
  files,
  activeFileId,
  onSelectFile,
  onAddFile,
  onDeleteFile
}: CppFileTreeProps) {
  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* 标题 */}
      <div className="px-3 py-3 border-b border-gray-700/50 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">代码文件</span>
        <button
          onClick={onAddFile}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-blue-500/20 text-gray-500 hover:text-blue-400 transition-colors"
          title="新建文件"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* 文件列表 */}
      <div className="flex-1 overflow-y-auto py-2">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <FileCode size={32} className="text-gray-600 mb-3" />
            <p className="text-xs text-gray-500 mb-1">暂无代码文件</p>
            <p className="text-xs text-gray-600">点击 + 创建新文件</p>
          </div>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              className={`group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                activeFileId === file.id
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
              }`}
              onClick={() => onSelectFile(file.id)}
            >
              <FileCode size={14} className={activeFileId === file.id ? 'text-blue-400' : ''} />
              <span className="text-sm flex-1 truncate">{file.name}</span>
              <button
                className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all"
                onClick={(e) => { e.stopPropagation(); onDeleteFile(file.id); }}
                title="删除"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* 底部提示 */}
      <div className="px-3 py-2 border-t border-gray-700/50 text-xs text-gray-600">
        {files.length} 个文件
      </div>
    </div>
  );
}

// 管理 C++ 文件的 hook
export function useCppFiles() {
  const [files, setFiles] = useState<CppFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  // 从 localStorage 加载
  useEffect(() => {
    const saved = localStorage.getItem('cpp-files');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFiles(parsed.files || []);
        setActiveFileId(parsed.activeFileId || null);
      } catch (e) {
        console.error('Failed to load cpp files:', e);
      }
    }
  }, []);

  // 保存到 localStorage
  useEffect(() => {
    localStorage.setItem('cpp-files', JSON.stringify({ files, activeFileId }));
  }, [files, activeFileId]);

  const addFile = () => {
    const newFile: CppFile = {
      id: `cpp-${Date.now()}`,
      name: `untitled-${files.length + 1}.cpp`,
      code: '',
      createdAt: new Date().toISOString()
    };
    setFiles([...files, newFile]);
    setActiveFileId(newFile.id);
    return newFile.id;
  };

  const deleteFile = (fileId: string) => {
    const newFiles = files.filter(f => f.id !== fileId);
    setFiles(newFiles);
    if (activeFileId === fileId) {
      setActiveFileId(newFiles[0]?.id || null);
    }
  };

  const updateFile = (fileId: string, updates: Partial<CppFile>) => {
    setFiles(files.map(f => f.id === fileId ? { ...f, ...updates } : f));
  };

  const getActiveFile = () => files.find(f => f.id === activeFileId) || null;

  return {
    files,
    activeFileId,
    setActiveFileId,
    addFile,
    deleteFile,
    updateFile,
    getActiveFile
  };
}
