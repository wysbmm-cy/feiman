import React, { useState } from 'react';
import { 
  Folder, 
  FileCode, 
  ChevronRight, 
  ChevronDown,
  Circle,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export type ConceptStatus = 'unlearned' | 'learning' | 'mastered' | 'gaps';

export interface Concept {
  id: string;
  name: string;
  type: 'folder' | 'file';
  status?: ConceptStatus;
  children?: Concept[];
}

interface ConceptTreeProps {
  concepts: Concept[];
  activeConcept: string | null;
  onSelectConcept: (conceptId: string, conceptName: string) => void;
  onStatusChange?: (conceptId: string, status: ConceptStatus) => void;
}

const STATUS_ICONS: Record<ConceptStatus, React.ReactNode> = {
  unlearned: <Circle size={10} className="text-gray-500" />,
  learning: <AlertCircle size={12} className="text-yellow-500" />,
  mastered: <CheckCircle size={12} className="text-green-500" />,
  gaps: <AlertCircle size={12} className="text-red-500" />
};

const STATUS_COLORS: Record<ConceptStatus, string> = {
  unlearned: 'text-gray-400',
  learning: 'text-yellow-400',
  mastered: 'text-green-400',
  gaps: 'text-red-400'
};

/**
 * ConceptTree - C++ 概念文件树
 * 
 * 功能：
 * - 树形结构展示概念
 * - 状态标识（未学习/学习中/已掌握/有盲区）
 * - 点击选择概念
 */
export function ConceptTree({ concepts, activeConcept, onSelectConcept }: ConceptTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['memory', 'modern']);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  const renderTree = (items: Concept[], depth = 0) => {
    return items.map(item => {
      const isExpanded = expandedFolders.includes(item.id);
      const isActive = activeConcept === item.id;
      
      if (item.type === 'folder') {
        return (
          <div key={item.id}>
            <div
              className="flex items-center gap-1.5 py-1.5 px-2 cursor-pointer hover:bg-blue-500/10 rounded transition-colors group"
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
              onClick={() => toggleFolder(item.id)}
            >
              {isExpanded ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />}
              <Folder size={16} className="text-yellow-500/70" />
              <span className="text-sm text-gray-300 group-hover:text-gray-100">{item.name}</span>
            </div>
            {isExpanded && item.children && (
              <div>{renderTree(item.children, depth + 1)}</div>
            )}
          </div>
        );
      }

      return (
        <div
          key={item.id}
          className={`flex items-center gap-2 py-1.5 px-2 cursor-pointer rounded transition-all group ${
            isActive 
              ? 'bg-blue-500/20 border-l-2 border-blue-400' 
              : 'hover:bg-white/5 border-l-2 border-transparent'
          }`}
          style={{ paddingLeft: `${depth * 12 + 20}px` }}
          onClick={() => onSelectConcept(item.id, item.name)}
        >
          <FileCode size={14} className={isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-400'} />
          <span className={`text-sm flex-1 ${isActive ? 'text-blue-300 font-medium' : STATUS_COLORS[item.status || 'unlearned']}`}>
            {item.name}
          </span>
          {item.status && STATUS_ICONS[item.status]}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* 标题 */}
      <div className="px-3 py-3 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">概念列表</span>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <CheckCircle size={10} className="text-green-500" />
              <span>已掌握</span>
            </span>
          </div>
        </div>
      </div>
      
      {/* 树形列表 */}
      <div className="flex-1 overflow-y-auto py-2">
        {renderTree(concepts)}
      </div>

      {/* 底部统计 */}
      <div className="px-3 py-2 border-t border-gray-700/50 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>已学习: 0/{countConcepts(concepts)} 个概念</span>
        </div>
      </div>
    </div>
  );
}

function countConcepts(items: Concept[]): number {
  return items.reduce((count, item) => {
    if (item.type === 'file') return count + 1;
    if (item.children) return count + countConcepts(item.children);
    return count;
  }, 0);
}

// 预定义的 C++ 概念列表
export const CPP_CONCEPTS: Concept[] = [
  {
    id: 'memory',
    name: '内存管理',
    type: 'folder',
    children: [
      { id: 'pointers', name: '指针', type: 'file', status: 'unlearned' },
      { id: 'references', name: '引用', type: 'file', status: 'unlearned' },
      { id: 'smart_ptr', name: '智能指针', type: 'file', status: 'unlearned' },
      { id: 'raii', name: 'RAII', type: 'file', status: 'unlearned' },
      { id: 'memory_leak', name: '内存泄漏', type: 'file', status: 'unlearned' },
    ]
  },
  {
    id: 'modern',
    name: '现代 C++',
    type: 'folder',
    children: [
      { id: 'move_semantic', name: '移动语义', type: 'file', status: 'unlearned' },
      { id: 'rvalue_ref', name: '右值引用', type: 'file', status: 'unlearned' },
      { id: 'lambda', name: 'Lambda 表达式', type: 'file', status: 'unlearned' },
      { id: 'auto', name: '类型推导', type: 'file', status: 'unlearned' },
      { id: 'constexpr', name: '编译期计算', type: 'file', status: 'unlearned' },
    ]
  },
  {
    id: 'templates',
    name: '模板编程',
    type: 'folder',
    children: [
      { id: 'function_template', name: '函数模板', type: 'file', status: 'unlearned' },
      { id: 'class_template', name: '类模板', type: 'file', status: 'unlearned' },
      { id: 'variadic', name: '可变参数模板', type: 'file', status: 'unlearned' },
      { id: 'sfinae', name: 'SFINAE', type: 'file', status: 'unlearned' },
      { id: 'concepts', name: 'C++20 Concepts', type: 'file', status: 'unlearned' },
    ]
  },
  {
    id: 'oop',
    name: '面向对象',
    type: 'folder',
    children: [
      { id: 'classes', name: '类与对象', type: 'file', status: 'unlearned' },
      { id: 'inheritance', name: '继承', type: 'file', status: 'unlearned' },
      { id: 'polymorphism', name: '多态', type: 'file', status: 'unlearned' },
      { id: 'virtual', name: '虚函数', type: 'file', status: 'unlearned' },
    ]
  },
  {
    id: 'stl',
    name: 'STL 容器',
    type: 'folder',
    children: [
      { id: 'vector', name: 'vector', type: 'file', status: 'unlearned' },
      { id: 'map', name: 'map/set', type: 'file', status: 'unlearned' },
      { id: 'algorithm', name: '算法库', type: 'file', status: 'unlearned' },
      { id: 'iterator', name: '迭代器', type: 'file', status: 'unlearned' },
    ]
  }
];
