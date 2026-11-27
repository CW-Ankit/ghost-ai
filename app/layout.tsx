import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { shadcn } from '@clerk/ui/themes'
import ConvexClientProvider from '@/components/convex-client-provider'
import { CustomCursor } from '@/components/custom-cursor'

const googleSansFlex = localFont({
  src: './fonts/GoogleSansFlex-Variable.woff2',
  variable: '--font-google-sans-flex',
  weight: '100 900',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'GHOST AI — Collaborative Architecture Canvas',
  description: 'Next-generation AI architecture design and collaborative canvas',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${googleSansFlex.variable} dark h-full antialiased`}>
      <body
        className="min-h-full flex flex-col font-sans selection:bg-accent-primary/20 selection:text-accent-primary"
        suppressHydrationWarning
      >
        <ClerkProvider
          appearance={{
            cssLayerName: 'clerk',
            theme: shadcn,
            variables: {
              colorPrimary: 'var(--accent-primary)',
              colorPrimaryForeground: 'var(--bg-base)',
              colorBackground: '#0e141c',
              colorForeground: 'var(--text-primary)',
              colorMuted: 'var(--bg-subtle)',
              colorMutedForeground: 'var(--text-muted)',
              colorNeutral: 'var(--text-primary)',
              colorBorder: 'rgba(255, 255, 255, 0.08)',
              colorInput: 'var(--bg-base)',
              colorInputForeground: 'var(--text-primary)',
              colorRing: 'var(--accent-primary)',
              colorModalBackdrop: 'color-mix(in srgb, var(--bg-base) 78%, transparent)',
              colorDanger: 'var(--state-error)',
              colorSuccess: 'var(--state-success)',
              borderRadius: '0.75rem',
              fontFamily: 'var(--font-sans)',
              fontFamilyButtons: 'var(--font-sans)',
            },
            elements: {
              rootBox: 'bg-transparent',
              cardBox:
                'w-full bg-[#0e141c]/95! backdrop-blur-2xl border border-white/[0.08]! rounded-2xl shadow-2xl! overflow-hidden',
              card: 'bg-transparent shadow-none border-0 p-6 sm:p-8',
              headerTitle: 'font-heading text-xl font-semibold tracking-tight text-text-primary',
              headerSubtitle: 'text-sm text-text-muted',
              socialButtonsBlockButton:
                'bg-bg-elevated hover:bg-bg-subtle border border-white/[0.08] text-text-primary rounded-xl h-10 transition-colors',
              dividerLine: 'bg-white/[0.08]',
              dividerText: 'text-xs text-text-muted uppercase tracking-wider',
              formFieldLabel: 'text-xs font-medium text-text-secondary',
              input:
                'bg-bg-base/85! dark:bg-bg-base/85! border border-white/[0.09]! text-text-primary placeholder:text-text-faint rounded-xl h-10 focus:border-accent-primary focus:ring-1 focus:ring-accent-primary',
              formButtonPrimary:
                'bg-[linear-gradient(180deg,#23bfd0_0%,#0b9aa8_100%)]! hover:brightness-105 text-bg-base font-semibold rounded-xl h-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_20px_-6px_rgba(11,154,168,0.35)] transition-all',
              footer: 'bg-white/[0.025] border-t border-white/[0.06]',
              footerActionText: 'text-text-muted text-xs',
              footerActionLink: 'text-[#7ecbd4] hover:text-accent-primary font-medium',
              popoverBox:
                'bg-[#0e141c]! border border-white/[0.08]! rounded-2xl shadow-2xl! overflow-hidden',
              userButtonPopoverMain: 'bg-[#0e141c]',
              userButtonPopoverActions: 'border-t border-white/[0.06]',
              userButtonPopoverActionButton:
                'text-text-secondary hover:text-text-primary hover:bg-white/[0.06]',
              userButtonPopoverFooter: 'bg-white/[0.02] border-t border-white/[0.06]',
              userButtonAvatarBox: 'h-8 w-8 ring-1 ring-white/10',
              modalContent: 'bg-[#0e141c] border border-white/[0.08] rounded-3xl shadow-2xl',
            },
          }}
        >
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ClerkProvider>
        <CustomCursor />
      </body>
    </html>
  )
}
