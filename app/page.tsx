import { auth } from '@clerk/nextjs/server'
import { HeroBackground } from '@/components/landing/hero-background'
import { LandingNav } from '@/components/landing/landing-nav'

export default async function Home() {
  const { userId } = await auth()

  return (
    <main
      id="hero"
      className="relative flex h-dvh w-full max-w-full items-center justify-center overflow-hidden bg-bg-base px-6 pb-24"
    >
      <HeroBackground />
      <h1 className="pointer-events-none relative z-10 select-none font-heading text-6xl font-bold tracking-tight text-text-primary drop-shadow-[0_4px_24px_rgba(8,8,9,0.85)] sm:text-7xl md:text-8xl">
        Ghost AI
      </h1>
      <LandingNav initialSignedIn={Boolean(userId)} />
    </main>
  )
}
