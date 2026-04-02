import React, { useState } from 'react';
import { Brain, RefreshCw, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface RecallChallengeProps {
  nodeLabel: string;
  onComplete: (score: number) => void;
  onClose: () => void;
}

export function RecallChallenge({ nodeLabel, onComplete, onClose }: RecallChallengeProps) {
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ score: number; comment: string } | null>(null);

  const handleSubmit = async () => {
    if (!answer.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    // 模拟评估逻辑 (实际应调用 Expert AI)
    setTimeout(() => {
      const mockResult = {
        score: Math.floor(Math.random() * 40) + 60, // 60-100
        comment: "印象深刻！你准确地提取了核心概念，但在边界情况的处理上可以再完善一下。"
      };
      setFeedback(mockResult);
      setIsSubmitting(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md glass-panel-strong rounded-2xl overflow-hidden shadow-2xl border border-yellow-500/30">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500/20 to-amber-600/20 px-6 py-4 flex items-center justify-between border-b border-yellow-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-400 border border-yellow-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Brain size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-yellow-100 tracking-tight">记忆宫殿挑战</h2>
              <p className="text-[10px] text-yellow-500 font-medium uppercase tracking-[0.2em]">Active Recall Mission</p>
            </div>
          </div>
          <button onClick={onClose} className="text-yellow-500/50 hover:text-yellow-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {!feedback ? (
            <div className="space-y-4">
              <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-4">
                <p className="text-sm text-gray-400 leading-relaxed italic mb-1">“老师，我还记得你教过这个，但我现在有点模糊了，能再给我提示一遍吗？”</p>
                <p className="text-base font-bold text-yellow-400">请再次解释：{nodeLabel}</p>
              </div>

              <textarea
                autoFocus
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="尝试闭上眼睛回忆，在这里输入你的解释..."
                className="w-full h-32 bg-[#0d1117]/80 border border-gray-700/50 rounded-xl p-4 text-sm text-gray-200 outline-none focus:border-yellow-500/40 transition-all resize-none"
              />

              <button
                onClick={handleSubmit}
                disabled={!answer.trim() || isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold rounded-xl shadow-lg hover:shadow-yellow-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
              >
                {isSubmitting ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                {isSubmitting ? '正在同步记忆...' : '完成复习'}
              </button>
            </div>
          ) : (
            <div className="space-y-6 text-center animate-fade-in">
              <div className="relative inline-block">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48" cy="48" r="40"
                    fill="transparent"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="48" cy="48" r="40"
                    fill="transparent"
                    stroke="var(--success)"
                    strokeWidth="8"
                    strokeDasharray={251}
                    strokeDashoffset={251 * (1 - feedback.score / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-black text-white">{feedback.score}</span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-success mb-2">复习完成！</h3>
                <p className="text-sm text-gray-400 leading-relaxed px-4">{feedback.comment}</p>
              </div>

              <button
                onClick={() => { onComplete(feedback.score); onClose(); }}
                className="w-full py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 transition-colors"
              >
                回到宫殿
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
