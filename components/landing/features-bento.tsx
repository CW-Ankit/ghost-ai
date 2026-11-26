'use client'

import { FileText, Layers, MousePointerClick, Share2, WandSparkles } from 'lucide-react'
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

const ICON_SOCKET_CLASS =
  'inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(180deg,#2a2a33_0%,#16161c_100%)] text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.16),inset_0_0_0_1px_rgba(255,255,255,0.08),0_8px_18px_-6px_rgba(0,0,0,0.85)] transition-transform duration-300 group-hover:-translate-y-0.5'

const ASSET_WELL_CLASS =
  'pointer-events-none relative my-5 flex-1 overflow-hidden rounded-2xl bg-[linear-gradient(180deg,rgba(8,8,9,0.52)_0%,rgba(17,17,20,0.28)_100%)] shadow-[inset_0_2px_10px_rgba(0,0,0,0.68),inset_0_0_0_1px_rgba(255,255,255,0.04)]'

export function FeaturesBento() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-12 px-6 pt-24 pb-16">
      {/* Canvas & Workspace Section */}
      <div className="space-y-8">
        <div id="overview" tabIndex={-1} className="max-w-2xl scroll-mt-8 space-y-3 outline-none">
          <p className="font-mono text-xs font-medium tracking-[0.14em] text-accent-primary uppercase">
            Workspace
          </p>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            From idea to architecture in seconds.
          </h2>
          <p className="text-sm leading-relaxed text-text-secondary sm:text-base">
            Sketch systems together on a live canvas, refine with AI, and ship clear technical
            specs.
          </p>
        </div>

        <section
          id="canvas"
          tabIndex={-1}
          className="grid scroll-mt-8 grid-cols-1 gap-4 outline-none md:grid-cols-6"
        >
          {/* Card 1: Multiplayer Canvas */}
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
                <MousePointerClick className="h-5 w-5" />
              </div>

              <div aria-hidden="true" className={ASSET_WELL_CLASS}>
                <div className="absolute inset-0 bg-[radial-gradient(60%_70%_at_50%_50%,color-mix(in_srgb,var(--accent-primary)_16%,transparent)_0%,transparent_75%)] blur-2xl" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-heading text-lg font-semibold text-text-primary">
                  Multiplayer Canvas
                </h3>
                <p className="max-w-md text-sm leading-relaxed text-text-secondary">
                  Collaborate live with shared cursors, custom shapes, and effortless edge routing.
                </p>
              </div>
            </div>
          </PixelCard>

          {/* Card 2: Starter Blueprints */}
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
                <Layers className="h-5 w-5" />
              </div>

              <div aria-hidden="true" className={ASSET_WELL_CLASS}>
                <div className="absolute inset-0 bg-[radial-gradient(65%_70%_at_50%_50%,color-mix(in_srgb,var(--state-success)_14%,transparent)_0%,transparent_75%)] blur-2xl" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-heading text-lg font-semibold text-text-primary">
                  Starter Blueprints
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  Start faster with ready-made patterns for microservices, serverless, and
                  pipelines.
                </p>
              </div>
            </div>
          </PixelCard>
        </section>
      </div>

      {/* AI Architect, Specs & Sharing Section */}
      <section id="specs" tabIndex={-1} className="scroll-mt-8 outline-none">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          {/* Card 3: AI Architect */}
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
                <WandSparkles className="h-5 w-5" />
              </div>

              <div aria-hidden="true" className={ASSET_WELL_CLASS}>
                <div className="absolute inset-0 bg-[radial-gradient(65%_70%_at_50%_50%,color-mix(in_srgb,var(--accent-ai)_18%,transparent)_0%,transparent_75%)] blur-2xl" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-heading text-lg font-semibold text-text-primary">
                  AI Architect
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  Generate and evolve diagrams in plain English with instant visual diffs.
                </p>
              </div>
            </div>
          </PixelCard>

          {/* Card 4: Instant Specs */}
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
                <FileText className="h-5 w-5" />
              </div>

              <div aria-hidden="true" className={ASSET_WELL_CLASS}>
                <div className="absolute inset-0 bg-[radial-gradient(65%_70%_at_50%_50%,color-mix(in_srgb,var(--accent-primary)_16%,transparent)_0%,transparent_75%)] blur-2xl" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-heading text-lg font-semibold text-text-primary">
                  Instant Specs
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  Turn any architecture graph into clean Markdown documentation and PDFs.
                </p>
              </div>
            </div>
          </PixelCard>

          {/* Card 5: Share & Recover */}
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
                <Share2 className="h-5 w-5" />
              </div>

              <div aria-hidden="true" className={ASSET_WELL_CLASS}>
                <div className="absolute inset-0 bg-[radial-gradient(65%_70%_at_50%_50%,color-mix(in_srgb,var(--state-success)_14%,transparent)_0%,transparent_75%)] blur-2xl" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-heading text-lg font-semibold text-text-primary">
                  Share &amp; Recover
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  Publish read-only architecture links with continuous cloud autosave.
                </p>
              </div>
            </div>
          </PixelCard>
        </div>
      </section>
    </div>
  )
}
