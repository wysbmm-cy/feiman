import React, { useState, useRef } from 'react';
import { 
  Play, 
  Bug, 
  Folder, 
  FileCode, 
  Terminal,
  ChevronRight,
  ChevronDown,
  Cpu,
  CheckCircle,
  AlertCircle,
  Send,
  User,
  Bot
} from 'lucide-react';
import { useStore } from '../../store';
import { useAI } from '../../hooks/useAI';
import { CppRunner } from './CppRunner';

/**
 * CppIDEContainer - C++ IDE 风格学习界面
 * 
 * 三栏布局：
 * - 左侧：概念文件树
 * - 中间：概念学习区（代码示例 + 解释）
 * - 右侧：与小方的实时对话
 */
export function CppIDEContainer() {
  const { 
    cppFiles, 
    activeCppFileId, 
    setActiveCppFileId 
  } = useStore();
  
  const { messages, isStreaming, sendMessage, hasProvider } = useAI();

  const [expandedFolders, setExpandedFolders] = useState<string[]>(['src']);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeFileId = activeCppFileId || 'memory.cpp';
  const setActiveFile = (id: string) => setActiveCppFileId(id);
  const activeFile = activeFileId;

  const conceptFiles = [
    {
      id: 'src',
      name: 'C++ 核心概念',
      type: 'folder',
      children: [
        { id: 'memory.cpp', name: '内存管理', type: 'file', status: 'active' },
        { id: 'pointers.cpp', name: '指针语义', type: 'file', status: 'pending' },
        { id: 'references.cpp', name: '引用机制', type: 'file', status: 'pending' },
        { id: 'smart_ptr.cpp', name: '智能指针', type: 'file', status: 'pending' },
        { id: 'raii.cpp', name: 'RAII', type: 'file', status: 'pending' },
      ]
    },
    {
      id: 'modern',
      name: '现代 C++',
      type: 'folder',
      children: [
        { id: 'move.cpp', name: '移动语义', type: 'file', status: 'pending' },
        { id: 'lambda.cpp', name: 'Lambda表达式', type: 'file', status: 'pending' },
        { id: 'auto.cpp', name: '类型推导', type: 'file', status: 'pending' },
      ]
    },
    {
      id: 'templates',
      name: '模板编程',
      type: 'folder',
      children: [
        { id: 'template.cpp', name: '函数模板', type: 'file', status: 'pending' },
        { id: 'concepts.cpp', name: 'C++20 Concepts', type: 'file', status: 'pending' },
      ]
    },
  ];

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  const renderFileTree = (items: any[], depth = 0) => {
    return items.map(item => {
      const isExpanded = expandedFolders.includes(item.id);
      const isActive = activeFile === item.id;
      
      if (item.type === 'folder') {
        return (
          <div key={item.id}>
            <div
              className="flex items-center gap-1 py-1.5 px-2 cursor-pointer hover:bg-blue-500/10 rounded transition-colors"
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
              onClick={() => toggleFolder(item.id)}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <Folder size={16} className="text-yellow-500/80" />
              <span className="text-sm text-gray-300">{item.name}</span>
            </div>
            {isExpanded && item.children && (
              <div>{renderFileTree(item.children, depth + 1)}</div>
            )}
          </div>
        );
      }

      return (
        <div
          key={item.id}
          className={`flex items-center gap-2 py-1.5 px-2 cursor-pointer rounded transition-colors ${
            isActive ? 'bg-blue-500/20 text-blue-300' : 'hover:bg-white/5 text-gray-400'
          }`}
          style={{ paddingLeft: `${depth * 12 + 24}px` }}
          onClick={() => setActiveFile(item.id)}
        >
          <FileCode size={14} className={isActive ? 'text-blue-400' : 'text-gray-500'} />
          <span className="text-sm">{item.name}</span>
          {item.status === 'verified' && <CheckCircle size={12} className="text-green-500 ml-auto" />}
          {item.status === 'pending' && <AlertCircle size={12} className="text-yellow-500 ml-auto" />}
        </div>
      );
    });
  };

  const handleSend = async () => {
    if (!inputText.trim() || isStreaming) return;
    const msg = inputText.trim();
    setInputText('');
    await sendMessage(msg, undefined, 'beginner', 'beginner', 'student');
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-gray-300">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-gray-700/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-blue-400">
            <Cpu size={18} />
            <span className="font-semibold">C++ 学习模式</span>
          </div>
          <div className="h-4 w-px bg-gray-700" />
          <span className="text-gray-500 text-sm">{activeFile.replace('.cpp', '')}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600/20 text-green-400 rounded hover:bg-green-600/30 transition-colors text-sm">
            <Play size={14} />
            <span>开始学习</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700/50 text-gray-400 rounded hover:bg-gray-700 transition-colors text-sm">
            <Bug size={14} />
            <span>诊断</span>
          </button>
        </div>
      </div>

      {/* 主体三栏布局 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧概念文件树 */}
        <div className="w-52 bg-[#0d1117] border-r border-gray-700/50 flex flex-col">
          <div className="px-3 py-2 border-b border-gray-700/50">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">概念列表</span>
          </div>
          <div className="flex-1 overflow-y-auto py-2 text-sm">
            {renderFileTree(conceptFiles)}
          </div>
        </div>

        {/* 中间概念学习区 */}
        <div className="flex-1 flex flex-col bg-[#0d1117]">
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-xl font-bold text-blue-400 mb-4">内存管理</h2>
              
              <div className="bg-[#161b22] rounded-lg p-4 mb-4 border border-gray-700/50">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <FileCode size={12} />
                  <span>代码示例</span>
                </div>
                <pre className="text-sm font-mono text-gray-300 overflow-x-auto">
{`#include <iostream>

int main() {
    int* ptr = new int(42);  // 在堆上分配
    std::cout << "Value: " << *ptr << std::endl;
    delete ptr;               // 释放
    return 0;
}`}
                </pre>
              </div>

              {/* 运行控制台 */}
              <div className="h-[250px] mb-6 rounded-lg overflow-hidden border border-gray-700/50 shadow-lg">
                <CppRunner code={`#include <iostream>

int main() {
    int* ptr = new int(42);  // 在堆上分配
    std::cout << "Value: " << *ptr << std::endl;
    delete ptr;               // 释放
    return 0;
}`} />
              </div>
              
              <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                <p className="text-sm text-gray-300 leading-relaxed">
                  💡 <span className="text-blue-400">提示</span>：用你自己的话向小方解释这段代码。
                  小方会追问细节，帮助你发现理解的盲区。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧对话区 */}
        <div className="w-80 bg-[#0d1117] border-l border-gray-700/50 flex flex-col">
          {/* 标题 */}
          <div className="px-3 py-2 border-b border-gray-700/50 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-sm">🧑‍🎓</div>
            <span className="text-sm font-medium text-gray-300">小方</span>
            <span className="text-xs text-gray-500 ml-auto">C++ 学习者</span>
          </div>
          
          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
                  <Bot size={20} className="text-blue-400" />
                </div>
                <p className="mb-2">开始与小方对话吧！</p>
                <p className="text-xs text-gray-600">尝试解释上面的代码示例</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-purple-500/20' : 'bg-blue-500/20'
                  }`}>
                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} className="text-blue-400" />}
                  </div>
                  <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-purple-500/20 text-purple-100' 
                      : 'bg-[#161b22] text-gray-300 border border-gray-700/50'
                  }`}>
                    {msg.content}
                    {msg.isStreaming && (
                      <span className="inline-block w-1.5 h-4 ml-1 bg-blue-400 animate-pulse" />
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
          
          {/* 输入区 */}
          <div className="p-3 border-t border-gray-700/50">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={hasProvider ? "向小方解释你的理解..." : "请先配置 AI"}
                disabled={!hasProvider || isStreaming}
                className="flex-1 bg-[#161b22] border border-gray-700/50 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500/50 transition-colors disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!hasProvider || isStreaming || !inputText.trim()}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 底部状态栏 */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-blue-600 text-white text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Terminal size={12} />
            <span>C++ 模式</span>
          </div>
          <div className="h-3 w-px bg-white/30" />
          <div className="flex items-center gap-1.5">
            <CheckCircle size={12} />
            <span>0 个概念已验证</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-white/80">
          <Cpu size={12} />
          <span>等待学习...</span>
        </div>
      </div>
    </div>
  );
}
