'use client'

import React from 'react'
import { useOthers } from '@liveblocks/react'
import { useUser } from '@clerk/nextjs'
import { useViewport } from '@xyflow/react'

export function LiveCursors() {
  const { user } = useUser()
  const others = useOthers()
  const { x: viewportX, y: viewportY, zoom } = useViewport()

  const currentUserId = user?.id

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {others.map((other) => {
        if (!other.presence?.cursor) return null
        if (currentUserId && other.id === currentUserId) return null

        const { x, y } = other.presence.cursor
        const screenX = x * zoom + viewportX
        const screenY = y * zoom + viewportY
        const color = other.info?.cursorColor || '#00c8d4'
        const name = other.info?.displayName || 'Collaborator'

        return (
          <div
            key={other.connectionId}
            className="absolute top-0 left-0 transition-transform duration-75 ease-out pointer-events-none select-none flex items-start gap-1"
            style={{
              transform: `translate3d(${screenX}px, ${screenY}px, 0)`,
            }}
          >
            {/* Cursor Pointer SVG */}
            <svg
              className="h-5 w-5 -translate-x-[1px] -translate-y-[1px] drop-shadow-md"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.5 16.8829L0.5 1.19841L11.7841 12.3673H5.65376Z"
                fill={color}
                stroke="#080809"
                strokeWidth="1.5"
              />
            </svg>

            {/* Attached Name Badge */}
            <div
              className="px-2 py-0.5 text-[11px] font-medium rounded-full shadow-lg whitespace-nowrap text-bg-base -ml-1 mt-3"
              style={{ backgroundColor: color }}
            >
              {name}
              {other.presence?.thinking && (
                <span className="ml-1.5 opacity-80 animate-pulse text-[10px]">thinking...</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
