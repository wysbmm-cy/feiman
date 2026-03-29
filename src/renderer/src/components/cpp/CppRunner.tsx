import React, { useState } from 'react';
import { Play, Square, Terminal as TerminalIcon, Loader2, AlertCircle } from 'lucide-react';

interface CppRunnerProps {
  code: string;
}

export function CppRunner({ code }: CppRunnerProps) {
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    if (!code.trim() || isRunning) return;
    
    setIsRunning(true);
    setError(null);
    setOutput('正在编译并运行...\n');

    try {
      // 使用 Judge0 公共 API 进行简单的代码运行
      // 注意：实际生产环境应使用自己的 API Key 或 后端
      const response = await fetch('https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': 'YOUR_API_KEY', // 这是一个占位符，用户需要自行配置或使用辅助后端
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        },
        body: JSON.stringify({
          source_code: code,
          language_id: 54, // C++ (GCC 9.2.0)
          stdin: ''
        })
      });

      // 演示模式：如果没有 API Key，模拟运行效果
      if (response.status === 401 || response.status === 403) {
        setTimeout(() => {
          setOutput(prev => prev + '> [模拟运行] 请在设置中配置 Compiler API Key 以获得真实执行结果。\n\n程序输出：\nHello, World! (Demo Mode)\n\nProcess exited with code 0.');
          setIsRunning(false);
        }, 1500);
        return;
      }

      const data = await response.json();
      if (data.stdout) setOutput(prev => prev + data.stdout);
      if (data.stderr) setOutput(prev => prev + '\nError:\n' + data.stderr);
      if (data.compile_output) setOutput(prev => prev + '\nCompile Output:\n' + data.compile_output);
      
    } catch (err) {
      setError('网络连接失败或 API 限制');
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleClear = () => {
    setOutput('');
    setError(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] border-l border-gray-700/50 glass-panel">
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-gray-700/50">
        <div className="flex items-center gap-2 text-gray-400">
          <TerminalIcon size={14} />
          <span className="text-xs font-medium uppercase tracking-wider">控制台输出</span>
        </div>
        <div className="flex items-center gap-2">
          {output && (
            <button 
              onClick={handleClear}
              className="px-2 py-1 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
            >
              清空
            </button>
          )}
          <button
            onClick={handleRun}
            disabled={isRunning || !code.trim()}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
              isRunning ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-green-600/20 text-green-400 hover:bg-green-600/30 active:scale-95'
            }`}
          >
            {isRunning ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
            {isRunning ? '运行中' : '运行代码'}
          </button>
        </div>
      </div>

      {/* 输出内容面板 */}
      <div className="flex-1 p-4 font-mono text-sm overflow-y-auto custom-scrollbar bg-[#090c10]/50">
        {error && (
          <div className="flex items-center gap-2 mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs">
            <AlertCircle size={14} />
            {error}
          </div>
        )}
        
        {output ? (
          <pre className="whitespace-pre-wrap break-all text-gray-300 leading-relaxed">
            {output}
            {isRunning && <span className="inline-block w-2 h-4 bg-gray-600 animate-pulse ml-1 align-middle" />}
          </pre>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-40 select-none">
            <TerminalIcon size={32} className="mb-2" />
            <p className="text-xs">点击“运行代码”查看输出结果</p>
          </div>
        )}
      </div>
    </div>
  );
}
