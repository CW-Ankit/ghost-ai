'use client'

import PixelCard from '@/components/pixel-card'
import {
  AiSpark3DIcon,
  Canvas3DIcon,
  Share3DIcon,
  Specs3DIcon,
  Templates3DIcon,
} from '@/components/landing/bento-3d-icons'

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

const ICON_SOCKET_CLASS =
  'inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[linear-gradient(180deg,#2a2a33_0%,#16161c_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),inset_0_0_0_1px_rgba(255,255,255,0.08),0_8px_18px_-6px_rgba(0,0,0,0.85)] transition-transform duration-300 group-hover:-translate-y-0.5'

const ASSET_WELL_CLASS =
  'pointer-events-none relative my-5 flex-1 overflow-hidden rounded-2xl bg-[linear-gradient(180deg,rgba(8,8,9,0.52)_0%,rgba(17,17,20,0.28)_100%)] shadow-[inset_0_2px_10px_rgba(0,0,0,0.68),inset_0_0_0_1px_rgba(255,255,255,0.04)]'

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
          {/* Card 1: Real-Time Multiplayer Canvas */}
          <PixelCard
            {...SHARED_PIXEL_PROPS}
            colors={CYAN_PIXELS}
            glowColor="var(--accent-primary)"
            shape="square"
            introDelay={0}
            className="h-full min-h-[340px] w-full md:col-span-4"
          >
            <div className="relative flex h-full w-full flex-col justify-between p-6 sm:p-8">
              <div className={ICON_SOCKET_CLASS}>
                <Canvas3DIcon className="h-8 w-8" />
              </div>

              <div aria-hidden="true" className={ASSET_WELL_CLASS}>
                <div className="absolute inset-0 bg-[radial-gradient(60%_70%_at_50%_50%,color-mix(in_srgb,var(--accent-primary)_16%,transparent)_0%,transparent_75%)] blur-2xl" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-heading text-lg font-semibold text-text-primary">
                  Real-Time Multiplayer Canvas
                </h3>
                <p className="max-w-lg text-sm leading-relaxed text-text-secondary">
                  Liveblocks CRDT state sync, live collaborator cursors, 6 custom node shapes,
                  orthogonal edge routing, and viewport-culled 100+ node performance.
                </p>
              </div>
            </div>
          </PixelCard>

          {/* Card 2: Starter System Templates */}
          <PixelCard
            {...SHARED_PIXEL_PROPS}
            colors={EMERALD_PIXELS}
            glowColor="var(--state-success)"
            shape="circle"
            introDelay={90}
            className="h-full min-h-[340px] w-full md:col-span-2"
          >
            <div className="relative flex h-full w-full flex-col justify-between p-6 sm:p-8">
              <div className={ICON_SOCKET_CLASS}>
                <Templates3DIcon className="h-8 w-8" />
              </div>

              <div aria-hidden="true" className={ASSET_WELL_CLASS}>
                <div className="absolute inset-0 bg-[radial-gradient(65%_70%_at_50%_50%,color-mix(in_srgb,var(--state-success)_14%,transparent)_0%,transparent_75%)] blur-2xl" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-heading text-lg font-semibold text-text-primary">
                  Starter System Templates
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  Drop prebuilt microservices, event-driven, serverless, and CI/CD blueprints
                  directly into active rooms.
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
            className="h-full min-h-[320px] w-full md:col-span-2"
          >
            <div className="relative flex h-full w-full flex-col justify-between p-6 sm:p-8">
              <div className={ICON_SOCKET_CLASS}>
                <AiSpark3DIcon className="h-8 w-8" />
              </div>

              <div aria-hidden="true" className={ASSET_WELL_CLASS}>
                <div className="absolute inset-0 bg-[radial-gradient(65%_70%_at_50%_50%,color-mix(in_srgb,var(--accent-ai)_18%,transparent)_0%,transparent_75%)] blur-2xl" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-heading text-lg font-semibold text-text-primary">
                  AI Synthesis &amp; Diffs
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  Generate and refine architectures from plain English while preserving existing IDs
                  and highlighting changed nodes.
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
            className="h-full min-h-[320px] w-full md:col-span-2"
          >
            <div className="relative flex h-full w-full flex-col justify-between p-6 sm:p-8">
              <div className={ICON_SOCKET_CLASS}>
                <Specs3DIcon className="h-8 w-8" />
              </div>

              <div aria-hidden="true" className={ASSET_WELL_CLASS}>
                <div className="absolute inset-0 bg-[radial-gradient(65%_70%_at_50%_50%,color-mix(in_srgb,var(--accent-primary)_16%,transparent)_0%,transparent_75%)] blur-2xl" />
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
            className="h-full min-h-[320px] w-full md:col-span-2"
          >
            <div className="relative flex h-full w-full flex-col justify-between p-6 sm:p-8">
              <div className={ICON_SOCKET_CLASS}>
                <Share3DIcon className="h-8 w-8" />
              </div>

              <div aria-hidden="true" className={ASSET_WELL_CLASS}>
                <div className="absolute inset-0 bg-[radial-gradient(65%_70%_at_50%_50%,color-mix(in_srgb,var(--state-success)_14%,transparent)_0%,transparent_75%)] blur-2xl" />
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
