import React, { useState, useCallback } from 'react';
import { useAI } from '../../hooks/useAI';
import { 
  Play, 
  Sparkles, 
  FileCode, 
  Copy,
  Check
} from 'lucide-react';

interface CodeEditorProps {
  currentConcept: string;
  onCodeChange?: (code: string) => void;
}

/**
 * CodeEditor - C++ 代码编辑器
 * 
 * 功能：
 * - 用户可编辑代码
 * - AI 生成示例代码
 * - 语法高亮（简单实现）
 * - 行号显示
 */
export function CodeEditor({ currentConcept, onCodeChange }: CodeEditorProps) {
  const [code, setCode] = useState(`// 点击 "AI生成示例" 按钮
// 或直接粘贴你想讲解的 C++ 代码

#include <iostream>
#include <memory>

int main() {
    // 在这里写代码...
    return 0;
}`);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const { sendMessage, isStreaming } = useAI();

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    onCodeChange?.(newCode);
  };

  const generateCode = useCallback(async () => {
    setIsGenerating(true);
    try {
      // 使用 AI 生成当前概念的示例代码
      const prompt = `请为 C++ 概念"${currentConcept}"生成一段简洁的教学示例代码。
要求：
1. 代码要能直接编译运行
2. 包含关键用法的注释
3. 不要太长，控制在 20 行以内
4. 只输出代码，不要解释`;

      // 这里简化处理，实际应该调用 AI
      const conceptCodes: Record<string, string> = {
        '指针': `#include <iostream>

int main() {
    int value = 42;
    int* ptr = &value;  // ptr 指向 value 的地址
    
    std::cout << "值: " << *ptr << std::endl;    // 解引用
    std::cout << "地址: " << ptr << std::endl;   // 地址
    
    *ptr = 100;  // 通过指针修改值
    std::cout << "新值: " << value << std::endl;
    
    return 0;
}`,
        '引用': `#include <iostream>

int main() {
    int x = 10;
    int& ref = x;  // ref 是 x 的引用（别名）
    
    ref = 20;  // 通过引用修改
    std::cout << "x = " << x << std::endl;  // x 变成 20
    
    // 引用必须初始化，不能重新绑定
    // int& r;  // 错误！
    
    return 0;
}`,
        '智能指针': `#include <iostream>
#include <memory>

int main() {
    // unique_ptr - 独占所有权
    auto uptr = std::make_unique<int>(42);
    std::cout << *uptr << std::endl;
    
    // shared_ptr - 共享所有权
    auto sptr1 = std::make_shared<int>(100);
    auto sptr2 = sptr1;  // 引用计数 +1
    std::cout << "count: " << sptr1.use_count() << std::endl;
    
    return 0;
}`,
        '移动语义': `#include <iostream>
#include <utility>

int main() {
    int x = 10;
    int&& rref = std::move(x);  // 右值引用
    
    std::cout << "x = " << x << std::endl;
    std::cout << "rref = " << rref << std::endl;
    
    // move 只是类型转换，真正移动在移动构造函数中
    // 之后 x 的值是"未指定的"，不要再使用
    
    return 0;
}`
      };

      // 简单匹配概念
      for (const [key, value] of Object.entries(conceptCodes)) {
        if (currentConcept.includes(key)) {
          setCode(value);
          onCodeChange?.(value);
          break;
        }
      }
    } finally {
      setIsGenerating(false);
    }
  }, [currentConcept, onCodeChange]);

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  // 计算行数
  const lines = code.split('\n');

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <FileCode size={14} className="text-blue-400" />
          <span className="text-sm text-gray-400">{currentConcept}.cpp</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyCode}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-300 transition-colors"
          >
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            {copied ? '已复制' : '复制'}
          </button>
          <button
            onClick={generateCode}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors text-xs disabled:opacity-50"
          >
            <Sparkles size={12} />
            {isGenerating ? '生成中...' : 'AI生成示例'}
          </button>
        </div>
      </div>

      {/* 代码编辑区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 行号 */}
        <div className="w-12 bg-[#0d1117] text-right pr-3 pt-4 text-xs text-gray-600 select-none font-mono">
          {lines.map((_, i) => (
            <div key={i} className="leading-6">{i + 1}</div>
          ))}
        </div>
        
        {/* 代码输入 */}
        <textarea
          value={code}
          onChange={handleCodeChange}
          className="flex-1 bg-transparent text-gray-300 font-mono text-sm leading-6 resize-none outline-none p-4 pl-2"
          spellCheck={false}
          placeholder="// 在这里输入或粘贴 C++ 代码..."
        />
      </div>
    </div>
  );
}
