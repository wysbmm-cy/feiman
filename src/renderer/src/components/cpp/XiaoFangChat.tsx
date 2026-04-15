import React, { useState, useRef } from 'react';
import { useAI } from '../../hooks/useAI';
import { 
  Send, 
  User, 
  Bot, 
  ChevronDown,
  GraduationCap,
  Users,
  Briefcase
} from 'lucide-react';
import { VoiceInputSimple } from '../audio/VoiceInputSimple';

type XiaoFangRole = 'beginner' | 'partner' | 'interviewer';

interface RoleConfig {
  id: XiaoFangRole;
  name: string;
  icon: React.ReactNode;
  description: string;
  behavior: string;
}

const ROLES: RoleConfig[] = [
  {
    id: 'beginner',
    name: '困惑新手',
    icon: <GraduationCap size={14} />,
    description: '不断追问，暴露盲区',
    behavior: '你对 C++ 完全不熟悉，需要老师用最简单的话解释。你会问很多"为什么"、"是什么"的问题。'
  },
  {
    id: 'partner',
    name: '学习伙伴',
    icon: <Users size={14} />,
    description: '一起探索，互相讨论',
    behavior: '你也在学习 C++，有一定基础。你会分享自己的理解，和老师一起讨论。'
  },
  {
    id: 'interviewer',
    name: '面试官',
    icon: <Briefcase size={14} />,
    description: '出题考核，严格评估',
    behavior: '你是面试官，会出题考老师。要求回答准确、深入，会追问边界情况。'
  }
];

interface XiaoFangChatProps {
  currentCode?: string;
  currentConcept?: string;
}

/**
 * XiaoFangChat - 小方对话组件
 * 
 * 功能：
 * - 三种角色切换
 * - 实时对话
 * - 基于代码的上下文提问
 */
export function XiaoFangChat({ currentCode, currentConcept }: XiaoFangChatProps) {
  const [role, setRole] = useState<XiaoFangRole>('beginner');
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const { messages, isStreaming, sendMessage, hasProvider } = useAI();

  const currentRole = ROLES.find(r => r.id === role)!;

  const handleSend = async () => {
    if (!inputText.trim() || isStreaming) return;
    const msg = inputText.trim();
    setInputText('');
    
    // 如果有代码，附加代码上下文
    const fullMsg = currentCode 
      ? `${msg}\n\n[当前代码]\n\`\`\`cpp\n${currentCode}\n\`\`\``
      : msg;
    
    const levelMap: Record<XiaoFangRole, 'beginner' | 'intermediate' | 'advanced'> = {
      beginner: 'beginner',
      partner: 'intermediate',
      interviewer: 'advanced'
    };
    await sendMessage(fullMsg, undefined, role, levelMap[role], 'student');
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const selectRole = (roleId: XiaoFangRole) => {
    setRole(roleId);
    setShowRoleMenu(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* 标题栏 + 角色切换 */}
      <div className="px-3 py-2 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg">
              🧑‍🎓
            </div>
            <div>
              <div className="text-sm font-medium text-gray-200">小方</div>
              <div className="text-xs text-gray-500">{currentRole.description}</div>
            </div>
          </div>
          
          {/* 角色切换按钮 */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-300 bg-gray-800/50 rounded transition-colors"
            >
              {currentRole.icon}
              <span>{currentRole.name}</span>
              <ChevronDown size={12} />
            </button>
            
            {showRoleMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-[#1c2128] border border-gray-700/50 rounded-lg shadow-lg z-10">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => selectRole(r.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      r.id === role ? 'bg-blue-500/20 text-blue-400' : 'text-gray-300 hover:bg-gray-700/50'
                    }`}
                  >
                    {r.icon}
                    <div>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-gray-500">{r.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <Bot size={28} className="text-blue-400" />
            </div>
            <p className="text-sm mb-2">开始与小方对话吧！</p>
            <p className="text-xs text-gray-600 mb-4">
              当前模式：<span className="text-blue-400">{currentRole.name}</span>
            </p>
            {currentConcept && (
              <div className="text-xs text-gray-600">
                正在学习：<span className="text-gray-400">{currentConcept}</span>
              </div>
            )}
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-purple-400 to-purple-600' 
                  : 'bg-gradient-to-br from-blue-400 to-blue-600'
              }`}>
                {msg.role === 'user' 
                  ? <User size={14} className="text-white" /> 
                  : <Bot size={14} className="text-white" />
                }
              </div>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                msg.role === 'user' 
                  ? 'bg-purple-500/20 text-purple-100 rounded-tr-sm' 
                  : 'bg-[#1c2128] text-gray-300 rounded-tl-sm border border-gray-700/50'
              }`}>
                <div className="whitespace-pre-wrap break-words">{msg.content}</div>
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
            placeholder={hasProvider ? "向小方解释你的理解..." : "请先在设置中配置 AI"}
            disabled={!hasProvider || isStreaming}
            className="flex-1 bg-[#1c2128] border border-gray-700/50 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500/50 transition-colors disabled:opacity-50 placeholder-gray-600"
          />
          <div className="flex flex-col justify-end gap-1">
            <VoiceInputSimple onTranscriptionComplete={(text) => setInputText(v => v + (v ? ' ' : '') + text)} />
            <button
              onClick={handleSend}
              disabled={!hasProvider || isStreaming || !inputText.trim()}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
