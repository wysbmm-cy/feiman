import React from 'react';
import { useStore } from '../../store';
import { History, RotateCcw, Clock, Shield, X } from 'lucide-react';

interface CppVersionHistoryProps {
  fileId: string;
  onClose: () => void;
}

export function CppVersionHistory({ fileId, onClose }: CppVersionHistoryProps) {
  const { cppFiles, rollbackCppVersion } = useStore();
  const file = cppFiles.find(f => f.id === fileId);
  const versions = file?.versions || [];

  return (
    <div className="flex flex-col h-full bg-[#1c2128] border-l border-gray-700/50 w-[300px] animate-slide-in-right">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50 bg-[#161b22]">
        <div className="flex items-center gap-2 text-blue-400">
          <History size={16} />
          <span className="text-sm font-bold tracking-wider">Neural History</span>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-gray-700/50 rounded-md text-gray-500 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {versions.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <Clock size={32} className="mx-auto mb-3 opacity-20" />
            <p className="text-xs">暂无历史快照</p>
          </div>
        ) : (
          versions.map((version) => (
            <div 
              key={version.id}
              onClick={() => {
                if (window.confirm('确定要回滚到此版本吗？当前未保存的代码将会丢失。')) {
                  rollbackCppVersion(fileId, version.id);
                }
              }}
              className="group relative p-3 rounded-xl border border-gray-700/30 bg-gray-800/20 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-300 cursor-pointer active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  {version.isSync ? (
                    <Shield size={12} className="text-blue-400" />
                  ) : (
                    <Clock size={12} className="text-gray-500" />
                  )}
                  <span className="text-[10px] font-medium text-gray-400">
                    {new Date(version.timestamp).toLocaleString('zh-CN', { 
                      month: '2-digit', 
                      day: '2-digit', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                <div
                  className="p-1.5 bg-blue-500/20 text-blue-400 rounded-md group-hover:bg-blue-500 group-hover:text-white transition-all transform group-hover:scale-110"
                  title="点击卡片回滚此版本"
                >
                  <RotateCcw size={12} />
                </div>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed truncate-2-lines">
                {version.description}
              </p>
              
              <div className="mt-2 pt-2 border-t border-gray-700/30">
                <div className="text-[9px] font-mono text-gray-600 truncate">
                  {version.code.slice(0, 40)}...
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-gray-700/50 bg-[#161b22]">
        <p className="text-[10px] text-gray-500 text-center">
          * 自动同步与手动保存时会自动快照
        </p>
      </div>
    </div>
  );
}

export default CppVersionHistory;
