import { v } from 'convex/values'
import { action } from './_generated/server'
import { internal } from './_generated/api'
import { Id } from './_generated/dataModel'

const DESIGN_SYSTEM_PROMPT = `You are Ghost AI, a system architecture design expert. Given a user's description of a system, generate a structured architecture diagram as a JSON object.

OUTPUT FORMAT:
Return ONLY a valid JSON object with this exact structure:
{
  "nodes": [
    {
      "id": "unique-id",
      "label": "Node Label",
      "shape": "rectangle|diamond|circle|pill|cylinder|hexagon",
      "color": "default|blue|purple|orange|red|pink|green|teal",
      "position": { "x": number, "y": number }
    }
  ],
  "edges": [
    {
      "id": "unique-edge-id",
      "source": "source-node-id",
      "target": "target-node-id",
      "sourceHandle": "bottom|top|left|right",
      "targetHandle": "top|bottom|left|right",
      "label": "optional edge label"
    }
  ]
}

SHAPE GUIDELINES:
- "rectangle" — general-purpose services, components, modules
- "diamond" — decision points, gateways, routers
- "circle" — events, triggers, endpoints
- "pill" — services, processes, microservices
- "cylinder" — databases, storage, caches
- "hexagon" — external systems, third-party APIs, boundaries

COLOR GUIDELINES:
- "default" (dark gray) — general nodes
- "blue" — API layers, gateways, networking
- "purple" — AI/ML services, processing
- "orange" — messaging, queues, events
- "red" — monitoring, alerting, error handling
- "pink" — user-facing, frontend, UI
- "green" — databases, storage, persistence
- "teal" — infrastructure, DevOps, deployment

LAYOUT RULES:
- Position nodes in a logical flow (top-to-bottom or left-to-right)
- Space nodes at least 250px apart horizontally and 150px apart vertically
- Start the first node at position (100, 100)
- Group related nodes together
- Use edges to show data flow and dependencies
- Prefer "bottom" sourceHandle to "top" targetHandle for vertical flows
- Prefer "right" sourceHandle to "left" targetHandle for horizontal flows

Generate a comprehensive but clear architecture. Aim for 6-15 nodes depending on complexity. Every node must have at least one edge connection.

Return ONLY the JSON object, no markdown fences, no explanation.`

const SPEC_SYSTEM_PROMPT = `You are Ghost AI, a technical specification writer. Given a system architecture graph (nodes and edges), generate a comprehensive Markdown technical specification document.

The spec should include:

1. **Executive Overview** — Brief summary of the system purpose and architecture style
2. **System Components** — Detailed description of each component (node), its role, responsibilities, and technology recommendations
3. **Data Flow & Integration** — How components connect (edges), data formats, protocols, and communication patterns
4. **Infrastructure Requirements** — Deployment topology, scaling considerations, and resource estimates
5. **Security Considerations** — Authentication, authorization, encryption, and network security
6. **Non-Functional Requirements** — Performance targets, availability, monitoring, and observability

Format the output as clean Markdown with proper headings, bullet points, and tables where appropriate.
Do NOT include any JSON or code fences around the entire output. Return ONLY the Markdown content.`

async function callMistralChat({
  model,
  messages,
  temperature = 0.7,
  responseFormat,
}: {
  model: string
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  temperature?: number
  responseFormat?: { type: 'json_object' }
}): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY
  if (!apiKey) {
    throw new Error(
      'MISTRAL_API_KEY environment variable is not set. Set it with: npx convex env set MISTRAL_API_KEY <your-mistral-api-key>'
    )
  }

  const payload: any = {
    model,
    messages,
    temperature,
  }

  if (responseFormat) {
    payload.response_format = responseFormat
  }

  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Mistral API error (${res.status}): ${errorText}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Mistral AI returned an empty response')
  }

  return content.trim()
}

// Design generation action - calls Mistral and writes result to taskRuns
export const generateDesign = action({
  args: {
    projectId: v.id('projects'),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    // Create a task run record in taskRuns table
    const taskRunId: Id<'taskRuns'> = await ctx.runMutation(internal.taskRuns.insertTaskRun, {
      projectId: args.projectId,
      type: 'design',
      prompt: args.prompt,
    })

    try {
      // Update status to running
      await ctx.runMutation(internal.taskRuns.patchTaskRun, {
        taskRunId,
        status: 'running',
      })

      const text = await callMistralChat({
        model: 'mistral-small-latest',
        responseFormat: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: DESIGN_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: args.prompt,
          },
        ],
        temperature: 0.7,
      })

      // Strip markdown code fences if present
      let jsonText = text
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      }

      const parsed = JSON.parse(jsonText)

      // Validate basic structure
      if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
        throw new Error('AI response missing nodes array')
      }
      if (!parsed.edges || !Array.isArray(parsed.edges)) {
        throw new Error('AI response missing edges array')
      }

      // Transform nodes into canvas-compatible format
      const nodes = parsed.nodes.map((node: any, index: number) => ({
        id: node.id || `node-${index}-${Date.now()}`,
        type: 'canvasNode',
        position: node.position || {
          x: 100 + (index % 4) * 300,
          y: 100 + Math.floor(index / 4) * 200,
        },
        data: {
          label: node.label || 'Untitled',
          shape: node.shape || 'rectangle',
          color: node.color || 'default',
        },
      }))

      // Transform edges into canvas-compatible format
      const edges = parsed.edges.map((edge: any, index: number) => ({
        id: edge.id || `edge-${index}-${Date.now()}`,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle || 'bottom',
        targetHandle: edge.targetHandle || 'top',
        type: 'canvasEdge',
        markerEnd: { type: 'arrowclosed' },
        data: {
          label: edge.label || '',
        },
      }))

      // Mark as completed with the result
      await ctx.runMutation(internal.taskRuns.patchTaskRun, {
        taskRunId,
        status: 'completed',
        result: { nodes, edges },
      })

      return { taskRunId, nodes, edges }
    } catch (error: any) {
      // Mark as failed
      await ctx.runMutation(internal.taskRuns.patchTaskRun, {
        taskRunId,
        status: 'failed',
        error: error.message || 'Unknown error during design generation',
      })
      throw error
    }
  },
})

// Spec generation action - reads canvas graph, calls Mistral, uploads to blob
export const generateSpec = action({
  args: {
    projectId: v.id('projects'),
    nodes: v.array(v.any()),
    edges: v.array(v.any()),
    siteUrl: v.string(),
  },
  handler: async (ctx, args) => {
    // Create a task run record
    const taskRunId: Id<'taskRuns'> = await ctx.runMutation(internal.taskRuns.insertTaskRun, {
      projectId: args.projectId,
      type: 'spec',
      prompt: 'Generate technical specification from canvas graph',
    })

    try {
      await ctx.runMutation(internal.taskRuns.patchTaskRun, {
        taskRunId,
        status: 'running',
      })

      // Serialize graph for the LLM
      const graphDescription = serializeGraphForLLM(args.nodes, args.edges)

      const markdown = await callMistralChat({
        model: 'mistral-large-latest',
        messages: [
          {
            role: 'system',
            content: SPEC_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: `Architecture Graph:\n${graphDescription}`,
          },
        ],
        temperature: 0.5,
      })

      // Generate spec ID and title
      const specId = `spec-${Date.now()}`
      const title = extractSpecTitle(markdown)

      // Upload to Vercel Blob via Next.js API route
      const uploadResponse = await fetch(`${args.siteUrl}/api/specs/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: args.projectId,
          specId,
          content: markdown,
        }),
      })

      if (!uploadResponse.ok) {
        const err = await uploadResponse.text()
        throw new Error(`Failed to upload spec: ${err}`)
      }

      const { blobUrl } = await uploadResponse.json()

      // Create spec record in Convex
      await ctx.runMutation(internal.taskRuns.insertSpec, {
        projectId: args.projectId,
        taskRunId,
        title,
        filePath: blobUrl,
      })

      // Mark task as completed
      await ctx.runMutation(internal.taskRuns.patchTaskRun, {
        taskRunId,
        status: 'completed',
        result: { specId, title, filePath: blobUrl, markdown },
      })

      return { taskRunId, specId, title, filePath: blobUrl, markdown }
    } catch (error: any) {
      await ctx.runMutation(internal.taskRuns.patchTaskRun, {
        taskRunId,
        status: 'failed',
        error: error.message || 'Unknown error during spec generation',
      })
      throw error
    }
  },
})

// Helper: serialize graph nodes/edges into a text description for the LLM
function serializeGraphForLLM(nodes: any[], edges: any[]): string {
  const nodeLines = nodes.map((n: any) => {
    const label = n.data?.label || n.label || 'Untitled'
    const shape = n.data?.shape || 'rectangle'
    const color = n.data?.color || 'default'
    return `- [${shape.toUpperCase()}] "${label}" (color: ${color}, id: ${n.id})`
  })

  const edgeLines = edges.map((e: any) => {
    const label = e.data?.label || e.label || ''
    const labelStr = label ? ` — "${label}"` : ''
    return `- ${e.source} -> ${e.target}${labelStr}`
  })

  return `NODES:\n${nodeLines.join('\n')}\n\nCONNECTIONS:\n${edgeLines.join('\n')}`
}

// Helper: extract a title from the first heading in the markdown
function extractSpecTitle(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m)
  if (match) return match[1].trim()
  return 'System Architecture Specification'
}
