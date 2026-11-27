import Image from 'next/image'
import { cn } from '@/lib/utils'

interface TechLogo {
  name: string
  src: string
}

const LOGOS: TechLogo[] = [
  { name: 'Next.js', src: '/logos/nextjs.svg' },
  { name: 'TypeScript', src: '/logos/typescript.svg' },
  { name: 'Tailwind CSS', src: '/logos/tailwindcss.svg' },
  { name: 'React Flow', src: '/logos/reactflow.svg' },
  { name: 'Convex', src: '/logos/convex.svg' },
  { name: 'Clerk', src: '/logos/clerk.svg' },
  { name: 'Liveblocks', src: '/logos/liveblocks.svg' },
  { name: 'Mistral AI', src: '/logos/mistral.svg' },
  { name: 'Vercel', src: '/logos/vercel.svg' },
]

function LogoTrack({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul
      aria-hidden={hidden || undefined}
      className={cn(
        'flex shrink-0 items-center gap-12 pr-12 sm:gap-16 sm:pr-16',
        hidden
          ? 'motion-reduce:hidden'
          : 'motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:pr-0'
      )}
    >
      {LOGOS.map((logo) => (
        <li key={logo.name} className="flex shrink-0 items-center justify-center">
          <Image
            src={logo.src}
            alt={hidden ? '' : logo.name}
            width={32}
            height={32}
            unoptimized
            className="h-7 w-auto select-none object-contain opacity-70 grayscale-[20%] transition duration-200 hover:scale-105 hover:opacity-100 hover:grayscale-0 sm:h-8"
          />
        </li>
      ))}
    </ul>
  )
}

export function BuiltWithMarquee() {
  return (
    <section
      aria-label="Built with technologies"
      className="mx-auto w-full max-w-6xl px-6 py-8 sm:py-10"
    >
      <div className="marquee-viewport relative w-full overflow-hidden py-3">
        <div className="marquee-track flex w-max items-center">
          <LogoTrack />
          <LogoTrack hidden />
        </div>
      </div>
    </section>
  )
}
