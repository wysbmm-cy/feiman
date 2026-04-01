import type { Note } from '../../types/note.types'
import type { KnowledgeNode, NodeVersion } from '../../types/node.types'

interface ExportOptions {
  includeNodes?: boolean
  includeVersions?: boolean
  includeStats?: boolean
}

function getNodeActiveVersion(node: KnowledgeNode): NodeVersion | null {
  if (node.currentVersion >= 0 && node.currentVersion < node.versions.length) {
    return node.versions[node.currentVersion]
  }
  return node.versions.length > 0 ? node.versions[node.versions.length - 1] : null
}

async function loadJsPdfCtor(): Promise<any> {
  const dynamicImport = new Function('moduleName', 'return import(moduleName)')
  const mod = await dynamicImport('jspdf') as any
  return mod.jsPDF || mod.default?.jsPDF || mod.default
}

/**
 * Export note to Markdown format
 */
export function exportToMarkdown(note: Note, options: ExportOptions = {}): string {
  const { includeNodes = true, includeVersions = true } = options
  
  let md = `# ${note.title}\n\n`
  md += `> 主题：${note.topic || '未指定'}\n`
  md += `> 创建时间：${new Date(note.createdAt).toLocaleString()}\n`
  md += `> 更新时间：${new Date(note.updatedAt).toLocaleString()}\n\n`
  
  // Cornell Notes
  md += `## 康奈尔笔记\n\n`
  md += `### 提示区 (Cues)\n\n`
  md += `${note.cornell.cues || '（空）'}\n\n`
  md += `### 笔记区 (Notes)\n\n`
  md += `${note.cornell.notes || '（空）'}\n\n`
  md += `### 总结区 (Summary)\n\n`
  md += `${note.cornell.summary || '（空）'}\n\n`
  
  // Knowledge Nodes
  if (includeNodes && note.nodes.length > 0) {
    md += `## 知识节点\n\n`
    
    note.nodes.forEach((node, index) => {
      const activeVersion = getNodeActiveVersion(node)
      md += `### ${index + 1}. ${node.label}\n\n`
      md += `- **类型**：${node.type === 'concept' ? '概念' : node.type === 'logic' ? '逻辑' : node.type === 'fact' ? '事实' : '待澄清'}\n`
      md += `- **状态**：${node.state === 'verified' ? '已验证' : node.state === 'failed' ? '未通过' : node.state === 'verifying' ? '验证中' : '未验证'}\n`
      md += `- **掌握度**：${node.masteryScore || 0}%\n\n`
      
      if (includeVersions && node.versions.length > 0) {
        md += `#### 验证历史\n\n`
        node.versions.forEach(v => {
          const activeMark = activeVersion?.versionId === v.versionId ? '（当前）' : ''
          md += `**v${v.attempt}${activeMark}** - ${v.passed ? '通过' : '未通过'} (${v.expertFeedback.score}分)\n\n`
          md += `- 解释：${v.userExplanation.slice(0, 100)}${v.userExplanation.length > 100 ? '...' : ''}\n`
          if (v.expertFeedback.logicErrors.length > 0) {
            md += `- 问题：${v.expertFeedback.logicErrors.join('、')}\n`
          }
          md += `\n`
        })
      }
      
      md += `---\n\n`
    })
  }
  
  return md
}

/**
 * Export note to PDF format
 */
export async function exportToPDF(note: Note, options: ExportOptions = {}): Promise<Blob> {
  const JsPdfCtor = await loadJsPdfCtor()
  const doc = new JsPdfCtor()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  
  let y = 20
  
  // Title
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text(note.title, margin, y)
  y += 15
  
  // Meta info
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`主题：${note.topic || '未指定'}`, margin, y)
  y += 8
  doc.text(`创建：${new Date(note.createdAt).toLocaleString()}`, margin, y)
  y += 15
  
  // Reset text color
  doc.setTextColor(0, 0, 0)
  
  // Cornell Notes
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('康奈尔笔记', margin, y)
  y += 12
  
  // Cues
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('提示区 (Cues)', margin, y)
  y += 8
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const cuesLines = doc.splitTextToSize(note.cornell.cues || '（空）', contentWidth)
  doc.text(cuesLines, margin, y)
  y += cuesLines.length * 5 + 10
  
  // Notes
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('笔记区 (Notes)', margin, y)
  y += 8
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const notesLines = doc.splitTextToSize(note.cornell.notes || '（空）', contentWidth)
  doc.text(notesLines, margin, y)
  y += notesLines.length * 5 + 10
  
  // Summary
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('总结区 (Summary)', margin, y)
  y += 8
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const summaryLines = doc.splitTextToSize(note.cornell.summary || '（空）', contentWidth)
  doc.text(summaryLines, margin, y)
  y += summaryLines.length * 5 + 20
  
  // Knowledge Nodes
  if (note.nodes.length > 0) {
    // Check if we need a new page
    if (y > 250) {
      doc.addPage()
      y = 20
    }
    
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('知识节点', margin, y)
    y += 15
    
    note.nodes.forEach((node, index) => {
      const activeVersion = getNodeActiveVersion(node)
      // Check if we need a new page
      if (y > 260) {
        doc.addPage()
        y = 20
      }
      
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${node.label}`, margin, y)
      y += 8
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      
      const typeText = node.type === 'concept' ? '概念' : 
                       node.type === 'logic' ? '逻辑' : 
                       node.type === 'fact' ? '事实' : '待澄清'
      const stateText = node.state === 'verified' ? '已验证' : 
                        node.state === 'failed' ? '未通过' : 
                        node.state === 'verifying' ? '验证中' : '未验证'
      
      doc.text(`类型：${typeText} | 状态：${stateText} | 掌握度：${node.masteryScore || 0}%`, margin, y)
      y += 12
      
      doc.setTextColor(0, 0, 0)
      
      // Versions
      if (node.versions.length > 0) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text('验证历史：', margin, y)
        y += 6
        
        doc.setFont('helvetica', 'normal')
        node.versions.forEach(v => {
          const result = v.passed ? '通过' : '未通过'
          const activeMark = activeVersion?.versionId === v.versionId ? ' [当前]' : ''
          doc.text(`  v${v.attempt}${activeMark}: ${result} (${v.expertFeedback.score}分)`, margin, y)
          y += 5
        })
        y += 8
      }
      
      y += 10
    })
  }
  
  return doc.output('blob')
}

/**
 * Export to Anki card format
 */
export function exportToAnki(note: Note): string {
  const cards: string[] = []
  
  note.nodes.forEach(node => {
    const activeVersion = getNodeActiveVersion(node)
    // Create cards for verified nodes
    if (node.state === 'verified') {
      // Card 1: Definition -> Explanation
      cards.push(`
#separator:tab
#html:true
"${node.label}"\t"${activeVersion?.userExplanation || ''}"\t"${note.title}"
      `.trim())
      
      // Card 2: Common mistakes
      node.versions.forEach(v => {
        if (!v.passed && v.expertFeedback.logicErrors.length > 0) {
          const errors = v.expertFeedback.logicErrors.join('、')
          cards.push(`
#separator:tab
#html:true
"${node.label} 常见错误"\t"${errors}"\t"${note.title} - 错题"
          `.trim())
        }
      })
    }
  })
  
  return cards.join('\n')
}

/**
 * Download file helper
 */
export function downloadFile(content: string | Blob, filename: string, type?: string): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: type || 'text/plain' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

export default {
  exportToMarkdown,
  exportToPDF,
  exportToAnki,
  downloadFile
}
