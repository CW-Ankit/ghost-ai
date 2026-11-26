'use client'

import {
  FileText,
  GitCompareArrows,
  Globe,
  Layers,
  MousePointerClick,
  Sparkles,
  Workflow,
} from 'lucide-react'
import PixelCard from '@/components/pixel-card'

const CYAN_PIXELS = ['var(--text-primary)', 'var(--accent-primary)', 'var(--accent-ai-text)']
const AI_PIXELS = ['var(--text-primary)', 'var(--accent-ai-text)', 'var(--accent-ai)']
const EMERALD_PIXELS = ['var(--text-primary)', 'var(--state-success)', 'var(--accent-primary)']

const SHARED_PIXEL_PROPS = {
  origin: 'pointer' as const,
  gap: 10,
  pixelSize: 1.8,
  speed: 25,
  revealDuration: 600,
  spotlight: 0.7,
  glow: 0.5,
  opacity: 0.35,
  fade: 0.7,
  trigger: 'hover' as const,
  radius: 24,
  clickPulse: true,
  intro: true,
  theme: 'dark' as const,
}

export function FeaturesBento() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-12 px-6 pt-24 pb-16">
      {/* Canvas & Workspace Section */}
      <section id="canvas" tabIndex={-1} className="space-y-8 outline-none">
        <div className="max-w-2xl space-y-3">
          <p className="font-mono text-xs font-medium tracking-[0.14em] text-accent-primary uppercase">
            Collaborative Architecture Workspace
          </p>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            Design distributed systems together, in real time.
          </h2>
          <p className="text-sm leading-relaxed text-text-secondary sm:text-base">
            From natural-language prompts to multi-user graph editing and export-ready technical
            specs, every stage lives on one unified canvas.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          {/* Card 1: Real-Time Multiplayer Canvas (Wide) */}
          <PixelCard
            {...SHARED_PIXEL_PROPS}
            colors={CYAN_PIXELS}
            glowColor="var(--accent-primary)"
            shape="square"
            introDelay={0}
            className="h-full min-h-[300px] w-full md:col-span-4"
          >
            <div className="flex h-full w-full flex-col justify-between gap-6 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-default bg-bg-base/70 text-accent-primary">
                  <MousePointerClick className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-accent-primary/30 bg-accent-primary-dim px-2.5 py-1 font-mono text-[11px] font-medium text-accent-primary">
                  Live
                </span>
              </div>

              {/* Architectural Mini-Graph Preview */}
              <div className="grid grid-cols-3 items-center gap-2 rounded-2xl border border-border-default/80 bg-bg-base/70 p-3.5 backdrop-blur-sm sm:gap-3 sm:p-4">
                <div className="rounded-xl border border-border-subtle bg-bg-surface px-3 py-2">
                  <div className="font-mono text-[10px] text-text-muted">GATEWAY</div>
                  <div className="truncate text-xs font-medium text-text-primary">Edge Router</div>
                </div>
                <div className="relative flex items-center justify-center">
                  <div className="h-px w-full bg-border-subtle" />
                  <span className="absolute rounded-full border border-accent-primary/40 bg-bg-elevated px-2 py-0.5 font-mono text-[10px] text-accent-primary">
                    gRPC
                  </span>
                </div>
                <div className="rounded-xl border border-accent-ai/40 bg-bg-surface px-3 py-2">
                  <div className="font-mono text-[10px] text-accent-ai-text">WORKER</div>
                  <div className="truncate text-xs font-medium text-text-primary">AI Engine</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="font-heading text-lg font-semibold text-text-primary">
                  Real-Time Multiplayer Canvas
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  Liveblocks CRDT state sync, live collaborator cursors, 6 custom node shapes,
                  orthogonal edge routing, and viewport-culled 100+ node performance.
                </p>
              </div>
            </div>
          </PixelCard>

          {/* Card 2: Starter System Blueprints */}
          <PixelCard
            {...SHARED_PIXEL_PROPS}
            colors={EMERALD_PIXELS}
            glowColor="var(--state-success)"
            shape="circle"
            introDelay={90}
            className="h-full min-h-[300px] w-full md:col-span-2"
          >
            <div className="flex h-full w-full flex-col justify-between gap-6 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-default bg-bg-base/70 text-state-success">
                  <Layers className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-border-default bg-bg-base/70 px-2.5 py-1 font-mono text-[11px] text-text-secondary">
                  4 Blueprints
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {['Microservices', 'Event-Driven', 'Serverless', 'CI/CD'].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg border border-border-default bg-bg-base/75 px-2.5 py-1 font-mono text-[11px] text-text-secondary"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="space-y-1.5">
                <h3 className="font-heading text-lg font-semibold text-text-primary">
                  Starter System Templates
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  Drop prebuilt production topologies directly into active rooms with instant
                  auto-fit and full editability.
                </p>
              </div>
            </div>
          </PixelCard>
        </div>
      </section>

      {/* AI Architect, Specs & Sharing Section */}
      <section id="specs" tabIndex={-1} className="outline-none">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          {/* Card 3: AI Synthesis & Visual Diffs */}
          <PixelCard
            {...SHARED_PIXEL_PROPS}
            colors={AI_PIXELS}
            glowColor="var(--accent-ai)"
            shape="diamond"
            introDelay={160}
            className="h-full min-h-[280px] w-full md:col-span-2"
          >
            <div className="flex h-full w-full flex-col justify-between gap-6 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-default bg-bg-base/70 text-accent-ai-text">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[10px]">
                  <span className="rounded-full border border-accent-primary/40 bg-accent-primary-dim px-2 py-0.5 text-accent-primary">
                    + New
                  </span>
                  <span className="rounded-full border border-accent-ai/40 bg-accent-ai/15 px-2 py-0.5 text-accent-ai-text">
                    Updated
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-border-default bg-bg-base/75 px-3 py-2.5 font-mono text-[11px] text-text-secondary">
                &ldquo;Add Redis rate-limiting in front of the checkout service&rdquo;
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <GitCompareArrows className="h-4 w-4 text-accent-ai-text" />
                  <h3 className="font-heading text-lg font-semibold text-text-primary">
                    AI Synthesis &amp; Diffs
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-text-secondary">
                  Generate and refine architectures in place while preserving existing IDs and
                  highlighting changed nodes.
                </p>
              </div>
            </div>
          </PixelCard>

          {/* Card 4: Technical Specs & Multi-Format Export */}
          <PixelCard
            {...SHARED_PIXEL_PROPS}
            colors={CYAN_PIXELS}
            glowColor="var(--accent-primary)"
            shape="square"
            introDelay={220}
            className="h-full min-h-[280px] w-full md:col-span-2"
          >
            <div className="flex h-full w-full flex-col justify-between gap-6 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-default bg-bg-base/70 text-accent-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-accent-ai/35 bg-accent-ai/15 px-2.5 py-1 font-mono text-[11px] text-accent-ai-text">
                  PNG/SVG Soon
                </span>
              </div>

              <div className="space-y-1.5 rounded-xl border border-border-default bg-bg-base/75 p-3 font-mono text-[11px]">
                <div className="text-accent-primary"># Architecture Spec</div>
                <div className="text-text-muted">## 1. Component Topology</div>
                <div className="text-text-muted">## 2. Data Flows &amp; Security</div>
              </div>

              <div className="space-y-1.5">
                <h3 className="font-heading text-lg font-semibold text-text-primary">
                  Technical Specs &amp; Export
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  Compile any canvas graph into Markdown specs and A4 PDFs, with vector PNG/SVG
                  diagram export arriving next.
                </p>
              </div>
            </div>
          </PixelCard>

          {/* Card 5: Public Share Links & Autosave */}
          <PixelCard
            {...SHARED_PIXEL_PROPS}
            colors={EMERALD_PIXELS}
            glowColor="var(--state-success)"
            shape="circle"
            introDelay={280}
            className="h-full min-h-[280px] w-full md:col-span-2"
          >
            <div className="flex h-full w-full flex-col justify-between gap-6 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-default bg-bg-base/70 text-state-success">
                  <Globe className="h-5 w-5" />
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-state-success/30 bg-state-success/10 px-2.5 py-1 font-mono text-[11px] text-state-success">
                  <Workflow className="h-3 w-3" />
                  Synced
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border-default bg-bg-base/75 px-3 py-2.5 font-mono text-[11px] text-text-secondary">
                <span className="truncate">/editor/room-8f2a</span>
                <span className="ml-2 shrink-0 text-state-success">VIEW_ONLY</span>
              </div>

              <div className="space-y-1.5">
                <h3 className="font-heading text-lg font-semibold text-text-primary">
                  Public Links &amp; Autosave
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  Share protocol-enforced read-only links backed by 2.5s debounced Vercel Blob
                  snapshots and instant recovery.
                </p>
              </div>
            </div>
          </PixelCard>
        </div>
      </section>
    </div>
  )
}
