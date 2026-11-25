'use client'

import React, { useEffect } from 'react'
import { AuthBackground } from './auth-background'
import { Logo } from '@/components/ui/logo'
import { CheckCircle2 } from 'lucide-react'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  useEffect(() => {
    document.title = `${title} | Ghost AI`
  }, [title])

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-6 py-10">
      <AuthBackground />

      <div className="relative z-10 max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Left Panel: Branding & Features */}
        <div className="hidden lg:flex flex-col justify-center">
          <div className="max-w-md space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Logo className="text-accent-primary" size={40} />
                <h1 className="text-4xl font-bold tracking-tighter text-text-primary">GHOST AI</h1>
              </div>
              <p className="text-xl text-text-secondary leading-relaxed">{subtitle}</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {[
                { title: 'Visual Canvas', desc: 'Real-time collaborative mapping' },
                { title: 'AI Generation', desc: 'Natural language to architecture' },
                { title: 'Auto-Specs', desc: 'Instant Markdown technical documentation' },
                { title: 'Seamless Handoff', desc: 'Production-ready system blueprints' },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-start gap-3 p-4 rounded-2xl bg-bg-surface/60 backdrop-blur-sm border border-border-default hover:border-accent-primary/50 transition-colors group"
                >
                  <CheckCircle2 className="h-5 w-5 text-accent-primary shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-text-primary">{feature.title}</div>
                    <div className="text-xs text-text-muted">{feature.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Form */}
        <div className="flex w-full flex-col items-center justify-center gap-6">
          <div className="flex lg:hidden flex-col items-center text-center space-y-2 max-w-[420px]">
            <div className="flex items-center gap-2.5">
              <Logo className="text-accent-primary" size={32} />
              <span className="font-heading text-2xl font-bold tracking-tighter text-text-primary">
                GHOST AI
              </span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">{subtitle}</p>
          </div>

          <div className="flex w-full justify-center">
            <div className="w-full max-w-[420px] flex justify-center">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
