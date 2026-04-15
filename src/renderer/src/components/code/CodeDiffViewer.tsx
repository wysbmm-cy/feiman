import React from 'react'
import { AlertTriangle, AlertCircle, Lightbulb, CheckCircle, XCircle } from 'lucide-react'
import type { CodeLineDiff, CodeReviewResult } from '../../types/code-review.types'

interface CodeDiffViewerProps {
  /** 原始代码 */
  originalCode: string
  /** 纠错结果 */
  reviewResult: CodeReviewResult | null
  /** 是否正在加载 */
  isLoading?: boolean
  /** 关闭回调 */
  onClose?: () => void
  /** 应用修正回调 */
  onApplyFix?: (fixedCode: string) => void
}

/**
 * 代码差异显示组件
 * - 红色高亮：删除/修改的部分
 * - 绿色高亮：新增的部分
 * - 注释说明修正理由
 */
export function CodeDiffViewer({
  originalCode,
  reviewResult,
  isLoading,
  onClose,
  onApplyFix
}: CodeDiffViewerProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-[#0d1117]">
        <div className="px-4 py-3 border-b border-gray-700/50 bg-[#161b22]">
          <div className="flex items-center gap-2 text-yellow-400">
            <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">AI 正在分析代码...</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-yellow-400 animate-pulse" />
            </div>
            <p className="text-sm">正在调用专家 AI 进行代码审查</p>
            <p className="text-xs text-gray-600 mt-1">请稍候...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!reviewResult) {
    return null
  }

  // 构建差异行
  const buildDiffLines = (): CodeLineDiff[] => {
    const originalLines = originalCode.split('\n')
    const diffLines: CodeLineDiff[] = []
    
    // 创建修正映射
    const fixMap = new Map<number, typeof reviewResult.fixes[0]>()
    for (const fix of reviewResult.fixes) {
      fixMap.set(fix.lineNumber, fix)
    }

    for (let i = 0; i < originalLines.length; i++) {
      const lineNum = i + 1
      const originalLine = originalLines[i]
      const fix = fixMap.get(lineNum)

      if (fix) {
        // 有修正的行 - 先显示删除（红色），再显示添加（绿色）
        diffLines.push({
          lineNumber: lineNum,
          type: 'removed',
          content: originalLine,
          reason: fix.reason,
          fixType: fix.type
        })
        diffLines.push({
          lineNumber: lineNum,
          type: 'added',
          content: fix.fixedLine,
          oldContent: originalLine,
          reason: fix.reason,
          fixType: fix.type
        })
      } else {
        diffLines.push({
          lineNumber: lineNum,
          type: 'unchanged',
          content: originalLine
        })
      }
    }

    return diffLines
  }

  const diffLines = buildDiffLines()

  // 获取图标和颜色
  const getFixIcon = (type?: 'error' | 'warning' | 'suggestion') => {
    switch (type) {
      case 'error':
        return <XCircle size={14} className="text-red-400" />
      case 'warning':
        return <AlertTriangle size={14} className="text-yellow-400" />
      case 'suggestion':
        return <Lightbulb size={14} className="text-blue-400" />
      default:
        return null
    }
  }

  const getFixColor = (type?: 'error' | 'warning' | 'suggestion') => {
    switch (type) {
      case 'error':
        return 'border-l-red-500 bg-red-500/10'
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-500/10'
      case 'suggestion':
        return 'border-l-blue-500 bg-blue-500/10'
      default:
        return ''
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* 头部 */}
      <div className="px-4 py-3 border-b border-gray-700/50 bg-[#161b22]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="text-green-400" />
              <span className="text-sm font-medium text-gray-200">代码审查结果</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-gray-800">
              <span className="text-xs text-gray-400">评分</span>
              <span className={`text-sm font-bold ${
                reviewResult.score >= 80 ? 'text-green-400' :
                reviewResult.score >= 60 ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {reviewResult.score}/100
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {reviewResult.fixedCode && onApplyFix && (
              <button
                onClick={() => onApplyFix(reviewResult.fixedCode!)}
                className="px-3 py-1.5 text-xs font-medium bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
              >
                应用全部修正
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors"
              >
                关闭
              </button>
            )}
          </div>
        </div>
        
        {/* 整体评估 */}
        <div className="mt-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700/30">
          <p className="text-xs text-gray-300 leading-relaxed">{reviewResult.overallAssessment}</p>
        </div>

        {/* 图例 */}
        <div className="flex items-center gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-500/30 border-l-2 border-red-500" />
            <span className="text-gray-400">删除/问题</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-500/30 border-l-2 border-green-500" />
            <span className="text-gray-400">新增/修正</span>
          </div>
          <div className="flex items-center gap-1.5">
            <XCircle size={12} className="text-red-400" />
            <span className="text-gray-400">错误</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={12} className="text-yellow-400" />
            <span className="text-gray-400">警告</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lightbulb size={12} className="text-blue-400" />
            <span className="text-gray-400">建议</span>
          </div>
        </div>
      </div>

      {/* 差异显示区域 */}
      <div className="flex-1 overflow-auto">
        <div className="font-mono text-sm">
          {diffLines.map((line, idx) => {
            if (line.type === 'unchanged') {
              return (
                <div key={idx} className="flex hover:bg-gray-800/30">
                  <div className="w-12 text-right pr-3 text-gray-600 select-none border-r border-gray-700/30">
                    {line.lineNumber}
                  </div>
                  <div className="flex-1 pl-3 py-0.5 text-gray-300">
                    {line.content || ' '}
                  </div>
                </div>
              )
            }

            if (line.type === 'removed') {
              return (
                <div 
                  key={idx} 
                  className={`flex border-l-2 ${getFixColor(line.fixType)}`}
                >
                  <div className="w-12 text-right pr-3 text-gray-600 select-none border-r border-gray-700/30 bg-red-500/5">
                    {line.lineNumber}
                  </div>
                  <div className="flex-1 pl-3 py-0.5 bg-red-500/10 text-red-300 line-through">
                    {line.content || ' '}
                  </div>
                </div>
              )
            }

            if (line.type === 'added') {
              return (
                <div key={idx} className="flex flex-col">
                  <div className="flex border-l-2 border-l-green-500 bg-green-500/10">
                    <div className="w-12 text-right pr-3 text-gray-600 select-none border-r border-gray-700/30 bg-green-500/5">
                      <span className="text-green-400 text-[10px]">修正</span>
                    </div>
                    <div className="flex-1 pl-3 py-0.5 text-green-300">
                      {line.content || ' '}
                    </div>
                  </div>
                  {/* 修正理由 */}
                  {line.reason && (
                    <div className="flex border-l-2 border-l-gray-600 bg-gray-800/50">
                      <div className="w-12 text-right pr-3 select-none border-r border-gray-700/30">
                        {getFixIcon(line.fixType)}
                      </div>
                      <div className="flex-1 pl-3 py-1 text-xs text-gray-400 italic">
                        // {line.reason}
                      </div>
                    </div>
                  )}
                </div>
              )
            }

            return null
          })}
        </div>
      </div>

      {/* 优化建议 */}
      {reviewResult.optimizationTips.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-700/50 bg-[#161b22]">
          <h4 className="text-xs font-semibold text-gray-300 mb-2 flex items-center gap-2">
            <Lightbulb size={14} className="text-blue-400" />
            优化建议
          </h4>
          <ul className="space-y-1.5">
            {reviewResult.optimizationTips.map((tip, i) => (
              <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
