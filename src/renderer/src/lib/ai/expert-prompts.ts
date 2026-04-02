import type { KnowledgeNode, ExpertFeedback, StudentQuestion } from '../../types/node.types'
import type { CornellContent } from '../../types/note.types'

export function buildExpertSystemPrompt(): string {
  return `你是一位严格而公正的知识验证专家。你的职责是评估学生对某个概念的理解是否正确和完整。

评判标准：
- 不接受模糊的描述，必须有清晰的因果链
- 必须能处理边界情况和反例
- 概念之间的关系必须准确
- 不要求专业术语，但核心逻辑必须正确

你必须以严格的 JSON 格式回复，不要有任何其他文字。`
}

export function buildExpertAnalysisPrompt(
  node: KnowledgeNode,
  userExplanation: string,
  cornell: CornellContent,
  conversationHistory?: StudentQuestion[]
): string {
  const historyContext = conversationHistory && conversationHistory.length > 0
    ? `\n\n补充问答记录：\n${conversationHistory.map((q, i) =>
      `问题${i + 1}：${q.question}\n回答：${q.userAnswer || '（未回答）'}`
    ).join('\n\n')}`
    : ''

  return `请评估学生对以下知识点的理解：

知识点名称：${node.label}
知识点类型：${node.type}

相关笔记背景：
【提示列/关键词】
${cornell.cues}

【主笔记内容】
${cornell.notes}

学生的解释：
"""
${userExplanation}
"""${historyContext}

请以 JSON 格式返回评估结果：
{
  "passed": <boolean，是否通过验证，分数≥75即通过>,
  "score": <0-100的整数>,
  "logicErrors": [<逻辑错误列表，如无则为空数组>],
  "missingConcepts": [<遗漏的关键概念列表>],
  "misconceptions": [<错误理解列表>],
  "strengths": [<做得好的地方列表>],
  "suggestion": "<一句话给用户的改进建议>"
}`
}

export function buildTestQuestionPrompt(
  node: KnowledgeNode,
  userExplanation: string,
  expertFeedback: ExpertFeedback
): string {
  return `基于学生的讲解内容和分析结果，为其生成 1 道**边界测试题**，用于测试其逻辑漏洞或错误理解。
测试题将提供给一个扮演"学生"的AI去解答（该AI会严格使用老师的逻辑解题，从而暴露问题）。

知识点：${node.label}
学生的原始讲解：${userExplanation}

被发现的漏洞/错误：
逻辑错误：${expertFeedback.logicErrors.join('、') || '无'}
概念遗漏：${expertFeedback.missingConcepts.join('、') || '无'}
错误理解：${expertFeedback.misconceptions.join('、') || '无'}

要求：
- 题目应该是具体的计算或情境题，能直接击中上述漏洞
- 如果讲解本身无明显漏洞，生成一道稍有挑战性的延伸题

请用 JSON 格式返回：
{
  "question": "<题目内容>",
  "expectedTrap": "<预期的错误结果（基于用户的错误逻辑推导出的结果）>"
}`
}


export function buildQuickEvalPrompt(
  question: string,
  userAnswer: string,
  nodeName: string
): string {
  return `对于知识点「${nodeName}」的提问：
问题：${question}
学生回答：${userAnswer}

请用 JSON 格式简短评估：
{
  "isCorrect": <boolean>,
  "conceptsClearedCount": <整数，回答中澄清了几个概念缺口>,
  "briefFeedback": "<一句话评语>"
}`
}

export function buildExpertMonitorPrompt(
  nodeName: string,
  userExplanation: string
): string {
  return `你是一位旁听专家。用户正在向学生解释知识点「${nodeName}」。
你的任务是实时监控用户的讲解，如果发现以下「不可接受」的严重错误，请立即指示系统打断：
1. 事实性严重错误（与科学常识或核心理论完全相反）
2. 逻辑完全断裂（ A 推出 C，但中间没有任何联系）
3. 关键误导（可能导致后续知识点全部学错）

如果讲解正常或只有小瑕疵，请不要打断，让学生继续提问。

请用 JSON 格式返回：
{
  "interrupt": <boolean，是否打断>,
  "reason": "<打断的原因（建议简洁有力，控制在20字以内）>",
  "criticalError": "<具体的错误点描述>"
}`
}

export function parseExpertFeedback(rawJson: string): ExpertFeedback | null {
  try {
    // Strip markdown code blocks if present
    const cleaned = rawJson.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim()
    const parsed = JSON.parse(cleaned)
    return {
      passed: Boolean(parsed.passed),
      score: Number(parsed.score) || 0,
      logicErrors: Array.isArray(parsed.logicErrors) ? parsed.logicErrors : [],
      missingConcepts: Array.isArray(parsed.missingConcepts) ? parsed.missingConcepts : [],
      misconceptions: Array.isArray(parsed.misconceptions) ? parsed.misconceptions : [],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      suggestion: String(parsed.suggestion || ''),
      rawJson
    }
  } catch {
    return null
  }
}
