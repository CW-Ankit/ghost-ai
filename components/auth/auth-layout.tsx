'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { AuthBackground } from './auth-background'
import { Logo } from '@/components/ui/logo'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
}

export function AuthLayout({ children, title }: AuthLayoutProps) {
  useEffect(() => {
    document.title = `${title} | Ghost AI`
  }, [title])

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-10">
      <AuthBackground />

      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center gap-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 text-text-primary hover:opacity-90 transition-opacity"
        >
          <Logo className="text-[#7ecbd4]" size={30} />
          <span className="font-heading text-xl font-bold tracking-tighter">GHOST AI</span>
        </Link>

        <div className="w-full">{children}</div>
      </div>
    </div>
  )
}
