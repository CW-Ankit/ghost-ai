import { LandingNav } from '@/components/landing/landing-nav'

export default function Home() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center bg-bg-base px-6 pb-24">
      <h1 className="font-heading text-6xl font-bold tracking-tight text-text-primary sm:text-7xl md:text-8xl">
        Ghost AI
      </h1>
      <LandingNav />
    </main>
  )
}
