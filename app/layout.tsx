import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { shadcn } from '@clerk/ui/themes'
import ConvexClientProvider from '@/components/convex-client-provider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'GHOST AI',
  description: 'GHOST AI',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
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
