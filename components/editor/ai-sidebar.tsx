'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Bot,
  X,
  Send,
  Sparkles,
  FileText,
  Download,
  Layers,
  Terminal,
  Cpu,
  ArrowRight,
  Clock,
  CheckCircle2,
  FileCode2,
  Trash2,
  Eye,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  Printer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useAction, useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { useMutation as useLiveblocksMutation, useStorage } from '@liveblocks/react'
import { LiveObject, LiveMap } from '@liveblocks/client'
import { useReactFlow } from '@xyflow/react'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import { printSpecDocument } from '@/lib/print-spec'
import { computeArchitectureDiffs } from '@/lib/ai-helpers'

interface AISidebarProps {
  isOpen: boolean
  onClose: () => void
  projectId?: string
  isReadOnly?: boolean
}

interface ChatMessage {
  id: string
  sender: 'user' | 'assistant'
  content: string
  timestamp: string
  isError?: boolean
  type?: 'initial' | 'refinement'
}

const STARTER_PROMPTS = [
  {
    icon: Layers,
    label: 'Design an e-commerce backend',
    prompt:
      'Design an e-commerce backend architecture with microservices, API Gateway, auth service, product catalog, payment processing, and Kafka event streaming.',
  },
  {
    icon: Terminal,
    label: 'Create a chat app architecture',
    prompt:
      'Create a real-time chat app architecture using WebSockets, Redis pub/sub, message queue, and partitioned PostgreSQL storage.',
  },
  {
    icon: Cpu,
    label: 'Build a CI/CD pipeline',
    prompt:
      'Build an automated CI/CD pipeline architecture featuring GitHub Actions, Docker container builds, staging validation, and Kubernetes rolling deployment.',
  },
]

const REFINEMENT_PROMPTS = [
  {
    icon: Layers,
    label: 'Add a Redis caching layer',
    prompt:
      'Add a Redis caching layer in front of the database to speed up reads and manage session caching.',
  },
  {
    icon: Terminal,
    label: 'Add authentication service',
    prompt:
      'Add a dedicated authentication and authorization service with JWT validation connected to the API gateway.',
  },
  {
    icon: Cpu,
    label: 'Add message queue & workers',
    prompt:
      'Introduce an asynchronous message broker with background worker services for decouple long-running jobs.',
  },
]

export function AISidebar({ isOpen, onClose, projectId, isReadOnly = false }: AISidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputPrompt, setInputPrompt] = useState('')
  const [activeTab, setActiveTab] = useState('architect')
  const [isGeneratingDesign, setIsGeneratingDesign] = useState(false)
  const [isGeneratingSpec, setIsGeneratingSpec] = useState(false)
  const [previewSpec, setPreviewSpec] = useState<{
    title: string
    content: string
    filePath: string
  } | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [copiedSpec, setCopiedSpec] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const specMarkdownRef = useRef<HTMLDivElement>(null)

  const { fitView } = useReactFlow()

  // Convex actions and queries
  const generateDesignAction = useAction(api.ai.generateDesign)
  const generateSpecAction = useAction(api.ai.generateSpec)
  const removeSpecMutation = useMutation(api.specs.remove)

  const specs =
    useQuery(
      api.specs.listByProject,
      projectId ? { projectId: projectId as Id<'projects'> } : 'skip'
    ) || []

  // Read current canvas elements from Liveblocks storage for spec generation
  const canvasElements = useStorage((root: any) => {
    const flow = root?.flow
    if (!flow) return { nodes: [], edges: [] }

    const nodesMap = flow.nodes
    const edgesMap = flow.edges

    const nodes = nodesMap
      ? nodesMap.values
        ? Array.from(nodesMap.values())
        : Object.values(nodesMap)
      : []
    const edges = edgesMap
      ? edgesMap.values
        ? Array.from(edgesMap.values())
        : Object.values(edgesMap)
      : []

    return { nodes, edges }
  }) || { nodes: [], edges: [] }

  // Liveblocks mutation to apply generated nodes and edges onto the canvas
  const applyGeneratedArchitecture = useLiveblocksMutation(
    ({ storage }, generated: { nodes: any[]; edges: any[] }) => {
      const flow = storage.get('flow') as any
      if (!flow) {
        const nodesMap = new LiveMap()
        const edgesMap = new LiveMap()
        generated.nodes.forEach((n) => {
          nodesMap.set(
            n.id,
            new LiveObject<any>({
              id: n.id,
              type: n.type || 'canvasNode',
              position: n.position,
              data: new LiveObject(n.data as any),
              ...(n.style ? { style: n.style } : {}),
            })
          )
        })
        generated.edges.forEach((e) => {
          edgesMap.set(
            e.id,
            new LiveObject<any>({
              id: e.id,
              source: e.source,
              target: e.target,
              sourceHandle: e.sourceHandle,
              targetHandle: e.targetHandle,
              type: e.type || 'canvasEdge',
              markerEnd: e.markerEnd,
              data: new LiveObject((e.data || {}) as any),
            })
          )
        })
        storage.set('flow', new LiveObject({ nodes: nodesMap, edges: edgesMap }))
        return
      }

      const nodesMap = flow.get('nodes')
      const edgesMap = flow.get('edges')

      if (nodesMap) {
        const incomingNodeIds = new Set(generated.nodes.map((n) => n.id))

        // 1. Remove nodes no longer present in incoming graph
        const existingNodeKeys = Array.from(nodesMap.keys())
        for (const key of existingNodeKeys) {
          if (!incomingNodeIds.has(key)) {
            nodesMap.delete(key)
          }
        }

        // 2. Patch existing nodes or insert new ones
        for (const node of generated.nodes) {
          const existing = nodesMap.get(node.id)
          if (existing) {
            existing.set('position', node.position)
            const dataObj = existing.get('data')
            if (dataObj) {
              dataObj.set('label', node.data.label)
              dataObj.set('shape', node.data.shape)
              dataObj.set('color', node.data.color)
              if (node.data.diff !== undefined) {
                dataObj.set('diff', node.data.diff)
              }
            } else {
              existing.set('data', new LiveObject(node.data as any))
            }
          } else {
            nodesMap.set(
              node.id,
              new LiveObject<any>({
                id: node.id,
                type: node.type || 'canvasNode',
                position: node.position,
                data: new LiveObject(node.data as any),
                ...(node.style ? { style: node.style } : {}),
              })
            )
          }
        }
      }

      if (edgesMap) {
        const incomingEdgeIds = new Set(generated.edges.map((e) => e.id))

        // 1. Remove edges no longer present in incoming graph
        const existingEdgeKeys = Array.from(edgesMap.keys())
        for (const key of existingEdgeKeys) {
          if (!incomingEdgeIds.has(key)) {
            edgesMap.delete(key)
          }
        }

        // 2. Patch existing edges or insert new ones
        for (const edge of generated.edges) {
          const existing = edgesMap.get(edge.id)
          if (existing) {
            existing.set('source', edge.source)
            existing.set('target', edge.target)
            existing.set('sourceHandle', edge.sourceHandle)
            existing.set('targetHandle', edge.targetHandle)
            const dataObj = existing.get('data')
            if (dataObj) {
              dataObj.set('label', edge.data?.label || '')
            } else {
              existing.set('data', new LiveObject((edge.data || {}) as any))
            }
          } else {
            edgesMap.set(
              edge.id,
              new LiveObject<any>({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                sourceHandle: edge.sourceHandle,
                targetHandle: edge.targetHandle,
                type: edge.type || 'canvasEdge',
                markerEnd: edge.markerEnd,
                data: new LiveObject((edge.data || {}) as any),
              })
            )
          }
        }
      }
    },
    []
  )

  // Liveblocks mutation to clear ephemeral visual diff tags after inspection
  const clearDiffFlags = useLiveblocksMutation(({ storage }) => {
    const flow = storage.get('flow') as any
    const nodesMap = flow?.get('nodes')
    if (!nodesMap) return
    for (const nodeKey of Array.from(nodesMap.keys())) {
      const nodeObj = nodesMap.get(nodeKey) as any
      const dataObj = nodeObj?.get('data')
      if (dataObj && dataObj.get('diff')) {
        dataObj.set('diff', null)
      }
    }
  }, [])

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isGeneratingDesign])

  // Adjust textarea height dynamically
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputPrompt(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(Math.max(textareaRef.current.scrollHeight, 72), 160)}px`
    }
  }

  const handleSendMessage = async (textToSend?: string) => {
    if (isReadOnly) return
    const content = (textToSend || inputPrompt).trim()
    if (!content || isGeneratingDesign) return

    if (!projectId) {
      toast.error('Project not found. Please try reloading the page.')
      return
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputPrompt('')

    if (textareaRef.current) {
      textareaRef.current.style.height = '72px'
    }

    const hasExisting = Boolean(canvasElements.nodes && canvasElements.nodes.length > 0)

    const historyPayload = messages
      .filter((m) => !m.isError)
      .slice(-6)
      .map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.content,
      }))

    setIsGeneratingDesign(true)

    try {
      toast.loading(
        hasExisting
          ? 'Refining architecture with Ghost AI...'
          : 'Generating architecture graph with Ghost AI...',
        { id: 'generating-arch' }
      )

      const result = await generateDesignAction({
        projectId: projectId as Id<'projects'>,
        prompt: content,
        currentNodes: hasExisting ? canvasElements.nodes : undefined,
        currentEdges: hasExisting ? canvasElements.edges : undefined,
        history: historyPayload.length > 0 ? historyPayload : undefined,
      })

      toast.dismiss('generating-arch')

      if (result && result.nodes && result.edges) {
        // Compute visual architecture diffs
        const nodesWithDiff = computeArchitectureDiffs(
          canvasElements.nodes || [],
          result.nodes
        )

        // Apply nodes and edges to Liveblocks CRDT with in-place reconciliation
        applyGeneratedArchitecture({
          nodes: nodesWithDiff,
          edges: result.edges,
        })

        if (hasExisting) {
          setTimeout(() => {
            clearDiffFlags()
          }, 12000)
        }

        // Fit view after a slight delay to allow React Flow to layout
        setTimeout(() => {
          fitView({ duration: 500, padding: 0.2 })
        }, 150)

        const summaryText =
          (result as any).summary ||
          (hasExisting
            ? `Updated architecture for "${content.length > 40 ? content.slice(0, 37) + '...' : content}"`
            : `Generated architecture for "${content.length > 40 ? content.slice(0, 37) + '...' : content}"`)

        const assistantMessage: ChatMessage = {
          id: `msg-resp-${Date.now()}`,
          sender: 'assistant',
          content: `${summaryText}. Canvas now features ${result.nodes.length} components with ${result.edges.length} relationships.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: hasExisting ? 'refinement' : 'initial',
        }
        setMessages((prev) => [...prev, assistantMessage])
        toast.success(
          hasExisting ? 'Architecture refined!' : 'Architecture generated successfully!'
        )
      } else {
        throw new Error('Invalid response format from AI model')
      }
    } catch (error: any) {
      toast.dismiss('generating-arch')
      console.error('AI Generation failed:', error)
      const errorMessage = error?.message || 'Failed to generate architecture'
      toast.error(errorMessage)

      const assistantError: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'assistant',
        content: `Sorry, I couldn't generate the architecture: ${errorMessage}. If MISTRAL_API_KEY is not configured, please ensure it is added to your Convex environment via 'npx convex env set MISTRAL_API_KEY <your-key>'.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      }
      setMessages((prev) => [...prev, assistantError])
    } finally {
      setIsGeneratingDesign(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSelectStarterChip = (prompt: string) => {
    if (isReadOnly) return
    setInputPrompt(prompt)
    if (textareaRef.current) {
      textareaRef.current.focus()
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
          textareaRef.current.style.height = `${Math.min(Math.max(textareaRef.current.scrollHeight, 72), 160)}px`
        }
      }, 0)
    }
  }

  const handleGenerateSpec = async () => {
    if (isReadOnly) return
    if (!projectId) {
      toast.error('Project not found')
      return
    }

    const { nodes, edges } = canvasElements
    if (!nodes || nodes.length === 0) {
      toast.error(
        'Your canvas is empty. Add components or generate an architecture before creating a spec.'
      )
      return
    }

    setIsGeneratingSpec(true)
    toast.loading('Analyzing canvas graph and writing specification...', { id: 'spec-gen' })

    try {
      const result = await generateSpecAction({
        projectId: projectId as Id<'projects'>,
        nodes,
        edges,
        siteUrl: window.location.origin,
      })

      toast.dismiss('spec-gen')
      toast.success(`Generated "${result.title}"`)
    } catch (error: any) {
      toast.dismiss('spec-gen')
      console.error('Spec generation failed:', error)
      toast.error(error?.message || 'Failed to generate specification')
    } finally {
      setIsGeneratingSpec(false)
    }
  }

  const handleOpenSpecPreview = async (spec: { title: string; filePath: string }) => {
    setIsLoadingPreview(true)
    setPreviewSpec({ title: spec.title, content: '', filePath: spec.filePath })

    try {
      const res = await fetch(spec.filePath)
      if (!res.ok) throw new Error('Failed to load specification content')
      const text = await res.text()
      setPreviewSpec({ title: spec.title, content: text, filePath: spec.filePath })
    } catch (err: any) {
      toast.error('Could not load preview: ' + err.message)
      setPreviewSpec(null)
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const handleDownloadSpec = (spec: { _id?: string; title: string; filePath: string }) => {
    try {
      const specIdentifier = spec._id || 'spec'
      const downloadUrl = `/api/specs/${specIdentifier}?url=${encodeURIComponent(spec.filePath)}`
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${spec.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Download started')
    } catch {
      toast.error('Failed to initiate download')
    }
  }

  const handleDeleteSpec = async (specId: Id<'specs'>) => {
    if (isReadOnly) return
    try {
      await removeSpecMutation({ specId })
      toast.success('Specification removed')
      if (previewSpec) setPreviewSpec(null)
    } catch (err: any) {
      toast.error('Failed to delete spec: ' + err.message)
    }
  }

  const handleCopyMarkdown = () => {
    if (!previewSpec?.content) return
    navigator.clipboard.writeText(previewSpec.content)
    setCopiedSpec(true)
    toast.success('Markdown copied to clipboard')
    setTimeout(() => setCopiedSpec(false), 2000)
  }

  const handlePrintSpec = () => {
    if (!previewSpec || !specMarkdownRef.current) return
    printSpecDocument({
      title: previewSpec.title,
      htmlContent: specMarkdownRef.current.innerHTML,
    })
  }

  return (
    <>
      <aside
        className={cn(
          'h-full bg-bg-surface/95 backdrop-blur-md border-l border-border-default shadow-2xl transition-all duration-300 ease-in-out overflow-hidden flex flex-col z-20 flex-shrink-0',
          isOpen ? 'w-96' : 'w-0 border-l-0'
        )}
        aria-label="AI Workspace"
      >
        <div className="w-96 h-full flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-default flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-accent-ai-dim border border-accent-ai/30 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Bot className="h-4 w-4 text-accent-ai-text" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text-primary leading-none font-heading">
                  AI Workspace
                </h2>
                <p className="text-[11px] text-text-muted mt-1 leading-none">
                  Collaborate with Ghost AI
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close AI workspace"
              className="h-8 w-8 text-text-muted hover:text-text-primary hover:bg-bg-subtle rounded-lg"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Tab Navigation */}
          <div className="flex-1 flex flex-col overflow-hidden p-3 pt-2">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <TabsList className="grid w-full grid-cols-2 bg-bg-subtle p-1 rounded-xl border border-border-subtle flex-shrink-0">
                <TabsTrigger
                  value="architect"
                  className="gap-2 text-xs font-medium data-active:bg-bg-elevated data-active:text-text-primary data-active:shadow-sm"
                >
                  <Sparkles className="h-3.5 w-3.5 text-accent-ai-text" />
                  AI Architect
                </TabsTrigger>
                <TabsTrigger
                  value="specs"
                  className="gap-2 text-xs font-medium data-active:bg-bg-elevated data-active:text-text-primary data-active:shadow-sm"
                >
                  <FileText className="h-3.5 w-3.5 text-accent-primary" />
                  Specs {specs.length > 0 && `(${specs.length})`}
                </TabsTrigger>
              </TabsList>

              {/* AI Architect Tab Content */}
              <TabsContent
                value="architect"
                className="flex-1 flex flex-col overflow-hidden mt-3 p-0 data-active:flex"
              >
                {isReadOnly && (
                  <div className="flex items-center gap-2 p-2.5 mx-1 mb-2 rounded-xl bg-accent-primary-dim/60 border border-accent-primary/40 text-xs text-text-secondary select-none">
                    <Eye className="h-4 w-4 text-accent-primary shrink-0" />
                    <span>View-only mode: Architecture generation and modifications are disabled.</span>
                  </div>
                )}

                {/* Chat messages / Empty state */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col justify-between py-2">
                      <div className="flex flex-col items-center text-center px-2 pt-4">
                        <div className="h-14 w-14 rounded-2xl bg-accent-ai-dim border border-accent-ai/20 flex items-center justify-center mb-3 shadow-inner">
                          <Bot className="h-7 w-7 text-accent-ai-text" />
                        </div>
                        <h3 className="text-sm font-semibold text-text-primary font-heading">
                          Ghost AI Architect
                        </h3>
                        <p className="text-xs text-text-muted mt-1 max-w-[260px] leading-relaxed">
                          Describe your system architecture in plain English, and Ghost AI will map
                          nodes and relationships directly onto your canvas.
                        </p>
                      </div>

                      <div className="space-y-2 mt-4">
                        <div className="text-[11px] font-medium text-text-faint uppercase tracking-wider px-1">
                          {canvasElements.nodes.length > 0
                            ? 'Refinement Suggestions'
                            : 'Starter Blueprints'}
                        </div>
                        <div className="flex flex-col gap-2">
                          {(canvasElements.nodes.length > 0
                            ? REFINEMENT_PROMPTS
                            : STARTER_PROMPTS
                          ).map((item, idx) => {
                            const Icon = item.icon
                            return (
                              <button
                                key={idx}
                                type="button"
                                disabled={isReadOnly}
                                onClick={() => handleSelectStarterChip(item.prompt)}
                                className={cn(
                                  "group flex items-center justify-between p-2.5 rounded-xl bg-bg-subtle hover:bg-bg-elevated border border-border-subtle hover:border-accent-ai/30 text-left transition-all text-xs shadow-sm",
                                  isReadOnly ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                                )}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="p-1.5 rounded-lg bg-bg-surface border border-border-subtle group-hover:border-accent-ai/30 group-hover:text-accent-ai-text text-text-muted transition-colors">
                                    <Icon className="h-3.5 w-3.5" />
                                  </div>
                                  <span className="font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                                    {item.label}
                                  </span>
                                </div>
                                <ArrowRight className="h-3 w-3 text-text-faint group-hover:text-accent-ai-text group-hover:translate-x-0.5 transition-all" />
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 py-2">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            'flex flex-col gap-1 max-w-[88%]',
                            msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                          )}
                        >
                          {msg.type && (
                            <span
                              className={cn(
                                'text-[9px] px-2 py-0.5 rounded-full font-medium border inline-flex items-center gap-1 mb-0.5',
                                msg.type === 'refinement'
                                  ? 'bg-accent-ai-dim text-accent-ai-text border-accent-ai/30'
                                  : 'bg-accent-primary-dim text-accent-primary border-accent-primary/30'
                              )}
                            >
                              <Sparkles className="h-2.5 w-2.5" />
                              {msg.type === 'refinement' ? 'Refined Graph' : 'Initial Architecture'}
                            </span>
                          )}
                          <div
                            className={cn(
                              'rounded-2xl p-3 text-xs leading-relaxed shadow-sm',
                              msg.sender === 'user'
                                ? 'bg-accent-primary-dim border border-accent-primary/40 text-text-primary rounded-tr-sm'
                                : msg.isError
                                  ? 'bg-state-error/10 border border-state-error/30 text-state-error rounded-tl-sm'
                                  : 'bg-bg-elevated border border-border-default text-text-secondary rounded-tl-sm'
                            )}
                          >
                            {msg.content}
                          </div>
                          <div className="text-[10px] text-text-faint px-1 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            <span>{msg.timestamp}</span>
                          </div>
                        </div>
                      ))}

                      {isGeneratingDesign && (
                        <div className="mr-auto items-start flex flex-col gap-1 max-w-[88%]">
                          <div className="rounded-2xl p-3 text-xs bg-bg-elevated border border-accent-ai/40 text-accent-ai-text rounded-tl-sm flex items-center gap-2">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>
                              {canvasElements.nodes.length > 0
                                ? 'Refining canvas components & relationships...'
                                : 'Synthesizing system components & connections...'}
                            </span>
                          </div>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="mt-3 pt-2 border-t border-border-subtle flex-shrink-0">
                  {canvasElements.nodes.length > 0 && (
                    <div className="flex items-center gap-1.5 px-1 pb-1.5 text-[10px] text-accent-ai-text">
                      <Sparkles className="h-3 w-3" />
                      <span>
                        Refining active canvas ({canvasElements.nodes.length} components,{' '}
                        {canvasElements.edges.length} connections)
                      </span>
                    </div>
                  )}
                  <div className="relative rounded-xl bg-bg-elevated border border-border-default focus-within:border-accent-ai/60 focus-within:ring-1 focus-within:ring-accent-ai/40 transition-all p-2 flex flex-col gap-2 shadow-inner">
                    <Textarea
                      ref={textareaRef}
                      value={inputPrompt}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        isReadOnly
                          ? 'Architecture is view-only...'
                          : canvasElements.nodes.length > 0
                            ? 'Suggest changes, additions, or refinements...'
                            : 'Describe a system architecture...'
                      }
                      disabled={isGeneratingDesign || isReadOnly}
                      className="min-h-[72px] max-h-[160px] resize-none border-0 bg-transparent p-1 text-xs text-text-primary placeholder:text-text-muted focus-visible:ring-0 focus-visible:outline-none leading-relaxed disabled:opacity-50"
                    />
                    <div className="flex items-center justify-between pt-1 border-t border-border-subtle/50">
                      <span className="text-[10px] text-text-faint">
                        <kbd className="px-1 py-0.5 rounded bg-bg-subtle text-text-muted font-mono text-[9px] border border-border-subtle">
                          Enter
                        </kbd>{' '}
                        send •{' '}
                        <kbd className="px-1 py-0.5 rounded bg-bg-subtle text-text-muted font-mono text-[9px] border border-border-subtle">
                          Shift+Enter
                        </kbd>{' '}
                        newline
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleSendMessage()}
                        disabled={!inputPrompt.trim() || isGeneratingDesign || isReadOnly}
                        className="h-7 px-3 gap-1.5 bg-accent-ai hover:bg-accent-ai/90 text-white rounded-lg text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                      >
                        {isGeneratingDesign ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <span>{canvasElements.nodes.length > 0 ? 'Refine' : 'Generate'}</span>
                            <Send className="h-3 w-3" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Specs Tab Content */}
              <TabsContent
                value="specs"
                className="flex-1 flex flex-col overflow-hidden mt-3 p-0 data-active:flex"
              >
                <ScrollArea className="flex-1 pr-1">
                  <div className="space-y-4 py-1">
                    {/* Generate Spec Action */}
                    <div className="p-3.5 rounded-2xl bg-bg-subtle border border-border-subtle flex flex-col gap-3">
                      <div>
                        <h4 className="text-xs font-semibold text-text-primary font-heading flex items-center gap-1.5">
                          <FileCode2 className="h-4 w-4 text-accent-primary" />
                          Specification Generator
                        </h4>
                        <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                          Convert your current canvas graph into a Markdown technical spec and
                          persist it to artifact storage.
                        </p>
                      </div>

                      <Button
                        size="sm"
                        onClick={handleGenerateSpec}
                        disabled={isGeneratingSpec || canvasElements.nodes.length === 0 || isReadOnly}
                        className="w-full gap-2 bg-accent-ai hover:bg-accent-ai/90 text-white text-xs font-medium rounded-xl h-8 shadow-sm transition-all disabled:opacity-50"
                      >
                        {isGeneratingSpec ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Writing Technical Spec...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>
                              {isReadOnly
                                ? 'Spec Generation Disabled (View Only)'
                                : `Generate Spec (${canvasElements.nodes.length} nodes)`}
                            </span>
                          </>
                        )}
                      </Button>

                      {canvasElements.nodes.length === 0 && (
                        <div className="flex items-center gap-1.5 text-[10px] text-state-warning">
                          <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                          <span>Add components to the canvas before generating a spec.</span>
                        </div>
                      )}
                    </div>

                    {/* Generated Specs List */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-medium text-text-faint uppercase tracking-wider px-1 flex items-center justify-between">
                        <span>Generated Specs</span>
                        <span className="text-[10px] lowercase font-normal">
                          {specs.length} total
                        </span>
                      </div>

                      {specs.length === 0 ? (
                        <div className="rounded-2xl bg-bg-elevated/50 border border-dashed border-border-subtle p-6 text-center text-text-muted">
                          <FileText className="h-8 w-8 mx-auto mb-2 opacity-30 text-accent-primary" />
                          <p className="text-xs">No specifications generated yet.</p>
                          <p className="text-[10px] text-text-faint mt-1">
                            Click &quot;Generate Spec&quot; above to synthesize a Markdown document
                            from your canvas graph.
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2.5">
                          {specs.map((spec: any) => (
                            <div
                              key={spec._id}
                              className="rounded-2xl bg-bg-elevated border border-border-default p-3.5 flex flex-col gap-3 transition-colors hover:border-border-subtle shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="p-2 rounded-xl bg-bg-subtle border border-border-subtle text-accent-primary flex-shrink-0">
                                    <FileText className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <h5 className="text-xs font-semibold text-text-primary leading-tight truncate">
                                      {spec.title}
                                    </h5>
                                    <span className="text-[10px] text-text-muted flex items-center gap-1 mt-0.5">
                                      <CheckCircle2 className="h-2.5 w-2.5 text-state-success" />
                                      {new Date(spec.createdAt).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                </div>

                                {!isReadOnly && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteSpec(spec._id)}
                                    className="h-6 w-6 text-text-muted hover:text-state-error hover:bg-state-error/10 rounded-md flex-shrink-0"
                                    title="Delete specification"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border-subtle/50">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenSpecPreview(spec)}
                                  className="gap-1.5 text-[11px] border-border-subtle bg-bg-subtle text-text-secondary hover:text-text-primary hover:bg-bg-elevated h-7 rounded-lg justify-center"
                                >
                                  <Eye className="h-3 w-3" />
                                  <span>View Spec</span>
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadSpec(spec)}
                                  className="gap-1.5 text-[11px] border-border-subtle bg-bg-subtle text-accent-primary hover:text-accent-primary hover:bg-accent-primary-dim h-7 rounded-lg justify-center"
                                >
                                  <Download className="h-3 w-3" />
                                  <span>Download</span>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </aside>

      {/* Markdown Spec Preview Dialog */}
      <Dialog open={!!previewSpec} onOpenChange={(open) => !open && setPreviewSpec(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] rounded-3xl bg-bg-surface border-border-default text-text-primary flex flex-col overflow-hidden p-6">
          <DialogHeader className="pb-3 border-b border-border-default flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-base font-semibold font-heading">
                  {previewSpec?.title || 'System Architecture Specification'}
                </DialogTitle>
                <DialogDescription className="text-xs text-text-muted mt-0.5">
                  Generated Markdown specification artifact
                </DialogDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyMarkdown}
                  className="gap-1.5 h-8 text-xs border-border-subtle bg-bg-subtle text-text-secondary hover:text-text-primary rounded-xl"
                  title="Copy Markdown source to clipboard"
                >
                  {copiedSpec ? (
                    <Check className="h-3.5 w-3.5 text-state-success" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>{copiedSpec ? 'Copied' : 'Copy'}</span>
                </Button>

                {previewSpec && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrintSpec}
                      className="gap-1.5 h-8 text-xs border-border-subtle bg-bg-subtle text-text-secondary hover:text-text-primary rounded-xl"
                      title="Export as PDF or print specification"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>PDF / Print</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadSpec(previewSpec)}
                      className="gap-1.5 h-8 text-xs border-accent-primary/40 bg-accent-primary-dim text-accent-primary hover:bg-accent-primary-dim/80 rounded-xl"
                      title="Download raw Markdown file"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download (.md)</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 pr-1">
            {isLoadingPreview ? (
              <div className="h-64 flex flex-col items-center justify-center gap-2 text-text-muted">
                <Loader2 className="h-6 w-6 animate-spin text-accent-primary" />
                <p className="text-xs">Fetching specification artifact...</p>
              </div>
            ) : (
              <div
                ref={specMarkdownRef}
                className="prose prose-invert prose-sm max-w-none text-text-secondary leading-relaxed space-y-4 font-sans [&>h1]:text-lg [&>h1]:font-semibold [&>h1]:text-text-primary [&>h1]:font-heading [&>h2]:text-sm [&>h2]:font-semibold [&>h2]:text-text-primary [&>h2]:mt-4 [&>h2]:font-heading [&>h3]:text-xs [&>h3]:font-semibold [&>h3]:text-accent-ai-text [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>p]:text-xs [&>li]:text-xs [&>table]:w-full [&>table]:text-xs [&>table]:border-collapse [&>th]:border-b [&>th]:border-border-default [&>th]:pb-1 [&>td]:py-1 [&>td]:border-b [&>td]:border-border-subtle"
              >
                <ReactMarkdown>{previewSpec?.content || ''}</ReactMarkdown>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
