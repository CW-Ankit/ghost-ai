'use client'

import { Authenticated, Unauthenticated } from 'convex/react'
import { SignInButton, UserButton } from '@clerk/nextjs'

export default function Home() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Authenticated>
        <div className="flex flex-col items-center gap-4">
          <div className="text-4xl font-bold">GHOST AI</div>
          <UserButton />
        </div>
      </Authenticated>
      <Unauthenticated>
        <div className="flex flex-col items-center gap-4">
          <div className="text-4xl font-bold">GHOST AI</div>
          <SignInButton mode="modal">
            <button className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors">
              Sign In
            </button>
          </SignInButton>
        </div>
      </Unauthenticated>
    </div>
  )
}
