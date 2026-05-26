"use client"

import * as React from "react"
import dagre from "dagre"
import { useRouter } from "next/navigation"
import {
  Plus,
  MessageSquare,
  Trash2,
  Settings,
  Send,
  Sparkles,
  LogOut,
  Layers,
  GitFork,
  X,
  Scale
} from "lucide-react"
import { FileTree, TreeItem } from "@/components/file-tree"
import { useGraphStore, DecisionNode, Relationship } from "@/lib/store"

interface PositionedNode extends DecisionNode {
  x: number
  y: number
}

// 3. MOTOR DE AUTO-LAYOUT COM DAGRE (Crescimento Vertical 'TB')
function getLayoutedElements(
  nodes: DecisionNode[],
  edges: Relationship[]
): PositionedNode[] {
  const g = new dagre.graphlib.Graph()
  
  // TB: Top to Bottom layout
  // nodesep: Horizontal distance between cards
  // ranksep: Vertical distance between layers
  g.setGraph({ rankdir: "TB", nodesep: 140, ranksep: 100 })
  g.setDefaultEdgeLabel(() => ({}))

  nodes.forEach((node) => {
    // Card is 220px wide and 110px tall
    g.setNode(node.id, { width: 220, height: 110 })
  })

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  dagre.layout(g)

  return nodes.map((node) => {
    const nodeInfo = g.node(node.id)
    return {
      ...node,
      // Offset by half dimensions since dagre calculates from center
      x: nodeInfo.x - 110,
      y: nodeInfo.y - 55,
    }
  })
}

export default function DecisionTreeDashboard() {
  const router = useRouter()
  const viewportRef = React.useRef<HTMLDivElement>(null)

  // Retrieve global state from Zustand store
  const {
    cases,
    activeCaseId,
    focusedNodeId,
    readingNodeData,
    setActiveCaseId,
    setFocusedNodeId,
    setReadingNodeData,
    addNewCase,
    deleteCase,
    addCustomNode,
  } = useGraphStore()

  // Mouse pan states (Figma hand tool)
  const [panX, setPanX] = React.useState(0)
  const [panY, setPanY] = React.useState(0)
  const [isPanning, setIsPanning] = React.useState(false)
  const [isAnimating, setIsAnimating] = React.useState(false)
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 })

  const [prompt, setPrompt] = React.useState("")
  const [isProfileOpen, setIsProfileOpen] = React.useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)

  const activeCase = cases.find((c) => c.id === activeCaseId) || cases[0]

  // Calculate layouted nodes dynamically using Dagre
  const positionedNodes = React.useMemo(() => {
    return getLayoutedElements(activeCase.nodes, activeCase.edges)
  }, [activeCase.nodes, activeCase.edges])

  // Center root node automatically on case change
  React.useEffect(() => {
    const rootNode = activeCase.nodes[0]
    if (rootNode && viewportRef.current) {
      const rect = viewportRef.current.getBoundingClientRect()
      const layoutedRoot = positionedNodes.find((n) => n.id === rootNode.id)
      if (layoutedRoot) {
        setPanX(rect.width / 2 - layoutedRoot.x - 110)
        setPanY(80)
      }
    }
  }, [activeCaseId])

  // Smooth scroll and focus nodes when selected via layers list or store changes
  React.useEffect(() => {
    if (focusedNodeId && viewportRef.current) {
      const node = positionedNodes.find((n) => n.id === focusedNodeId)
      if (node) {
        const rect = viewportRef.current.getBoundingClientRect()
        setIsAnimating(true)
        setPanX(rect.width / 2 - node.x - 110)
        setPanY(rect.height / 2 - node.y - 55)
        const timer = setTimeout(() => setIsAnimating(false), 300)
        return () => clearTimeout(timer)
      }
    }
  }, [focusedNodeId, positionedNodes])

  // Mouse dragging handlers (panning)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (
      target.closest(".decision-node-card") ||
      target.closest("button") ||
      target.closest("input")
    ) {
      return
    }

    setIsPanning(true)
    setIsAnimating(false)
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return
    setPanX(e.clientX - dragStart.x)
    setPanY(e.clientY - dragStart.y)
  }

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  const handleLogout = () => {
    localStorage.removeItem("auth")
    router.push("/login")
  }

  // Handle Layer Click in Figma Right Sidebar (Rule 1: Focus and scroll)
  const handleLayerSelect = (layerName: string) => {
    const matchedNode = activeCase.nodes.find(
      (n) => n.title.toLowerCase() === layerName.toLowerCase()
    )
    if (matchedNode) {
      setFocusedNodeId(matchedNode.id)
    }
  }

  // Form submit to insert nodes via AI prompt
  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    const parentNodeId = focusedNodeId || activeCase.nodes[0]?.id
    if (!parentNodeId) return

    const trimmedPrompt = prompt.toLowerCase()
    const newNodeId = `node-custom-${Date.now()}`
    const isNo = trimmedPrompt.includes("não") || trimmedPrompt.includes("improcedente")

    const newNode: DecisionNode = {
      id: newNodeId,
      type:
        trimmedPrompt.includes("sentença") || trimmedPrompt.includes("fim") || trimmedPrompt.includes("extinção")
          ? "result"
          : "decision",
      title: prompt.substring(0, 20) + (prompt.length > 20 ? "..." : ""),
      description: prompt,
      source: {
        type: "Precedente Jurídico",
        text: `Normativa provisória gerada pela IA: "${prompt}"`,
        link: "#",
      },
    }

    const newEdge: Relationship = {
      id: `edge-custom-${Date.now()}`,
      source: parentNodeId,
      target: newNodeId,
      label: isNo ? "NÃO" : "SIM",
    }

    addCustomNode(activeCaseId, newNode, newEdge)
    setPrompt("")

    // Auto focus new node (which triggers centering useEffect)
    setTimeout(() => {
      setFocusedNodeId(newNodeId)
    }, 50)
  }

  // Figma Layer Tree data generator
  const getFigmaLayersData = (): TreeItem[] => {
    const allNodes = activeCase.nodes
    const edges = activeCase.edges
    const roots = allNodes.filter((n) => !edges.some((e) => e.target === n.id))

    const buildSubTree = (node: DecisionNode): TreeItem => {
      const children = allNodes.filter((n) => edges.some((e) => e.source === node.id && e.target === n.id))
      if (children.length === 0) {
        return node.title
      }
      return [node.title, ...children.map(buildSubTree)]
    }

    return roots.map((root) => buildSubTree(root))
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100">
      
      {/* 1. SIDEBAR ESQUERDA - Estilo Chat de IA */}
      <aside className="w-[280px] shrink-0 bg-zinc-950 text-zinc-200 flex flex-col h-full border-r border-zinc-850 z-10 relative">
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 px-2">
            <Scale className="h-5 w-5 text-indigo-400 fill-indigo-400/20" />
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-200 to-indigo-400 bg-clip-text text-transparent">
              Aura Lex Grafos
            </span>
          </div>

          <button
            onClick={() => addNewCase(`Novo Caso Decisório ${cases.length + 1}`)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-100 border border-zinc-800 hover:border-zinc-700 transition-all font-medium text-sm shadow-sm group cursor-pointer"
          >
            <Plus className="h-4 w-4 text-zinc-400 group-hover:text-zinc-100 transition-colors" />
            Novo Caso
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-3 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Casos em Andamento
          </div>
          {cases.map((c) => (
            <div
              key={c.id}
              onClick={() => setActiveCaseId(c.id)}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                c.id === activeCaseId
                  ? "bg-zinc-900 text-white font-medium shadow-sm"
                  : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-100"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <GitFork className="h-4 w-4 shrink-0 text-zinc-500 group-hover:text-zinc-400" />
                <span className="truncate text-sm">{c.title}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteCase(c.id)
                }}
                className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 rounded transition-all shrink-0 cursor-pointer"
                title="Deletar caso"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Profile Popover */}
        {isProfileOpen && (
          <div className="absolute bottom-20 left-4 right-4 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-2 flex flex-col gap-1 z-35 animate-in slide-in-from-bottom-2 duration-150">
            <button
              onClick={() => {
                setIsSettingsOpen(true)
                setIsProfileOpen(false)
              }}
              className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-2"
            >
              <Settings className="h-3.5 w-3.5" />
              Configurações da Conta
            </button>
            <div className="h-[1px] bg-zinc-800 my-1" />
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-red-500/10 text-red-450 hover:text-red-400 transition-colors cursor-pointer flex items-center gap-2"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair da Conta
            </button>
          </div>
        )}

        <div 
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="p-4 border-t border-zinc-850 bg-zinc-950/80 flex items-center gap-3 cursor-pointer hover:bg-zinc-900/40 transition-colors"
        >
          <div className="h-9 w-9 rounded-full bg-indigo-650 flex items-center justify-center text-white font-semibold text-sm">
            AL
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-semibold text-zinc-100 truncate">Allex Lemes</span>
            <span className="text-xs text-zinc-500 truncate">allex@auralex.com</span>
          </div>
          <Settings className="h-4 w-4 text-zinc-500 hover:text-zinc-350 transition-colors" />
        </div>
      </aside>

      {/* 2. ÁREA CENTRAL - Playground Canvas */}
      <main className="flex-1 flex flex-col h-full relative bg-zinc-50 dark:bg-zinc-900 overflow-hidden pr-[300px]">
        
        <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md px-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Caso /</span>
            <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{activeCase.title}</span>
          </div>
          {focusedNodeId && (
            <div className="text-xs text-zinc-500 flex items-center gap-1.5">
              <span>Foco: </span>
              <span className="font-bold text-zinc-700 dark:text-zinc-300">
                {(activeCase.nodes.find(n => n.id === focusedNodeId)?.title)}
              </span>
              <button 
                onClick={() => setFocusedNodeId(null)}
                className="hover:bg-zinc-200 dark:hover:bg-zinc-800 p-0.5 rounded cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </header>

        {/* Viewport container (Pan/Drag) */}
        <div
          ref={viewportRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`flex-1 relative overflow-hidden select-none bg-zinc-50 dark:bg-zinc-900 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] ${
            isPanning ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          
          {/* Draggable Canvas surface */}
          <div
            style={{
              transform: `translate(${panX}px, ${panY}px)`,
              width: "2400px",
              height: "2400px",
            }}
            className={`absolute inset-0 origin-top-left ${
              isAnimating ? "transition-transform duration-300 cubic-bezier(0.2, 0.8, 0.2, 1)" : ""
            }`}
          >
            
            {/* 5. COMPONENTIZAÇÃO PLANA (EdgeRenderer e NodeRenderer paralelos) */}
            <EdgeRenderer edges={activeCase.edges} nodes={positionedNodes} />

            <NodeRenderer 
              nodes={positionedNodes} 
              focusedNodeId={focusedNodeId}
              onCardClick={setReadingNodeData} // Rule 2: Open modal, no focus change
            />

          </div>
        </div>

        {/* Floating AI Input */}
        <div className="absolute bottom-6 left-1/2 -translate-x-[calc(50%+150px)] w-full max-w-2xl px-4 z-10">
          <form
            onSubmit={handlePromptSubmit}
            className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-xl flex items-center p-2 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:focus-within:ring-indigo-400/20 transition-all"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                focusedNodeId 
                  ? "Adicionar nó conectado ao nó focado (digite 'não' para ramificação negativa)..." 
                  : "Selecione um nó acima e digite para adicionar ramificações..."
              }
              className="flex-1 bg-transparent px-4 py-2 text-sm focus:outline-none border-none placeholder-zinc-400 dark:placeholder-zinc-500 text-zinc-900 dark:text-zinc-100"
            />
            <button
              type="submit"
              className="h-9 w-9 rounded-xl bg-indigo-650 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white flex items-center justify-center transition-colors shrink-0 shadow-sm cursor-pointer"
              title="Inserir nó jurídico"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

      </main>

      {/* 3. SIDEBAR DIREITA - Figma component tree */}
      <aside className="absolute top-6 right-6 bottom-6 w-[280px] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-20">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-zinc-400 dark:text-zinc-550" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-550 dark:text-zinc-400">
              Componentes (Layers)
            </span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
            {activeCase.nodes.length} Nós
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <FileTree 
            data={getFigmaLayersData()} 
            onFileSelect={handleLayerSelect} // Rule 1: Focus & Center
          />
        </div>
      </aside>

      {/* 4. MODAL DE CONFIGURAÇÕES DE CONTA */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 text-zinc-900 dark:text-zinc-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold">Configurações da Conta</h3>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4 text-zinc-400" />
              </button>
            </div>
            <p className="text-sm text-zinc-550 dark:text-zinc-450 mb-6">
              Gerencie as preferências da sua conta e do visualizador de grafos jurídicos.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">NOME COMPLETO</label>
                <input
                  type="text"
                  defaultValue="Allex Lemes"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-850 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">E-MAIL</label>
                <input
                  type="email"
                  defaultValue="allex@auralex.com"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-850 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">TEMA DO INTERFACE</label>
                <select className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent focus:outline-none dark:bg-zinc-900 text-zinc-850 dark:text-zinc-100">
                  <option>Escuro (Padrão)</option>
                  <option>Claro</option>
                  <option>Seguir Sistema</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 text-xs font-bold rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-indigo-650 hover:bg-indigo-700 text-white cursor-pointer"
              >
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL DE DETALHES DO NÓ (Exibição da Fonte Jurídica) */}
      {readingNodeData && (
        <NodeDetailsModal 
          node={readingNodeData} 
          onClose={() => setReadingNodeData(null)} 
        />
      )}

    </div>
  )
}

// 5. COMPONENTIZAÇÃO PLANA - EdgeRenderer (SVG Background Connections)
interface EdgeRendererProps {
  edges: Relationship[]
  nodes: PositionedNode[]
}

function EdgeRenderer({ edges, nodes }: EdgeRendererProps) {
  return (
    <svg className="absolute inset-0 pointer-events-none w-full h-full z-0">
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 2 L 8 5 L 0 8 z" className="fill-zinc-300 dark:fill-zinc-700" />
        </marker>
      </defs>
      {edges.map((edge) => {
        const parent = nodes.find((n) => n.id === edge.source)
        const child = nodes.find((n) => n.id === edge.target)
        if (!parent || !child) return null

        // Parent Bottom Center
        const x1 = parent.x + 110
        const y1 = parent.y + 110

        // Child Top Center
        const x2 = child.x + 110
        const y2 = child.y

        const midY = (y1 + y2) / 2
        const pathD = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`

        return (
          <g key={edge.id}>
            <path
              d={pathD}
              fill="none"
              className="stroke-zinc-300 dark:stroke-zinc-800 stroke-[2px]"
              markerEnd="url(#arrow)"
            />
            {edge.label && (
              <g>
                <rect
                  x={x1 + (x2 - x1) / 3 - 12}
                  y={y1 + (y2 - y1) / 3 - 8}
                  width="24"
                  height="16"
                  rx="4"
                  className="fill-white dark:fill-zinc-900 stroke-zinc-200 dark:stroke-zinc-800 stroke-[1px]"
                />
                <text
                  x={x1 + (x2 - x1) / 3}
                  y={y1 + (y2 - y1) / 3 + 4}
                  textAnchor="middle"
                  className={`text-[10px] font-bold tracking-wider ${
                    edge.label === "SIM"
                      ? "fill-emerald-600 dark:fill-emerald-400"
                      : "fill-red-500 dark:fill-red-400"
                  }`}
                >
                  {edge.label}
                </text>
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// 5. COMPONENTIZAÇÃO PLANA - NodeRenderer (Absolute positioned cards)
interface NodeRendererProps {
  nodes: PositionedNode[]
  focusedNodeId: string | null
  onCardClick: (node: DecisionNode) => void
}

function NodeRenderer({ nodes, focusedNodeId, onCardClick }: NodeRendererProps) {
  return (
    <>
      {nodes.map((node) => {
        const isFocused = node.id === focusedNodeId

        // Prevents dragging/panning the canvas when clicking/pressing down on a node card
        const handleMouseDown = (e: React.MouseEvent) => {
          e.stopPropagation()
        }

        const handleClick = (e: React.MouseEvent) => {
          e.stopPropagation()
          onCardClick(node) // Opens modal (Rule 2)
        }

        return (
          <div
            key={node.id}
            id={node.id}
            onMouseDown={handleMouseDown}
            onClick={handleClick}
            style={{ left: `${node.x}px`, top: `${node.y}px` }}
            className={`absolute w-[220px] rounded-xl border bg-white dark:bg-zinc-900 p-4 transition-all duration-200 flex flex-col gap-2 decision-node-card select-none cursor-pointer ${
              isFocused
                ? "ring-2 ring-indigo-500 border-indigo-500 dark:ring-indigo-400 dark:border-indigo-400 shadow-md scale-105 z-10"
                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide ${
                node.type === "decision"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-450"
                  : "bg-zinc-100 text-zinc-805 dark:bg-zinc-800 dark:text-zinc-350"
              }`}>
                {node.type === "decision" ? "Decisão" : "Resultado"}
              </span>
              <GitFork className="h-3 w-3 text-zinc-400" />
            </div>

            <h4 className="font-bold text-sm tracking-tight truncate text-zinc-900 dark:text-zinc-50">
              {node.title}
            </h4>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed min-h-[40px] break-words">
              {node.description}
            </p>
          </div>
        )
      })}
    </>
  )
}

// 4. DETALHES DO NÓ (Exibição de Fontes Jurídicas)
interface NodeDetailsModalProps {
  node: DecisionNode
  onClose: () => void
}

function NodeDetailsModal({ node, onClose }: NodeDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 text-zinc-900 dark:text-zinc-100 flex flex-col gap-4">
        
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide ${
              node.type === "decision" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-450" : "bg-zinc-100 text-zinc-850 dark:bg-zinc-800 dark:text-zinc-300"
            }`}>
              {node.type === "decision" ? "Decisão" : "Resultado"}
            </span>
            <h3 className="text-base font-bold truncate max-w-[280px]">{node.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4 text-zinc-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Descrição / Questão Jurídica</h4>
            <p className="text-sm mt-1.5 text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
              {node.description}
            </p>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-150 dark:border-zinc-850/50 flex flex-col gap-2">
            <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Scale className="h-4 w-4" />
              FONTE JURÍDICA (LEGISLAÇÃO / SÚMULA)
            </h4>
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 self-start rounded uppercase tracking-wide">
              {node.source.type}
            </span>
            <p className="text-xs mt-1 text-zinc-650 dark:text-zinc-400 italic leading-relaxed bg-white dark:bg-zinc-900/40 p-3 rounded-lg border border-zinc-100 dark:border-zinc-850">
              "{node.source.text}"
            </p>
            {node.source.link && node.source.link !== "#" && (
              <a
                href={node.source.link}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-1 flex items-center gap-1 self-start cursor-pointer"
              >
                Visualizar no Jusbrasil ou Diário Oficial →
              </a>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-650 text-white cursor-pointer"
          >
            Fechar Detalhes
          </button>
        </div>
      </div>
    </div>
  )
}
