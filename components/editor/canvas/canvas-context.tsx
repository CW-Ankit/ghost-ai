'use client'

import React, { createContext, useContext } from 'react'

interface CanvasContextValue {
  isReadOnly: boolean
}

const CanvasContext = createContext<CanvasContextValue>({
  isReadOnly: false,
})

export function CanvasContextProvider({
  isReadOnly,
  children,
}: {
  isReadOnly: boolean
  children: React.ReactNode
}) {
  return (
    <CanvasContext.Provider value={{ isReadOnly }}>
      {children}
    </CanvasContext.Provider>
  )
}

export function useCanvasContext() {
  return useContext(CanvasContext)
}
