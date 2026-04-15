import type { Note } from '../../types'

export function buildSystemPrompt(note: Note): string {
  return `你是费曼（Feynman），一位充满智慧且富有耐心的 AI 学习伙伴，灵感来自理查德·费曼的教学哲学。

你的核心原则：
- 从不直接给出答案，而是通过追问和提示引导用户自己发现
- 热情但简洁地肯定正确的理解
- 保持耐心、温暖和旺盛的求知欲
- 根据用户展现的水平调整问题难度
- 注重概念理解，而非死记硬背

当前学习上下文：
- 笔记标题：${note.title}
- 主题领域：${note.topic || '未指定'}

康奈尔笔记内容：
[提示/关键问题]：
${note.cornell.cues || '（暂无内容）'}

[主要笔记]：
${note.cornell.notes || '（暂无内容）'}

[总结]：
${note.cornell.summary || '（暂无内容）'}

请始终用中文回复，除非用户用其他语言提问。`
}


export function buildGraphExtractionPrompt(notesContent: string): string {
  return `分析以下笔记内容，提取知识图谱。

笔记内容：
${notesContent}

提取要求：
1. 关键概念（节点）- 具体而非泛化
2. 概念之间的关系（边）
3. 层级连接（主题包含概念）

以严格 JSON 格式返回（不要有其他文字）：
{
  "nodes": [
    {
      "label": "概念名称",
      "type": "concept|topic|principle",
      "importance": <1-10>
    }
  ],
  "edges": [
    {
      "source": "节点标签",
      "target": "节点标签",
      "label": "关系描述动词",
      "type": "contains|relates|prerequisite|extends",
      "strength": <0.1-1.0>
    }
  ]
}

提取 8-25 个节点，聚焦有意义的关联。`
}

export const QUICK_PROMPTS = [
  {
    id: 'explain-concept',
    label: '解释一个概念',
    template: (note: Note) => `用一个简单的类比，帮我理解"${note.topic}"中一个核心概念。`
  },
  {
    id: 'generate-cues',
    label: '生成提示问题',
    template: (note: Note) =>
      `基于我的笔记内容，生成5个关于"${note.title}"最重要的问题，我应该能流利回答这些问题。`
  },
  {
    id: 'find-connections',
    label: '发现知识关联',
    template: (note: Note) =>
      `分析我的笔记，找出"${note.topic}"与其他知识领域的联系，并解释为什么这些关联重要。`
  },
  {
    id: 'test-me',
    label: '测试我的理解',
    template: (note: Note) =>
      `问我一个关于"${note.title}"的挑战性问题，这个问题能区分真正理解和死记硬背的人。`
  },
  {
    id: 'simplify',
    label: '帮我简化总结',
    template: (note: Note) =>
      `帮我将"${note.title}"压缩成一个核心洞见，不超过3句话，让任何人都能立即理解。`
  }
]
