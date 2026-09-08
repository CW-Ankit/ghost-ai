import type { Metadata } from 'next'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { shadcn } from '@clerk/ui/themes'
import ConvexClientProvider from '@/components/convex-client-provider'

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
    <html lang="en" className="h-full antialiased">
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
              colorBackground: 'var(--bg-surface)',
              colorForeground: 'var(--text-primary)',
              colorMutedForeground: 'var(--text-secondary)',
              colorBorder: 'var(--border-default)',
              colorInput: 'var(--bg-base)',
              colorInputForeground: 'var(--text-primary)',
              colorDanger: 'var(--state-error)',
              colorSuccess: 'var(--state-success)',
              fontFamily: 'var(--font-geist-sans)',
            },
            elements: {
              rootBox: {
                backgroundColor: 'var(--bg-base)',
              },
            },
          }}
        >
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
