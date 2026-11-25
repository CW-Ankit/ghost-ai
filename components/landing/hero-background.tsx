'use client'

import { useState } from 'react'
import { Pause, Play } from 'lucide-react'
import GhostFibers from '@/components/ghost-fibers'
import { Button } from '@/components/ui/button'

export function HeroBackground() {
  const [paused, setPaused] = useState(false)

  return (
    <>
      <div className="absolute inset-0 z-0 h-full w-full overflow-hidden">
        <GhostFibers
          glowColor="var(--accent-primary)"
          lineColor="var(--text-primary)"
          secondaryColor="var(--accent-ai)"
          gradient="along"
          layers={3}
          scale={0.76}
          spread={0.85}
          twist={1.2}
          threads={72}
          fiberStyle="lines"
          depthOfField={1.1}
          hoverEffect="focus"
          intro={true}
          mouseInteraction={true}
          volume={0.6}
          perspective={0.55}
          tips={1}
          foldGlow={0.55}
          speed={0.7}
          flow={0.25}
          sparkle={0.3}
          brightness={0.7}
          vignette={0.65}
          paused={paused}
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setPaused((prev) => !prev)}
        aria-label={paused ? 'Play background animation' : 'Pause background animation'}
        className="fixed top-5 right-5 z-40 h-9 w-9 rounded-full border border-border-default bg-bg-surface/70 text-text-muted backdrop-blur-md hover:border-border-subtle hover:bg-bg-elevated hover:text-text-primary"
      >
        {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
      </Button>
    </>
  )
}
