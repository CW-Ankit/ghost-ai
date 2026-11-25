import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { shadcn } from '@clerk/ui/themes'
import ConvexClientProvider from '@/components/convex-client-provider'

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
              colorBackground: 'var(--bg-surface)',
              colorForeground: 'var(--text-primary)',
              colorMuted: 'var(--bg-subtle)',
              colorMutedForeground: 'var(--text-muted)',
              colorNeutral: 'var(--text-primary)',
              colorBorder: 'var(--border-default)',
              colorInput: 'var(--bg-elevated)',
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
                'w-full bg-bg-surface/90! backdrop-blur-xl border border-border-default! rounded-2xl shadow-2xl! overflow-hidden',
              card: 'bg-transparent shadow-none border-0 p-6 sm:p-8',
              headerTitle: 'font-heading text-xl font-semibold tracking-tight text-text-primary',
              headerSubtitle: 'text-sm text-text-muted',
              socialButtonsBlockButton:
                'bg-bg-elevated hover:bg-bg-subtle border border-border-default text-text-primary rounded-xl h-10 transition-colors',
              dividerLine: 'bg-border-default',
              dividerText: 'text-xs text-text-muted uppercase tracking-wider',
              formFieldLabel: 'text-xs font-medium text-text-secondary',
              input:
                'bg-bg-base/80! dark:bg-bg-base/80! border border-border-default! text-text-primary placeholder:text-text-faint rounded-xl h-10 focus:border-accent-primary focus:ring-1 focus:ring-accent-primary',
              formButtonPrimary:
                'bg-accent-primary hover:bg-accent-primary/90 text-bg-base font-medium rounded-xl h-10 shadow-none transition-colors',
              footer: 'bg-bg-elevated/50 border-t border-border-default',
              footerActionText: 'text-text-muted text-xs',
              footerActionLink: 'text-accent-primary hover:text-accent-primary/80 font-medium',
              popoverBox:
                'bg-bg-surface! border border-border-default! rounded-2xl shadow-2xl! overflow-hidden',
              userButtonPopoverMain: 'bg-bg-surface',
              userButtonPopoverActions: 'border-t border-border-default',
              userButtonPopoverActionButton:
                'text-text-secondary hover:text-text-primary hover:bg-bg-elevated',
              userButtonPopoverFooter: 'bg-bg-elevated/40 border-t border-border-default',
              userButtonAvatarBox: 'h-8 w-8 ring-1 ring-border-subtle',
              modalContent: 'bg-bg-surface border border-border-default rounded-3xl shadow-2xl',
            },
          }}
        >
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
