'use client'

import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

/**
 * Isometric 3D obsidian cube + glowing cyan node cursor icon.
 */
export function Canvas3DIcon({ className = 'h-12 w-12', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient
          id="g-canvas-top"
          x1="16"
          y1="8"
          x2="48"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#32343e" />
          <stop offset="100%" stopColor="#1b1c22" />
        </linearGradient>
        <linearGradient
          id="g-canvas-left"
          x1="12"
          y1="20"
          x2="32"
          y2="54"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#23252d" />
          <stop offset="100%" stopColor="#101115" />
        </linearGradient>
        <linearGradient
          id="g-canvas-right"
          x1="32"
          y1="20"
          x2="52"
          y2="54"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#191a21" />
          <stop offset="100%" stopColor="#0b0c0f" />
        </linearGradient>
        <linearGradient
          id="g-canvas-cursor"
          x1="34"
          y1="28"
          x2="54"
          y2="52"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="100%" stopColor="#00c8d4" />
        </linearGradient>
      </defs>

      {/* Main isometric 3D node cube */}
      <polygon
        points="32,10 50,20 32,30 14,20"
        fill="url(#g-canvas-top)"
        stroke="#00c8d4"
        strokeOpacity="0.45"
        strokeWidth="1"
      />
      <polygon
        points="14,20 32,30 32,50 14,40"
        fill="url(#g-canvas-left)"
        stroke="#3a3a42"
        strokeWidth="0.9"
      />
      <polygon
        points="32,30 50,20 50,40 32,50"
        fill="url(#g-canvas-right)"
        stroke="#2a2a30"
        strokeWidth="0.9"
      />

      {/* Specular top edge highlight */}
      <path
        d="M14 20L32 10L50 20"
        stroke="#f0f0f4"
        strokeOpacity="0.35"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path d="M32 30V50" stroke="#00c8d4" strokeOpacity="0.35" strokeWidth="1" />

      {/* Floating 3D cyan cursor */}
      <path
        d="M37 29.5L53.5 41.2C54.6 42 54.1 43.7 52.8 43.9L45.9 44.8L42.5 51.1C41.9 52.3 40.1 52 39.9 50.6L36.2 31.2C36 30.1 36.4 29.1 37 29.5Z"
        fill="url(#g-canvas-cursor)"
        stroke="#080809"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M38.2 32.5L41.1 47.4"
        stroke="#ffffff"
        strokeOpacity="0.55"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * Isometric 3D stacked architectural blueprint layers icon.
 */
export function Templates3DIcon({ className = 'h-12 w-12', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient
          id="g-tpl-bottom"
          x1="12"
          y1="34"
          x2="52"
          y2="54"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#1b1d24" />
          <stop offset="100%" stopColor="#0c0d11" />
        </linearGradient>
        <linearGradient
          id="g-tpl-mid"
          x1="12"
          y1="24"
          x2="52"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#262832" />
          <stop offset="100%" stopColor="#13141a" />
        </linearGradient>
        <linearGradient
          id="g-tpl-top"
          x1="12"
          y1="12"
          x2="52"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#00c8d4" stopOpacity="0.22" />
        </linearGradient>
      </defs>

      {/* Bottom 3D slab */}
      <polygon
        points="32,33 52,42.5 32,52 12,42.5"
        fill="url(#g-tpl-bottom)"
        stroke="#2a2a30"
        strokeWidth="1"
      />
      <polygon
        points="12,42.5 32,52 32,55.5 12,46"
        fill="#0d0e12"
        stroke="#2a2a30"
        strokeWidth="0.7"
      />
      <polygon
        points="32,52 52,42.5 52,46 32,55.5"
        fill="#090a0d"
        stroke="#2a2a30"
        strokeWidth="0.7"
      />

      {/* Middle 3D slab */}
      <polygon
        points="32,22 52,31.5 32,41 12,31.5"
        fill="url(#g-tpl-mid)"
        stroke="#3a3a42"
        strokeWidth="1"
      />
      <polygon
        points="12,31.5 32,41 32,44.5 12,35"
        fill="#15161c"
        stroke="#2a2a30"
        strokeWidth="0.7"
      />
      <polygon
        points="32,41 52,31.5 52,35 32,44.5"
        fill="#0e0f14"
        stroke="#2a2a30"
        strokeWidth="0.7"
      />

      {/* Top glowing glass blueprint layer */}
      <polygon
        points="32,11 52,20.5 32,30 12,20.5"
        fill="url(#g-tpl-top)"
        stroke="#34d399"
        strokeOpacity="0.8"
        strokeWidth="1.1"
      />
      <polygon
        points="12,20.5 32,30 32,33 12,23.5"
        fill="#0f2e24"
        fillOpacity="0.85"
        stroke="#34d399"
        strokeOpacity="0.4"
        strokeWidth="0.7"
      />
      <polygon
        points="32,30 52,20.5 52,23.5 32,33"
        fill="#091f1a"
        fillOpacity="0.9"
        stroke="#00c8d4"
        strokeOpacity="0.4"
        strokeWidth="0.7"
      />
      <path
        d="M12 20.5L32 11L52 20.5"
        stroke="#f0f0f4"
        strokeOpacity="0.45"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * Faceted 3D obsidian & indigo crystal prism spark icon.
 */
export function AiSpark3DIcon({ className = 'h-12 w-12', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="g-ai-tl" x1="14" y1="10" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a59dff" />
          <stop offset="100%" stopColor="#6457f9" />
        </linearGradient>
        <linearGradient id="g-ai-tr" x1="32" y1="10" x2="50" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8b82ff" />
          <stop offset="100%" stopColor="#3c32b8" />
        </linearGradient>
        <linearGradient id="g-ai-bl" x1="14" y1="32" x2="32" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4c41d4" />
          <stop offset="100%" stopColor="#1e1957" />
        </linearGradient>
        <linearGradient id="g-ai-br" x1="32" y1="32" x2="50" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2c257a" />
          <stop offset="100%" stopColor="#110e30" />
        </linearGradient>
      </defs>

      {/* Subtle orbiting glass ring */}
      <ellipse
        cx="32"
        cy="33"
        rx="22"
        ry="9"
        transform="rotate(-18 32 33)"
        stroke="#8b82ff"
        strokeOpacity="0.4"
        strokeWidth="1.2"
      />

      {/* 4-faceted 3D octahedron spark */}
      <polygon points="32,8 32,32 14,32" fill="url(#g-ai-tl)" />
      <polygon points="32,8 50,32 32,32" fill="url(#g-ai-tr)" />
      <polygon points="14,32 32,32 32,56" fill="url(#g-ai-bl)" />
      <polygon points="32,32 50,32 32,56" fill="url(#g-ai-br)" />

      {/* Facet ridge specular lines */}
      <path d="M32 8V56M14 32H50" stroke="#f0f0f4" strokeOpacity="0.45" strokeWidth="0.9" />
      <polygon
        points="32,8 50,32 32,56 14,32"
        stroke="#8b82ff"
        strokeOpacity="0.75"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Satellite cyan node */}
      <circle cx="51" cy="24" r="3" fill="#00c8d4" stroke="#080809" strokeWidth="1" />
    </svg>
  )
}

/**
 * 3D extruded glass specification document tablet icon.
 */
export function Specs3DIcon({ className = 'h-12 w-12', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient
          id="g-specs-back"
          x1="16"
          y1="10"
          x2="48"
          y2="54"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#1e2028" />
          <stop offset="100%" stopColor="#0d0e12" />
        </linearGradient>
        <linearGradient
          id="g-specs-front"
          x1="14"
          y1="14"
          x2="46"
          y2="52"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#282a34" />
          <stop offset="100%" stopColor="#121318" />
        </linearGradient>
        <linearGradient
          id="g-specs-bar"
          x1="20"
          y1="24"
          x2="38"
          y2="24"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#00c8d4" />
          <stop offset="100%" stopColor="#67e8f9" />
        </linearGradient>
      </defs>

      {/* Rear extruded depth slab */}
      <rect
        x="21"
        y="10"
        width="28"
        height="38"
        rx="6"
        fill="url(#g-specs-back)"
        stroke="#2a2a30"
        strokeWidth="1"
      />

      {/* Front frosted spec slab */}
      <rect
        x="15"
        y="16"
        width="28"
        height="38"
        rx="6"
        fill="url(#g-specs-front)"
        stroke="#00c8d4"
        strokeOpacity="0.55"
        strokeWidth="1.1"
      />
      <path
        d="M21 16.5H37"
        stroke="#f0f0f4"
        strokeOpacity="0.45"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Extruded 3D content bars */}
      <rect x="21" y="24" width="16" height="3.5" rx="1.75" fill="url(#g-specs-bar)" />
      <rect x="21" y="32" width="16" height="2.5" rx="1.25" fill="#505060" />
      <rect x="21" y="38" width="12" height="2.5" rx="1.25" fill="#3a3a42" />
      <rect x="21" y="44" width="14" height="2.5" rx="1.25" fill="#3a3a42" />
    </svg>
  )
}

/**
 * 3D interlocking obsidian & emerald-cyan link rings icon.
 */
export function Share3DIcon({ className = 'h-12 w-12', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient
          id="g-share-ring-a"
          x1="12"
          y1="20"
          x2="38"
          y2="46"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
        <linearGradient
          id="g-share-ring-b"
          x1="26"
          y1="16"
          x2="52"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#3a3d49" />
          <stop offset="100%" stopColor="#16171d" />
        </linearGradient>
      </defs>

      {/* Back metallic torus ring */}
      <g transform="rotate(-35 38 28)">
        <rect
          x="23"
          y="19"
          width="28"
          height="18"
          rx="9"
          stroke="url(#g-share-ring-b)"
          strokeWidth="6.5"
        />
        <rect
          x="23"
          y="19"
          width="28"
          height="18"
          rx="9"
          stroke="#f0f0f4"
          strokeOpacity="0.22"
          strokeWidth="1.2"
        />
      </g>

      {/* Front luminous emerald-cyan 3D link ring */}
      <g transform="rotate(-35 26 36)">
        <rect
          x="12"
          y="27"
          width="28"
          height="18"
          rx="9"
          stroke="url(#g-share-ring-a)"
          strokeWidth="6.5"
        />
        <rect
          x="12"
          y="27"
          width="28"
          height="18"
          rx="9"
          stroke="#f0f0f4"
          strokeOpacity="0.45"
          strokeWidth="1.1"
        />
      </g>
    </svg>
  )
}
