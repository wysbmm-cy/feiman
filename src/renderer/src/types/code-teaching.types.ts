import type { ChatHistoryMessage } from './chat-history.types'

/**
 * 编程学习专用类型定义
 * 用于特化费曼学习法在编程教学中的应用
 */

// 支持的编程语言
export type ProgrammingLanguage = 
  | 'cpp'       // C/C++
  | 'python'    // Python
  | 'java'      // Java
  | 'javascript' // JavaScript (含 HTML/CSS)

// 编程语言配置
export interface LanguageConfig {
  id: ProgrammingLanguage
  name: string
  displayName: string
  icon: string
  color: string
  gradient: string
  fileExtension: string
  description: string
  features: string[]
}

// 语言配置映射
export const LANGUAGE_CONFIGS: Record<ProgrammingLanguage, LanguageConfig> = {
  cpp: {
    id: 'cpp',
    name: 'C/C++',
    displayName: 'C/C++',
    icon: '⚡',
    color: '#3182ce',
    gradient: 'linear-gradient(135deg, #1a365d, #2c5282)',
    fileExtension: '.cpp',
    description: '内存管理、指针语义、模板元编程等底层概念',
    features: ['内存管理', '指针与引用', '面向对象', '模板编程', 'STL', '现代特性']
  },
  python: {
    id: 'python',
    name: 'Python',
    displayName: 'Python',
    icon: '🐍',
    color: '#3776ab',
    gradient: 'linear-gradient(135deg, #306998, #ffd43b)',
    fileExtension: '.py',
    description: '动态类型、装饰器、生成器、异步编程等高级特性',
    features: ['动态类型', '装饰器', '生成器', '上下文管理', '异步编程', '元编程']
  },
  java: {
    id: 'java',
    name: 'Java',
    displayName: 'Java',
    icon: '☕',
    color: '#f89820',
    gradient: 'linear-gradient(135deg, #5382a1, #f89820)',
    fileExtension: '.java',
    description: 'JVM、面向对象设计、并发编程、泛型等企业级概念',
    features: ['JVM原理', '面向对象', '泛型', '并发编程', '集合框架', '设计模式']
  },
  javascript: {
    id: 'javascript',
    name: 'JavaScript',
    displayName: 'JavaScript/HTML/CSS',
    icon: '🌐',
    color: '#f7df1e',
    gradient: 'linear-gradient(135deg, #323330, #f7df1e)',
    fileExtension: '.js',
    description: '原型链、闭包、事件循环、DOM操作等前端核心概念',
    features: ['原型链', '闭包', '事件循环', 'DOM操作', '异步编程', 'CSS布局']
  }
}

// 编程概念节点类型 - 用于知识图谱
export type CodeConceptType =
  | 'syntax'           // 语法规则
  | 'memory_model'     // 内存模型
  | 'type_system'      // 类型系统
  | 'oop'              // 面向对象
  | 'functional'       // 函数式编程
  | 'concurrency'      // 并发编程
  | 'error_handling'   // 错误处理
  | 'design_pattern'   // 设计模式
  | 'standard_library' // 标准库
  | 'modern_feature'   // 现代特性
  | 'best_practice'    // 最佳实践
  | 'debugging'        // 调试技巧

// 学习阶段
export type CodeLearningPhase = 
  | 'foundation'       // 基础语法
  | 'intermediate'     // 进阶概念
  | 'advanced'         // 高级特性
  | 'expert'           // 专家级

// 学生AI人格配置
export interface CodeStudentPersonality {
  name: string
  avatar: string
  background: string // 学习背景
  level: 'beginner' | 'intermediate' | 'advanced'
  
  // 语言特定的常见误解
  misconceptions: CodeMisconception[]
  
  // 提问风格
  questioningStyle: {
    initial: 'confused' | 'curious' | 'skeptical'
    followup: 'deep_dive' | 'practical' | 'edge_case'
    whenSatisfied: 'paraphrase' | 'apply' | 'challenge'
  }
}

// 编程常见误解
export interface CodeMisconception {
  concept: string
  wrongBelief: string
  correctUnderstanding: string
  whyConfusing: string
  testQuestion: string // 用于验证是否理解
}

// 费曼验证结果
export interface CodeFeynmanVerification {
  conceptId: string
  conceptType: CodeConceptType
  phase: CodeLearningPhase
  language: ProgrammingLanguage
  
  // 对话历史
  dialogue: CodeTeachingDialogue[]
  
  // 理解评估
  understanding: {
    score: number // 0-100
    depth: 'surface' | 'conceptual' | 'mastery'
    blindSpots: string[]
    strengths: string[]
  }
  
  // 下一步建议
  nextSteps: {
    reviewConcepts: string[]
    practiceAreas: string[]
    unlockConcepts: string[]
  }
}

// 教学对话
export interface CodeTeachingDialogue {
  id: string
  timestamp: string
  speaker: 'student' | 'teacher' | 'expert'
  message: string
  type: 'question' | 'explanation' | 'challenge' | 'feedback' | 'hint'
  
  // 元数据
  metadata?: {
    conceptTested?: string
    misconceptionAddressed?: string
    difficultyLevel?: number
  }
}

// 概念图谱节点
export interface CodeConceptNode {
  id: string
  language: ProgrammingLanguage
  type: CodeConceptType
  name: string
  description: string
  phase: CodeLearningPhase
  
  // 依赖关系
  prerequisites: string[] // 前置概念ID
  unlocks: string[] // 解锁概念ID
  related: string[] // 相关概念
  
  // 学习资源
  keyPoints: string[] // 核心要点
  commonPitfalls: string[] // 常见陷阱
  realWorldAnalogy: string // 现实类比
  
  // 验证状态
  verificationStatus: 'locked' | 'available' | 'in_progress' | 'verified' | 'mastered'
  bestScore: number
  attempts: number
}

// 代码版本
export interface CodeVersion {
  id: string
  code: string
  timestamp: string
  description?: string
  isSync?: boolean // 是否由 Neural Sync 生成
}

// 代码文件
export interface CodeFile {
  id: string
  name: string
  language: ProgrammingLanguage
  code: string
  createdAt: string
  versions?: CodeVersion[]
}

// 学习路径
export interface CodeLearningPath {
  id: string
  language: ProgrammingLanguage
  name: string
  description: string
  targetLevel: 'beginner' | 'intermediate' | 'advanced'
  
  // 路径节点（概念序列）
  nodes: {
    conceptId: string
    order: number
    requiredMastery: 'understood' | 'mastered'
  }[]
  
  // 预估学习数据
  estimatedHours: number
  conceptCount: number
}
