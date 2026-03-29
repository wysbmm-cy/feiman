import type { ChatHistoryMessage } from './chat-history.types'

/**
 * C++ 教学专用类型定义
 * 用于特化费曼学习法在C++教学中的应用
 */

// C++ 概念节点类型 - 用于知识图谱
export type CppConceptType =
  | 'syntax'           // 语法规则
  | 'memory_model'     // 内存模型
  | 'pointer_semantic'   // 指针语义
  | 'type_system'      // 类型系统
  | 'template_meta'    // 模板元编程
  | 'stl_component'    // STL组件
  | 'modern_feature' // 现代C++特性
  | 'compilation_unit' // 编译单元
  | 'undefined_behavior' // 未定义行为
  | 'optimization'     // 编译器优化

// C++ 学习阶段
export type CppLearningPhase = 
  | 'foundation'       // 基础语法
  | 'memory'           // 内存管理
  | 'abstraction'      // 抽象机制
  | 'generic'          // 泛型编程
  | 'modern'           // 现代特性
  | 'expert'           // 专家级

// C++ 学生AI人格配置
export interface CppStudentPersonality {
  name: string
  avatar: string
  background: string // 学习背景（学过Python/Java等）
  level: 'beginner' | 'intermediate' | 'advanced'
  
  // 常见误解（用于生成问题）
  misconceptions: CppMisconception[]
  
  // 提问风格
  questioningStyle: {
    initial: 'confused' | 'curious' | 'skeptical'
    followup: 'deep_dive' | 'practical' | 'edge_case'
    whenSatisfied: 'paraphrase' | 'apply' | 'challenge'
  }
}

// C++ 常见误解
export interface CppMisconception {
  concept: string
  wrongBelief: string
  correctUnderstanding: string
  whyConfusing: string
  testQuestion: string // 用于验证是否理解
}

// C++ 费曼验证结果
export interface CppFeynmanVerification {
  conceptId: string
  conceptType: CppConceptType
  phase: CppLearningPhase
  
  // 对话历史
  dialogue: CppTeachingDialogue[]
  
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

// C++ 教学对话
export interface CppTeachingDialogue {
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

// C++ 概念图谱节点
export interface CppConceptNode {
  id: string
  type: CppConceptType
  name: string
  description: string
  phase: CppLearningPhase
  
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

// C++ 学习路径
export interface CppLearningPath {
  id: string
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

// C++ 代码版本
export interface CppVersion {
  id: string
  code: string
  timestamp: string
  description?: string
  isSync?: boolean // 是否由 Neural Sync 生成
}

// 扩展 CppFile 以支持版本
export interface CppFile {
  id: string
  name: string
  code: string
  createdAt: string
  versions?: CppVersion[]
}
