/**
 * 代码纠错相关类型定义
 */

/**
 * 单个代码修正建议
 */
export interface CodeFix {
  /** 原始代码行（被修改的部分） */
  originalLine: string
  /** 行号（从1开始） */
  lineNumber: number
  /** 修改后的代码 */
  fixedLine: string
  /** 修正理由 */
  reason: string
  /** 问题类型：error(错误)、warning(警告)、suggestion(建议) */
  type: 'error' | 'warning' | 'suggestion'
  /** 严重程度 1-5 */
  severity: number
}

/**
 * AI 代码纠错响应
 */
export interface CodeReviewResult {
  /** 整体评估 */
  overallAssessment: string
  /** 代码质量评分 0-100 */
  score: number
  /** 修正建议列表 */
  fixes: CodeFix[]
  /** 优化建议（不涉及具体行修改） */
  optimizationTips: string[]
  /** 修正后的完整代码 */
  fixedCode?: string
}

/**
 * 差异显示类型
 */
export type DiffType = 'added' | 'removed' | 'unchanged' | 'modified'

/**
 * 代码行差异
 */
export interface CodeLineDiff {
  lineNumber: number
  type: DiffType
  content: string
  oldContent?: string
  reason?: string
  fixType?: 'error' | 'warning' | 'suggestion'
}
