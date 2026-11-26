import { v, ConvexError } from 'convex/values'
import { action } from './_generated/server'
import { internal } from './_generated/api'
import { Id } from './_generated/dataModel'

const VALID_SHAPES = new Set(['rectangle', 'diamond', 'circle', 'pill', 'cylinder', 'hexagon'])
const VALID_COLORS = new Set(['default', 'blue', 'purple', 'orange', 'red', 'pink', 'green', 'teal'])

function normalizeHandle(handle: string | undefined, kind: 'source' | 'target'): string {
  const defaultSide = kind === 'source' ? 'bottom' : 'top'
  if (!handle) return `${defaultSide}-${kind}`
  if (handle.endsWith('-source') || handle.endsWith('-target')) return handle
  if (handle === 'top' || handle === 'bottom' || handle === 'left' || handle === 'right') {
    return `${handle}-${kind}`
  }
  return `${defaultSide}-${kind}`
}

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
      "sourceHandle": "bottom-source|top-source|left-source|right-source",
      "targetHandle": "top-target|bottom-target|left-target|right-target",
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
- Prefer "bottom-source" to "top-target" for vertical flows
- Prefer "right-source" to "left-target" for horizontal flows

Generate a comprehensive but clear architecture. Aim for 6-15 nodes depending on complexity. Every node must have at least one edge connection.

Return ONLY the JSON object, no markdown fences, no explanation.`

const REFINEMENT_SYSTEM_PROMPT = `You are Ghost AI, a system architecture design expert. You are refining an EXISTING architecture diagram on the user's canvas based on their natural language instructions.

TASK:
Analyze the current canvas graph provided by the user, their recent chat history, and their latest prompt.
Modify, extend, or refactor the architecture according to their prompt:
- To ADD a component: add a new node with a descriptive unique ID, appropriate shape and color, and place it at logical unoccupied coordinates (space at least 250px horizontally or 150px vertically from connected nodes). Connect it to existing nodes with edges.
- To MODIFY a component: update the label, color, or shape of the existing node while PRESERVING its existing "id".
- To REMOVE a component: omit that node from the returned "nodes" list, and omit any connected edges.
- To PRESERVE unchanged components: keep their exact existing "id", label, shape, color, and "position" coordinates intact.
- If the user explicitly asks to "clear", "start over", or "create from scratch", you may generate a completely new architecture.

OUTPUT FORMAT:
Return ONLY a valid JSON object with this exact structure:
{
  "summary": "Short 1-sentence explanation of what you added, changed, or removed",
  "nodes": [
    {
      "id": "existing-or-new-id",
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
      "sourceHandle": "bottom-source|top-source|left-source|right-source",
      "targetHandle": "top-target|bottom-target|left-target|right-target",
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

// Fallback offline architectures when MISTRAL_API_KEY is not set
function generateOfflineArchitecture(
  prompt: string,
  currentNodes?: any[],
  currentEdges?: any[]
): { nodes: any[]; edges: any[]; summary: string } {
  const cleanPrompt = prompt.trim()
  const lowerPrompt = cleanPrompt.toLowerCase()
  const hasExisting = Array.isArray(currentNodes) && currentNodes.length > 0

  if (hasExisting) {
    const nodes = [...currentNodes!]
    const edges = [...(currentEdges || [])]

    if (lowerPrompt.includes('remove') || lowerPrompt.includes('delete')) {
      const matchWord = lowerPrompt
        .replace(/(?:remove|delete)\s+(?:the\s+)?/i, '')
        .trim()
        .split(' ')[0]
      const targetIndex = nodes.findIndex((n) => {
        const label = (n.data?.label || n.label || '').toLowerCase()
        return label.includes(matchWord) || String(n.id).toLowerCase().includes(matchWord)
      })

      if (targetIndex >= 0) {
        const removedId = nodes[targetIndex].id
        const removedLabel = nodes[targetIndex].data?.label || removedId
        nodes.splice(targetIndex, 1)
        const updatedEdges = edges.filter((e) => e.source !== removedId && e.target !== removedId)
        return {
          nodes,
          edges: updatedEdges,
          summary: `[Demo Mode] Removed "${removedLabel}" from the architecture. Note: Configure MISTRAL_API_KEY in Convex ('npx convex env set MISTRAL_API_KEY <key>') for full LLM-driven generation.`,
        }
      }
    }

    let newLabel = 'New Service'
    let newShape = 'pill'
    let newColor = 'blue'
    let edgeLabel = 'Integrates'

    if (lowerPrompt.includes('redis') || lowerPrompt.includes('cache')) {
      newLabel = 'Redis Cache'
      newShape = 'cylinder'
      newColor = 'red'
      edgeLabel = 'Cache Read/Write'
    } else if (lowerPrompt.includes('auth') || lowerPrompt.includes('clerk') || lowerPrompt.includes('jwt')) {
      newLabel = 'Auth Service'
      newShape = 'pill'
      newColor = 'purple'
      edgeLabel = 'Validate Auth'
    } else if (
      lowerPrompt.includes('database') ||
      lowerPrompt.includes('postgres') ||
      lowerPrompt.includes('mongo') ||
      lowerPrompt.includes('db')
    ) {
      newLabel = 'Database'
      newShape = 'cylinder'
      newColor = 'green'
      edgeLabel = 'Persist Data'
    } else if (
      lowerPrompt.includes('queue') ||
      lowerPrompt.includes('kafka') ||
      lowerPrompt.includes('rabbitmq') ||
      lowerPrompt.includes('sqs')
    ) {
      newLabel = 'Message Queue (Kafka)'
      newShape = 'rectangle'
      newColor = 'orange'
      edgeLabel = 'Publish Events'
    } else if (
      lowerPrompt.includes('monitor') ||
      lowerPrompt.includes('prometheus') ||
      lowerPrompt.includes('datadog') ||
      lowerPrompt.includes('log')
    ) {
      newLabel = 'Monitoring & Logs'
      newShape = 'rectangle'
      newColor = 'red'
      edgeLabel = 'Telemetry'
    } else if (lowerPrompt.includes('worker') || lowerPrompt.includes('cron') || lowerPrompt.includes('job')) {
      newLabel = 'Background Worker'
      newShape = 'pill'
      newColor = 'orange'
      edgeLabel = 'Async Task'
    } else if (lowerPrompt.includes('cdn') || lowerPrompt.includes('cloudflare')) {
      newLabel = 'Edge CDN'
      newShape = 'hexagon'
      newColor = 'teal'
      edgeLabel = 'Edge Cache'
    } else {
      const extracted = cleanPrompt
        .replace(/^add\s+(?:a\s+|an\s+)?/i, '')
        .replace(/\s+(?:to|into)\s+.*$/i, '')
        .trim()
      newLabel = extracted ? extracted.charAt(0).toUpperCase() + extracted.slice(1) : 'Additional Service'
    }

    let maxX = 100
    let maxY = 100
    for (const n of nodes) {
      const x = n.position?.x ?? 100
      const y = n.position?.y ?? 100
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }

    const newNodeId = `node-added-${Date.now()}`
    const newNode = {
      id: newNodeId,
      type: 'canvasNode',
      position: { x: maxX + 260, y: Math.max(100, maxY - 80) },
      data: {
        label: newLabel,
        shape: newShape,
        color: newColor,
      },
    }

    const primaryNode =
      nodes.find((n) => {
        const label = (n.data?.label || '').toLowerCase()
        return label.includes('gateway') || label.includes('service') || label.includes('core')
      }) || nodes[nodes.length - 1]

    const newEdge = {
      id: `edge-added-${Date.now()}`,
      source: primaryNode.id,
      target: newNodeId,
      sourceHandle: 'right-source',
      targetHandle: 'left-target',
      type: 'canvasEdge',
      markerEnd: { type: 'arrowclosed' },
      data: { label: edgeLabel },
    }

    return {
      nodes: [...nodes, newNode],
      edges: [...edges, newEdge],
      summary: `[Demo Mode] Added "${newLabel}" and connected it to "${primaryNode.data?.label || primaryNode.id}". Note: Configure MISTRAL_API_KEY in Convex ('npx convex env set MISTRAL_API_KEY <key>') for full LLM-driven generation.`,
    }
  }

  if (
    lowerPrompt.includes('ai') ||
    lowerPrompt.includes('llm') ||
    lowerPrompt.includes('agent') ||
    lowerPrompt.includes('rag') ||
    lowerPrompt.includes('vector') ||
    lowerPrompt.includes('model')
  ) {
    return {
      nodes: [
        { id: 'client-ui', type: 'canvasNode', position: { x: 80, y: 180 }, data: { label: 'Web & Chat Interface', shape: 'rectangle', color: 'pink' } },
        { id: 'api-gw', type: 'canvasNode', position: { x: 340, y: 180 }, data: { label: 'API Gateway & Router', shape: 'diamond', color: 'blue' } },
        { id: 'agent-core', type: 'canvasNode', position: { x: 600, y: 180 }, data: { label: 'AI Orchestrator Agent', shape: 'pill', color: 'purple' } },
        { id: 'vector-db', type: 'canvasNode', position: { x: 860, y: 60 }, data: { label: 'Vector Store (pgvector)', shape: 'cylinder', color: 'green' } },
        { id: 'llm-provider', type: 'canvasNode', position: { x: 860, y: 280 }, data: { label: 'LLM Engine (Mistral)', shape: 'hexagon', color: 'purple' } },
        { id: 'cache-svc', type: 'canvasNode', position: { x: 600, y: 360 }, data: { label: 'Prompt & Context Cache', shape: 'cylinder', color: 'red' } },
        { id: 'eval-trace', type: 'canvasNode', position: { x: 1100, y: 180 }, data: { label: 'Observability & Evals', shape: 'rectangle', color: 'orange' } },
      ],
      edges: [
        { id: 'e1', source: 'client-ui', target: 'api-gw', sourceHandle: 'right-source', targetHandle: 'left-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'Prompt' } },
        { id: 'e2', source: 'api-gw', target: 'agent-core', sourceHandle: 'right-source', targetHandle: 'left-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'Inference' } },
        { id: 'e3', source: 'agent-core', target: 'vector-db', sourceHandle: 'top-source', targetHandle: 'left-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'Similarity Search' } },
        { id: 'e4', source: 'agent-core', target: 'llm-provider', sourceHandle: 'bottom-source', targetHandle: 'left-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'Chat Completion' } },
        { id: 'e5', source: 'agent-core', target: 'cache-svc', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'Session Cache' } },
        { id: 'e6', source: 'llm-provider', target: 'eval-trace', sourceHandle: 'right-source', targetHandle: 'left-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'Trace Spans' } },
      ],
      summary: `[Demo Mode] Generated AI & Agentic system architecture. Note: Configure MISTRAL_API_KEY in Convex ('npx convex env set MISTRAL_API_KEY <key>') for full LLM-driven generation.`,
    }
  }

  if (
    lowerPrompt.includes('shop') ||
    lowerPrompt.includes('ecommerce') ||
    lowerPrompt.includes('store') ||
    lowerPrompt.includes('order') ||
    lowerPrompt.includes('cart') ||
    lowerPrompt.includes('product') ||
    lowerPrompt.includes('retail') ||
    lowerPrompt.includes('payment')
  ) {
    return {
      nodes: [
        { id: 'client', type: 'canvasNode', position: { x: 380, y: 40 }, data: { label: 'Web & Mobile Clients', shape: 'rectangle', color: 'pink' } },
        { id: 'cdn', type: 'canvasNode', position: { x: 380, y: 160 }, data: { label: 'Cloudflare CDN / Edge', shape: 'hexagon', color: 'teal' } },
        { id: 'gateway', type: 'canvasNode', position: { x: 380, y: 280 }, data: { label: 'API Gateway', shape: 'diamond', color: 'blue' } },
        { id: 'auth-service', type: 'canvasNode', position: { x: 120, y: 420 }, data: { label: 'Auth Service', shape: 'pill', color: 'purple' } },
        { id: 'order-service', type: 'canvasNode', position: { x: 380, y: 420 }, data: { label: 'Order Service', shape: 'pill', color: 'green' } },
        { id: 'product-service', type: 'canvasNode', position: { x: 640, y: 420 }, data: { label: 'Product Service', shape: 'pill', color: 'blue' } },
        { id: 'auth-db', type: 'canvasNode', position: { x: 120, y: 560 }, data: { label: 'Auth DB (Postgres)', shape: 'cylinder', color: 'purple' } },
        { id: 'order-db', type: 'canvasNode', position: { x: 380, y: 560 }, data: { label: 'Order DB (Postgres)', shape: 'cylinder', color: 'green' } },
        { id: 'cache', type: 'canvasNode', position: { x: 640, y: 560 }, data: { label: 'Redis Cache', shape: 'cylinder', color: 'red' } },
        { id: 'event-bus', type: 'canvasNode', position: { x: 380, y: 700 }, data: { label: 'Event Bus (Kafka)', shape: 'rectangle', color: 'orange' } },
        { id: 'notification-svc', type: 'canvasNode', position: { x: 120, y: 700 }, data: { label: 'Notification Svc', shape: 'pill', color: 'pink' } },
        { id: 'analytics-svc', type: 'canvasNode', position: { x: 640, y: 700 }, data: { label: 'Analytics Engine', shape: 'pill', color: 'teal' } },
      ],
      edges: [
        { id: 'e1', source: 'client', target: 'cdn', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'HTTPS' } },
        { id: 'e2', source: 'cdn', target: 'gateway', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'Reverse Proxy' } },
        { id: 'e3', source: 'gateway', target: 'auth-service', sourceHandle: 'left-source', targetHandle: 'top-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'Validate' } },
        { id: 'e4', source: 'gateway', target: 'order-service', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'Orders API' } },
        { id: 'e5', source: 'gateway', target: 'product-service', sourceHandle: 'right-source', targetHandle: 'top-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'Catalog API' } },
        { id: 'e6', source: 'auth-service', target: 'auth-db', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'User Data' } },
        { id: 'e7', source: 'order-service', target: 'order-db', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'Transactions' } },
        { id: 'e8', source: 'product-service', target: 'cache', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'Read / Cache' } },
        { id: 'e9', source: 'order-service', target: 'event-bus', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'OrderPlaced' } },
        { id: 'e10', source: 'event-bus', target: 'notification-svc', sourceHandle: 'left-source', targetHandle: 'right-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'Subscribe' } },
        { id: 'e11', source: 'event-bus', target: 'analytics-svc', sourceHandle: 'right-source', targetHandle: 'left-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'Telemetry' } },
      ],
      summary: `[Demo Mode] Generated Microservices E-Commerce architecture. Note: Configure MISTRAL_API_KEY in Convex ('npx convex env set MISTRAL_API_KEY <key>') for full LLM-driven generation.`,
    }
  }

  if (
    lowerPrompt.includes('stream') ||
    lowerPrompt.includes('event') ||
    lowerPrompt.includes('kafka') ||
    lowerPrompt.includes('pipeline') ||
    lowerPrompt.includes('analytics') ||
    lowerPrompt.includes('telemetry')
  ) {
    return {
      nodes: [
        { id: 'producers', type: 'canvasNode', position: { x: 60, y: 180 }, data: { label: 'Event Producers', shape: 'circle', color: 'pink' } },
        { id: 'ingest-api', type: 'canvasNode', position: { x: 280, y: 180 }, data: { label: 'Ingestion Gateway', shape: 'pill', color: 'blue' } },
        { id: 'message-broker', type: 'canvasNode', position: { x: 520, y: 180 }, data: { label: 'Apache Kafka Cluster', shape: 'rectangle', color: 'orange' } },
        { id: 'stream-proc', type: 'canvasNode', position: { x: 780, y: 180 }, data: { label: 'Stream Processor (Flink)', shape: 'diamond', color: 'purple' } },
        { id: 'realtime-db', type: 'canvasNode', position: { x: 1040, y: 80 }, data: { label: 'Time Series DB (ClickHouse)', shape: 'cylinder', color: 'green' } },
        { id: 'data-lake', type: 'canvasNode', position: { x: 1040, y: 300 }, data: { label: 'Data Lake (S3 Storage)', shape: 'cylinder', color: 'teal' } },
        { id: 'dashboard', type: 'canvasNode', position: { x: 1280, y: 80 }, data: { label: 'Live Grafana Dashboard', shape: 'rectangle', color: 'pink' } },
        { id: 'bi-analytics', type: 'canvasNode', position: { x: 1280, y: 300 }, data: { label: 'BI & Batch Query Engine', shape: 'rectangle', color: 'blue' } },
      ],
      edges: [
        { id: 'ed1', source: 'producers', target: 'ingest-api', sourceHandle: 'right-source', targetHandle: 'left-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'Produce Events' } },
        { id: 'ed2', source: 'ingest-api', target: 'message-broker', sourceHandle: 'right-source', targetHandle: 'left-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'Write Topic' } },
        { id: 'ed3', source: 'message-broker', target: 'stream-proc', sourceHandle: 'right-source', targetHandle: 'left-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'Consume Stream' } },
        { id: 'ed4', source: 'stream-proc', target: 'realtime-db', sourceHandle: 'top-source', targetHandle: 'left-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'Aggregations' } },
        { id: 'ed5', source: 'stream-proc', target: 'data-lake', sourceHandle: 'bottom-source', targetHandle: 'left-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'Parquet Snapshots' } },
        { id: 'ed6', source: 'realtime-db', target: 'dashboard', sourceHandle: 'right-source', targetHandle: 'left-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'Live Telemetry' } },
        { id: 'ed7', source: 'data-lake', target: 'bi-analytics', sourceHandle: 'right-source', targetHandle: 'left-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'Batch Processing' } },
      ],
      summary: `[Demo Mode] Generated Event-Driven Streaming & Analytics architecture. Note: Configure MISTRAL_API_KEY in Convex ('npx convex env set MISTRAL_API_KEY <key>') for full LLM-driven generation.`,
    }
  }

  if (
    lowerPrompt.includes('serverless') ||
    lowerPrompt.includes('lambda') ||
    lowerPrompt.includes('vercel') ||
    lowerPrompt.includes('cloud') ||
    lowerPrompt.includes('saas')
  ) {
    return {
      nodes: [
        { id: 'users', type: 'canvasNode', position: { x: 60, y: 180 }, data: { label: 'Web & Mobile Clients', shape: 'circle', color: 'pink' } },
        { id: 'dns-cdn', type: 'canvasNode', position: { x: 280, y: 180 }, data: { label: 'Edge CDN & Firewall', shape: 'hexagon', color: 'purple' } },
        { id: 'frontend-host', type: 'canvasNode', position: { x: 520, y: 60 }, data: { label: 'Static Hosting & Edge', shape: 'rectangle', color: 'teal' } },
        { id: 'api-gw', type: 'canvasNode', position: { x: 520, y: 280 }, data: { label: 'API Gateway', shape: 'diamond', color: 'orange' } },
        { id: 'auth-provider', type: 'canvasNode', position: { x: 520, y: 440 }, data: { label: 'Auth Service (Clerk)', shape: 'diamond', color: 'pink' } },
        { id: 'serverless-compute', type: 'canvasNode', position: { x: 760, y: 280 }, data: { label: 'Serverless Handlers', shape: 'pill', color: 'green' } },
        { id: 'serverless-db', type: 'canvasNode', position: { x: 1000, y: 200 }, data: { label: 'Serverless Postgres (Neon)', shape: 'cylinder', color: 'red' } },
        { id: 'object-store', type: 'canvasNode', position: { x: 1000, y: 360 }, data: { label: 'Vercel Blob Storage', shape: 'cylinder', color: 'teal' } },
      ],
      edges: [
        { id: 's1', source: 'users', target: 'dns-cdn', sourceHandle: 'right-source', targetHandle: 'left-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'HTTPS' } },
        { id: 's2', source: 'dns-cdn', target: 'frontend-host', sourceHandle: 'top-source', targetHandle: 'left-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'Edge Cache' } },
        { id: 's3', source: 'dns-cdn', target: 'api-gw', sourceHandle: 'bottom-source', targetHandle: 'left-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'API Routes' } },
        { id: 's4', source: 'api-gw', target: 'auth-provider', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'Verify Session' } },
        { id: 's5', source: 'api-gw', target: 'serverless-compute', sourceHandle: 'right-source', targetHandle: 'left-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'Invoke Functions' } },
        { id: 's6', source: 'serverless-compute', target: 'serverless-db', sourceHandle: 'top-source', targetHandle: 'left-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'SQL Queries' } },
        { id: 's7', source: 'serverless-compute', target: 'object-store', sourceHandle: 'bottom-source', targetHandle: 'left-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'Store Assets' } },
      ],
      summary: `[Demo Mode] Generated Serverless Cloud Application architecture. Note: Configure MISTRAL_API_KEY in Convex ('npx convex env set MISTRAL_API_KEY <key>') for full LLM-driven generation.`,
    }
  }

  return {
    nodes: [
      { id: 'client-apps', type: 'canvasNode', position: { x: 360, y: 50 }, data: { label: 'Web & Client Apps', shape: 'rectangle', color: 'pink' } },
      { id: 'edge-cdn', type: 'canvasNode', position: { x: 360, y: 170 }, data: { label: 'Edge CDN & WAF', shape: 'hexagon', color: 'teal' } },
      { id: 'api-gateway', type: 'canvasNode', position: { x: 360, y: 290 }, data: { label: 'API Gateway', shape: 'diamond', color: 'blue' } },
      { id: 'auth-service', type: 'canvasNode', position: { x: 120, y: 430 }, data: { label: 'Identity & Auth Service', shape: 'pill', color: 'purple' } },
      { id: 'core-service', type: 'canvasNode', position: { x: 360, y: 430 }, data: { label: 'Core Business Service', shape: 'pill', color: 'green' } },
      { id: 'worker-service', type: 'canvasNode', position: { x: 600, y: 430 }, data: { label: 'Background Worker', shape: 'pill', color: 'orange' } },
      { id: 'auth-db', type: 'canvasNode', position: { x: 120, y: 570 }, data: { label: 'Auth Database', shape: 'cylinder', color: 'purple' } },
      { id: 'main-db', type: 'canvasNode', position: { x: 360, y: 570 }, data: { label: 'Primary Relational DB', shape: 'cylinder', color: 'green' } },
      { id: 'cache-store', type: 'canvasNode', position: { x: 600, y: 570 }, data: { label: 'In-Memory Cache (Redis)', shape: 'cylinder', color: 'red' } },
    ],
    edges: [
      { id: 'g1', source: 'client-apps', target: 'edge-cdn', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'HTTPS' } },
      { id: 'g2', source: 'edge-cdn', target: 'api-gateway', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'Proxy Request' } },
      { id: 'g3', source: 'api-gateway', target: 'auth-service', sourceHandle: 'left-source', targetHandle: 'top-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'Validate JWT' } },
      { id: 'g4', source: 'api-gateway', target: 'core-service', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'Route Traffic' } },
      { id: 'g5', source: 'api-gateway', target: 'worker-service', sourceHandle: 'right-source', targetHandle: 'top-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'Dispatch Job' } },
      { id: 'g6', source: 'auth-service', target: 'auth-db', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'Verify Credentials' } },
      { id: 'g7', source: 'core-service', target: 'main-db', sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'CRUD Operations' } },
      { id: 'g8', source: 'core-service', target: 'cache-store', sourceHandle: 'right-source', targetHandle: 'left-target', type: 'canvasEdge', markerEnd: { type: 'arrowclosed' }, data: { label: 'Query Cache' } },
    ],
    summary: `[Demo Mode] Generated system architecture based on "${cleanPrompt.length > 35 ? cleanPrompt.slice(0, 32) + '...' : cleanPrompt}". Note: Configure MISTRAL_API_KEY in Convex ('npx convex env set MISTRAL_API_KEY <key>') for full LLM-driven generation.`,
  }
}

function generateOfflineSpecMarkdown(nodes: any[], edges: any[]): string {
  const primaryService = nodes.find((n) => n.data?.color === 'purple' || n.data?.color === 'blue')
  const systemTitle = primaryService?.data?.label
    ? `${primaryService.data.label} Architecture`
    : 'Distributed System Architecture'

  return `# ${systemTitle} Specification

## 1. Executive Overview
This document specifies the technical architecture for the **${systemTitle}**. The system comprises **${nodes.length} structural components** interconnected via **${edges.length} communication channels**. It is designed for horizontal scalability, fault tolerance, low latency, and secure zero-trust operational boundaries.

## 2. System Components & Topology
The architecture consists of the following key nodes:

| Component | Shape / Role | Classification | Technology Stack Recommendations |
| :--- | :--- | :--- | :--- |
${nodes.map((n) => `| **${n.data?.label || n.label || 'Component'}** | ${n.data?.shape || 'Service'} | ${n.data?.color || 'General'} | Modern cloud-native container / microservice |`).join('\n')}

### Component Responsibilities:
${nodes.map((n) => `- **${n.data?.label || n.label || 'Component'}**: Responsible for core domain execution, isolated data validation, and bounded lifecycle management within the topology.`).join('\n')}

## 3. Data Flow & Communication Patterns
Inter-service communication is structured along directed event channels and remote procedure calls:

| Source | Target | Channel Label | Interaction Pattern |
| :--- | :--- | :--- | :--- |
${edges
  .map((e) => {
    const srcNode = nodes.find((n) => n.id === e.source)
    const tgtNode = nodes.find((n) => n.id === e.target)
    const srcName = srcNode?.data?.label || e.source
    const tgtName = tgtNode?.data?.label || e.target
    const label = e.data?.label || e.label || 'Data Transfer'
    return `| ${srcName} | ${tgtName} | ${label} | Asynchronous / REST / gRPC |`
  })
  .join('\n')}

## 4. Security & Access Boundaries
1. **Authentication & Authorization**: Identity tokens (JWT / OIDC) are validated at ingress gateways before requests are forwarded to internal microservices.
2. **Transport Encryption**: All transit traffic enforces TLS 1.3 encryption. Internal microservice mesh communications use mutual TLS (mTLS).
3. **Data Protection at Rest**: Persistent stores and cache layers enforce AES-256 encryption with automated key rotation.
4. **Least Privilege**: Role-based access control (RBAC) is enforced across all internal interfaces and administrative endpoints.

## 5. Non-Functional Requirements & Scalability
- **Availability Target**: 99.99% uptime through multi-AZ redundant deployments and automated health probing.
- **Latency SLAs**: P95 response times under 150ms for synchronous queries; background event ingestion under 50ms.
- **Auto-Scaling**: Horizontal Pod Autoscaling (HPA) triggers on CPU > 70% or queue depth thresholds.
- **Disaster Recovery**: Automated multi-region database backups with RPO < 5 minutes and RTO < 15 minutes.

## 6. Observability & Monitoring
- **Distributed Tracing**: OpenTelemetry spans propagated across all HTTP and event boundaries.
- **Metrics Collection**: Prometheus scraper targeting /metrics endpoints, surfaced through centralized Grafana dashboards.
- **Structured Logging**: JSON-formatted logs with unified trace IDs ingested into centralized log indexing.
`
}

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

  const payload: {
    model: string
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
    temperature: number
    response_format?: { type: 'json_object' }
  } = {
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

export const generateDesign = action({
  args: {
    projectId: v.id('projects'),
    prompt: v.string(),
    currentNodes: v.optional(v.array(v.any())),
    currentEdges: v.optional(v.array(v.any())),
    history: v.optional(
      v.array(
        v.object({
          role: v.union(v.literal('user'), v.literal('assistant')),
          content: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const cleanPrompt = args.prompt.trim()
    if (!cleanPrompt) {
      throw new ConvexError('Prompt cannot be empty')
    }

    const access = await ctx.runQuery(internal.projects.verifyMemberAccess, {
      projectId: args.projectId,
    })
    if (!access.ok) {
      throw new ConvexError(access.error)
    }

    const taskRunId: Id<'taskRuns'> = await ctx.runMutation(internal.taskRuns.insertTaskRun, {
      projectId: args.projectId,
      type: 'design',
      prompt: cleanPrompt,
    })

    try {
      await ctx.runMutation(internal.taskRuns.patchTaskRun, {
        taskRunId,
        status: 'running',
      })

      const hasExistingNodes = Array.isArray(args.currentNodes) && args.currentNodes.length > 0
      let nodes: any[] = []
      let edges: any[] = []
      let summary = ''

      if (!process.env.MISTRAL_API_KEY) {
        const offlineResult = generateOfflineArchitecture(
          cleanPrompt,
          args.currentNodes,
          args.currentEdges
        )
        nodes = offlineResult.nodes
        edges = offlineResult.edges
        summary = offlineResult.summary
      } else {
        const systemPrompt = hasExistingNodes ? REFINEMENT_SYSTEM_PROMPT : DESIGN_SYSTEM_PROMPT

        const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
          {
            role: 'system',
            content: systemPrompt,
          },
        ]

        if (hasExistingNodes) {
          const existingGraphText = serializeGraphForRefinement(
            args.currentNodes!,
            args.currentEdges || []
          )
          messages.push({
            role: 'user',
            content: `Current Canvas Architecture:\n${existingGraphText}`,
          })
          messages.push({
            role: 'assistant',
            content:
              'I understand the current system design and will refine, extend, or modify it according to your instructions while preserving unchanged components.',
          })
        }

        if (args.history && args.history.length > 0) {
          for (const msg of args.history.slice(-6)) {
            if (msg.content && msg.content.trim()) {
              messages.push({
                role: msg.role,
                content: msg.content.trim(),
              })
            }
          }
        }

        messages.push({
          role: 'user',
          content: cleanPrompt,
        })

        const text = await callMistralChat({
          model: 'mistral-small-latest',
          responseFormat: { type: 'json_object' },
          messages,
          temperature: 0.7,
        })

        let jsonText = text
        if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
        }

        const parsed = JSON.parse(jsonText)

        if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
          throw new Error('AI response missing nodes array')
        }
        if (!parsed.edges || !Array.isArray(parsed.edges)) {
          throw new Error('AI response missing edges array')
        }

        summary =
          parsed.summary ||
          (hasExistingNodes ? 'Updated canvas architecture' : 'Generated initial system architecture')

        nodes = parsed.nodes.map((node: any, index: number) => ({
          id: node.id || `node-${index}-${Date.now()}`,
          type: 'canvasNode',
          position: node.position || {
            x: 100 + (index % 4) * 300,
            y: 100 + Math.floor(index / 4) * 200,
          },
          data: {
            label: node.label || 'Untitled',
            shape: VALID_SHAPES.has(node.shape) ? node.shape : 'rectangle',
            color: VALID_COLORS.has(node.color) ? node.color : 'default',
          },
        }))

        edges = parsed.edges.map((edge: any, index: number) => ({
          id: edge.id || `edge-${index}-${Date.now()}`,
          source: edge.source,
          target: edge.target,
          sourceHandle: normalizeHandle(edge.sourceHandle, 'source'),
          targetHandle: normalizeHandle(edge.targetHandle, 'target'),
          type: 'canvasEdge',
          markerEnd: { type: 'arrowclosed' },
          data: {
            label: edge.label || '',
          },
        }))
      }

      await ctx.runMutation(internal.taskRuns.patchTaskRun, {
        taskRunId,
        status: 'completed',
        result: { nodes, edges, summary },
      })

      return { taskRunId, nodes, edges, summary }
    } catch (error: any) {
      await ctx.runMutation(internal.taskRuns.patchTaskRun, {
        taskRunId,
        status: 'failed',
        error: error?.message || 'Unknown error during design generation',
      })
      throw error
    }
  },
})

function serializeGraphForRefinement(nodes: any[], edges: any[]): string {
  const simplifiedNodes = nodes.map((n: any) => ({
    id: n.id,
    label: n.data?.label || n.label || 'Untitled',
    shape: n.data?.shape || 'rectangle',
    color: n.data?.color || 'default',
    position: {
      x: Math.round(n.position?.x ?? 0),
      y: Math.round(n.position?.y ?? 0),
    },
  }))

  const simplifiedEdges = edges.map((e: any) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle || 'bottom-source',
    targetHandle: e.targetHandle || 'top-target',
    label: e.data?.label || e.label || '',
  }))

  return JSON.stringify({ nodes: simplifiedNodes, edges: simplifiedEdges }, null, 2)
}

export const generateSpec = action({
  args: {
    projectId: v.id('projects'),
    nodes: v.array(v.any()),
    edges: v.array(v.any()),
    siteUrl: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.nodes || args.nodes.length === 0) {
      throw new ConvexError('Canvas must contain at least one node to generate a specification')
    }

    const access = await ctx.runQuery(internal.projects.verifyMemberAccess, {
      projectId: args.projectId,
    })
    if (!access.ok) {
      throw new ConvexError(access.error)
    }

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

      let markdown = ''
      if (!process.env.MISTRAL_API_KEY) {
        markdown = generateOfflineSpecMarkdown(args.nodes, args.edges)
      } else {
        const graphDescription = serializeGraphForLLM(args.nodes, args.edges)

        markdown = await callMistralChat({
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
      }

      const specId = `spec-${Date.now()}`
      const title = extractSpecTitle(markdown)

      let blobUrl = `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`

      try {
        if (
          args.siteUrl &&
          !args.siteUrl.includes('localhost') &&
          !args.siteUrl.includes('127.0.0.1')
        ) {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' }
          if (process.env.CONVEX_INTERNAL_SECRET) {
            headers['x-internal-secret'] = process.env.CONVEX_INTERNAL_SECRET
          }

          const uploadResponse = await fetch(`${args.siteUrl}/api/specs/upload`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              projectId: args.projectId,
              specId,
              content: markdown,
            }),
          })

          if (uploadResponse.ok) {
            const { blobUrl: uploadedUrl } = await uploadResponse.json()
            if (uploadedUrl) {
              blobUrl = uploadedUrl
            }
          }
        }
      } catch (uploadErr) {
        console.warn('Spec upload to siteUrl failed, using data URI fallback:', uploadErr)
      }

      const specDocId: Id<'specs'> = await ctx.runMutation(internal.taskRuns.insertSpec, {
        projectId: args.projectId,
        taskRunId,
        title,
        filePath: blobUrl,
      })

      await ctx.runMutation(internal.taskRuns.patchTaskRun, {
        taskRunId,
        status: 'completed',
        result: { specId: specDocId, clientSpecId: specId, title, filePath: blobUrl, markdown },
      })

      return { taskRunId, specId: specDocId, title, filePath: blobUrl, markdown }
    } catch (error: any) {
      await ctx.runMutation(internal.taskRuns.patchTaskRun, {
        taskRunId,
        status: 'failed',
        error: error?.message || 'Unknown error during spec generation',
      })
      throw error
    }
  },
})

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

function extractSpecTitle(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m)
  if (match) return match[1].trim()
  return 'System Architecture Specification'
}
