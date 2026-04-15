import React, { useRef, useState, useCallback, useEffect } from 'react'
import { useStore } from '../../store'
import { NodeItem } from './NodeItem'
import type { KnowledgeNode } from '../../types/node.types'
import { ChevronDown, ChevronUp, Plus, Sparkles } from 'lucide-react'
import { classifyNode, generateNodesFromLearningContent } from '../../lib/ai/classifier'

interface NodeMapProps {
  onStartVerification: (node: KnowledgeNode, explanation: string) => void
}

export function NodeMap({ onStartVerification }: NodeMapProps) {
  const {
    activeNodes,
    selectedNodeId,
    setSelectedNode,
    updateNodePosition,
    addNode,
    createNode,
    nodeMapCollapsed,
    setNodeMapCollapsed,
    activeNote,
    settings,
    asyncResults,
    clearAsyncResult,
    isNodeBusy
  } = useStore()

  const svgRef = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null)
  const [dragGhost, setDragGhost] = useState<{ x: number; y: number } | null>(null)
  const [guideLines, setGuideLines] = useState<{ x?: number; y?: number }[]>([])
  const [explanationInput, setExplanationInput] = useState('')
  const [showAddInput, setShowAddInput] = useState(false)
  const [addNodeLabel, setAddNodeLabel] = useState('')
  const [isAutoGenerating, setIsAutoGenerating] = useState(false)
  const [autoGenMessage, setAutoGenMessage] = useState<string | null>(null)
  const addInputRef = useRef<HTMLInputElement>(null)

  const provider = settings.aiProviders.find(p => p.isDefault) ?? settings.aiProviders[0] ?? null

  const handleNodeClick = (node: KnowledgeNode) => {
    setSelectedNode(selectedNodeId === node.id ? null : node.id)
    setExplanationInput('')
  }

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    const svg = svgRef.current
    if (!svg) return
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse())
    const node = activeNodes.find(n => n.id === nodeId)
    if (!node) return
    setDragging({
      id: nodeId,
      offsetX: svgPt.x - node.position.x,
      offsetY: svgPt.y - node.position.y
    })
    e.preventDefault()
  }

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !svgRef.current) return
    const pt = svgRef.current.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const svgPt = pt.matrixTransform(svgRef.current.getScreenCTM()!.inverse())
    const newX = svgPt.x - dragging.offsetX
    const newY = svgPt.y - dragging.offsetY
    
    updateNodePosition(dragging.id, newX, newY)
    setDragGhost({ x: newX, y: newY })
    
    // Alignment guides
    const guides: { x?: number; y?: number }[] = []
    const snap = 10
    const nodeW = 120
    const nodeH = 40
    
    for (const other of activeNodes) {
      if (other.id === dragging.id) continue
      if (Math.abs(other.position.x - newX) < snap) guides.push({ x: other.position.x })
      if (Math.abs(other.position.x + nodeW/2 - (newX + nodeW/2)) < snap) guides.push({ x: other.position.x + nodeW/2 - nodeW/2 })
      if (Math.abs(other.position.y - newY) < snap) guides.push({ y: other.position.y })
      if (Math.abs(other.position.y + nodeH/2 - (newY + nodeH/2)) < snap) guides.push({ y: other.position.y + nodeH/2 - nodeH/2 })
    }
    
    setGuideLines(guides)
  }, [dragging, updateNodePosition, activeNodes])

  const handleMouseUp = () => setDragging(null)

  const handleAddNode = async () => {
    if (!activeNote) {
      console.warn('[NodeMap] No active note — cannot add node')
      return
    }
    setShowAddInput(true)
    setTimeout(() => addInputRef.current?.focus(), 50)
  }

  const confirmAddNode = async () => {
    const label = addNodeLabel.trim()
    setShowAddInput(false)
    setAddNodeLabel('')
    if (!label || !activeNote) return

    const newNode = createNode(label)
    if (provider) {
      const classification = await classifyNode(label, activeNote.topic, provider)
      newNode.type = classification.nodeType
      newNode.verificationMode = classification.verificationMode
    }
    addNode(newNode)
  }

  const handleAutoGenerateNodes = useCallback(async () => {
    if (!activeNote || isAutoGenerating) return
    setIsAutoGenerating(true)
    setAutoGenMessage('AI 正在总结并构建节点...')

    try {
      const generated = await generateNodesFromLearningContent({
        topic: activeNote.topic,
        cues: activeNote.cornell.cues,
        notes: activeNote.cornell.notes,
        summary: activeNote.cornell.summary,
        provider,
        maxNodes: 12
      })

      if (generated.length === 0) {
        setAutoGenMessage('未提取到可用节点，请补充讲解内容后再试。')
        return
      }

      const existingLabels = new Set(
        activeNodes.map((node) => node.label.trim().toLowerCase())
      )

      let createdCount = 0
      for (const item of generated) {
        const normalizedLabel = item.label.trim().toLowerCase()
        if (!normalizedLabel || existingLabels.has(normalizedLabel)) continue
        const node = createNode(item.label)
        node.type = item.nodeType
        node.verificationMode = item.verificationMode
        addNode(node)
        existingLabels.add(normalizedLabel)
        createdCount++
      }

      if (createdCount === 0) {
        setAutoGenMessage('没有新增节点（可能与现有节点重复）。')
      } else {
        setAutoGenMessage(`已自动创建 ${createdCount} 个节点。`)
      }
    } catch {
      setAutoGenMessage('自动创建失败，请稍后重试。')
    } finally {
      setIsAutoGenerating(false)
      window.setTimeout(() => setAutoGenMessage(null), 3000)
    }
  }, [activeNote, isAutoGenerating, provider, activeNodes, createNode, addNode])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isShortcut = (event.ctrlKey || event.metaKey) && event.shiftKey && event.code === 'KeyN'
      if (!isShortcut) return

      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }
      if (!activeNote || isAutoGenerating) return

      event.preventDefault()
      void handleAutoGenerateNodes()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeNote, isAutoGenerating, handleAutoGenerateNodes])

  const handleStartVerification = (node: KnowledgeNode) => {
    if (isNodeBusy(node.id)) {
      return
    }
    if (!explanationInput.trim()) {
      const input = document.getElementById('node-explanation-input')
      input?.focus()
      return
    }
    onStartVerification(node, explanationInput)
    setExplanationInput('')
  }

  const selectedNode = selectedNodeId ? activeNodes.find(n => n.id === selectedNodeId) : null

  const edges: { x1: number; y1: number; x2: number; y2: number }[] = []
  for (const node of activeNodes) {
    for (const depId of node.dependencies) {
      const dep = activeNodes.find(n => n.id === depId)
      if (dep) {
        edges.push({ x1: dep.position.x, y1: dep.position.y, x2: node.position.x, y2: node.position.y })
      }
    }
  }

  return (
    <div
      className="border-t flex-shrink-0 relative z-20"
      style={{
        borderColor: 'rgba(255,255,255,0.1)',
        borderTopWidth: '1px',
        background: 'rgba(0,0,0,0.15)',
        height: nodeMapCollapsed ? '40px' : '220px',
        transition: 'height 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 h-9 cursor-pointer select-none"
        style={{ borderBottom: nodeMapCollapsed ? 'none' : '1px solid rgba(255,255,255,0.1)' }}
        onClick={() => setNodeMapCollapsed(!nodeMapCollapsed)}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
            知识节点地图
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--primary-color)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {activeNodes.length}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {activeNodes.filter(n => n.state === 'verified').length}/{activeNodes.length} 已掌握
          </span>
          {autoGenMessage && (
            <span className="text-[10px]" style={{ color: 'var(--primary-color)' }}>
              {autoGenMessage}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2" style={{ position: 'relative', zIndex: 50 }}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              void handleAutoGenerateNodes()
            }}
            className="px-2 py-1 rounded-md transition-all duration-200 hover:opacity-80 cursor-pointer disabled:opacity-40"
            title="AI 自动建节点 (Ctrl/Cmd + Shift + N)"
            disabled={!activeNote || isAutoGenerating}
            style={{ color: 'var(--text-primary)', background: 'transparent' }}
          >
            <Sparkles size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleAddNode() }}
            className="px-2 py-1 rounded-md transition-all duration-200 hover:opacity-80 cursor-pointer"
            title="添加节点"
            style={{ color: 'var(--text-primary)', background: 'transparent' }}
          >
            <Plus size={16} />
          </button>
          {nodeMapCollapsed
            ? <ChevronDown size={14} style={{ color: 'var(--text-primary)' }} />
            : <ChevronUp size={14} style={{ color: 'var(--text-primary)' }} />
          }
        </div>
      </div>

      {/* Inline add-node input */}
      {showAddInput && (
        <div
          className="flex items-center gap-2 px-3 py-1.5 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            ref={addInputRef}
            className="flex-1 text-xs px-2 py-1 rounded outline-none"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--primary-color)',
              color: 'var(--text-primary)',
            }}
            placeholder="输入知识节点名称…"
            value={addNodeLabel}
            onChange={(e) => setAddNodeLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmAddNode()
              if (e.key === 'Escape') { setShowAddInput(false); setAddNodeLabel('') }
            }}
          />
          <button
            className="text-xs px-2 py-1 rounded transition-all hover:opacity-80"
            style={{ background: 'rgba(0,0,0,0.5)', color: 'var(--primary-color)', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={confirmAddNode}
          >
            添加
          </button>
          <button
            className="text-xs px-2 py-1 rounded transition-all hover:opacity-80"
            style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={() => { setShowAddInput(false); setAddNodeLabel('') }}
          >
            取消
          </button>
        </div>
      )}

      {!nodeMapCollapsed && (
        <div className="flex relative h-[calc(100%-36px)] overflow-hidden">
          {/* SVG node map */}
          <svg
            ref={svgRef}
            className="flex-1 z-10"
            style={{ background: 'rgba(0,0,0,0.1)' }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Guide Lines */}
            {guideLines.map((guide, i) => (
              guide.x !== undefined && (
                <line
                  key={`gx-${i}`}
                  x1={guide.x} y1={0} x2={guide.x} y2={1000}
                  stroke="var(--primary-color)"
                  strokeWidth={0.5}
                  strokeDasharray="2 2"
                  opacity={0.5}
                />
              ),
              guide.y !== undefined && (
                <line
                  key={`gy-${i}`}
                  x1={0} y1={guide.y} x2={1000} y2={guide.y}
                  stroke="var(--primary-color)"
                  strokeWidth={0.5}
                  strokeDasharray="2 2"
                  opacity={0.5}
                />
              )
            ))}
            
            {/* Drag Ghost */}
            {dragGhost && dragging && (
              <rect
                x={dragGhost.x}
                y={dragGhost.y}
                width={120}
                height={40}
                rx={8}
                fill="var(--primary-color)"
                opacity={0.2}
                stroke="var(--primary-color)"
                strokeWidth={2}
                strokeDasharray="4 2"
              />
            )}
            
            {/* Edges */}
            {edges.map((e, i) => {
              const targetNode = activeNodes.find(n => n.position.x === e.x2 && n.position.y === e.y2)
              const sourceNode = activeNodes.find(n => n.position.x === e.x1 && n.position.y === e.y1)
              const isVerifiedEdge = sourceNode?.state === 'verified' && targetNode?.state === 'verified'
              const isLockedEdge = !isVerifiedEdge && sourceNode?.state !== 'verified'

              return (
                <line
                  key={i}
                  x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                  stroke={isVerifiedEdge ? 'var(--node-verified)' : 'rgba(255,255,255,0.3)'}
                  strokeWidth={isVerifiedEdge ? 2 : 1.5}
                  strokeDasharray={isVerifiedEdge ? 'none' : '4 4'}
                  className={isVerifiedEdge ? 'line-glow' : isLockedEdge ? 'line-dimmed' : ''}
                  strokeOpacity={isLockedEdge ? 0.3 : 0.8}
                />
              )
            })}

            {/* Nodes */}
            {activeNodes.map(node => {
              const isLocked = node.dependencies.some(depId => {
                const depNode = activeNodes.find(n => n.id === depId)
                return !depNode || depNode.state !== 'verified'
              })
              const asyncResult = asyncResults.find(r => r.nodeId === node.id)

              return (
                <g key={node.id} onMouseDown={(e) => handleMouseDown(e, node.id)}>
                  <NodeItem
                    node={node}
                    isSelected={node.id === selectedNodeId}
                    isLocked={isLocked}
                    isBusy={isNodeBusy(node.id)}
                    onClick={handleNodeClick}
                    onStartVerification={handleStartVerification}
                    asyncResult={asyncResult}
                    onClearAsyncResult={clearAsyncResult}
                  />
                </g>
              )
            })}

            {activeNodes.length === 0 && (
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
                fontSize={12} fill="var(--text-muted)">
                点击 + 手动添加，或点 ✨ 自动创建节点
              </text>
            )}
          </svg>

          {/* Explanation input panel */}
          {selectedNode && (selectedNode.state === 'unverified' || selectedNode.state === 'failed') && (
            <div
              className="w-72 border-l flex flex-col p-5 gap-4 z-20 transition-all duration-300"
              style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)' }}
            >
              <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <div className="w-1 h-4 rounded-full" style={{ background: 'var(--primary-color)' }} />
                <h3 className="text-sm font-bold tracking-wider" style={{ color: 'var(--text-primary)' }}>讲解输入区</h3>
              </div>

              {/* Lock Check */}
              {selectedNode.dependencies.some(depId => activeNodes.find(n => n.id === depId)?.state !== 'verified') ? (
                <div
                  className="flex flex-col items-center justify-center flex-1 gap-3 py-6 px-2 text-center rounded-xl"
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                  }}
                >
                  <svg className="w-8 h-8" style={{ color: 'var(--danger)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-xs font-medium" style={{ color: 'var(--danger)' }}>
                    节点锁定<br />请先完成所有前置知识节点
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    向小方解释「<span style={{ color: 'var(--primary-color)' }}>{selectedNode.label}</span>」
                  </p>
                  <textarea
                    id="node-explanation-input"
                    className="flex-1 resize-none text-xs p-3 rounded-xl outline-none"
                    style={{
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: 'var(--text-primary)',
                      minHeight: '80px',
                    }}
                    placeholder="用简单的话解释这个知识点..."
                    value={explanationInput}
                    onChange={e => setExplanationInput(e.target.value)}
                  />
                  <button
                    className="py-2 text-xs font-medium rounded-xl flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-80"
                    style={{ background: 'rgba(0,0,0,0.5)', color: 'var(--primary-color)', border: '1px solid rgba(255,255,255,0.1)' }}
                    disabled={isNodeBusy(selectedNode.id)}
                    onClick={() => handleStartVerification(selectedNode)}
                  >
                    {isNodeBusy(selectedNode.id) ? '验证进行中…' : '开始验证'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
