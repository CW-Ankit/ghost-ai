'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

export interface CustomCursorProps {
  scope?: string
  clickableSelector?: string
  hideOnTop?: boolean
  topOffset?: number
  fastThreshold?: number
  fastScale?: number
  clickScale?: number
  normalScale?: number
  color?: string
  strokeColor?: string
  strokeWidth?: number
  hideNativeCursor?: boolean
  disabledOnTouch?: boolean
  respectReducedMotion?: boolean
  className?: string
  zIndex?: number
}

const DEFAULT_CLICKABLE_SELECTOR =
  'a, button, input, textarea, select, option, summary, [role="button"], [onclick], [tabindex]:not([tabindex="-1"]), label, [data-cursor-clickable]'

const NON_TEXT_INPUT_TYPES = new Set([
  'button',
  'submit',
  'reset',
  'checkbox',
  'radio',
  'range',
  'file',
])

interface ColorAnalysis {
  brightness: number
  isTransparent: boolean
}

const colorCache = new Map<string, ColorAnalysis>()
let probeContext: CanvasRenderingContext2D | null = null

function analyzeColor(colorStr: string): ColorAnalysis {
  if (!colorStr || colorStr === 'transparent' || colorStr === 'rgba(0, 0, 0, 0)') {
    return { brightness: 0, isTransparent: true }
  }

  const cached = colorCache.get(colorStr)
  if (cached) return cached

  if (colorStr.startsWith('#')) {
    const hex = colorStr.slice(1)
    let r = 0
    let g = 0
    let b = 0
    let a = 1

    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16)
      g = parseInt(hex[1] + hex[1], 16)
      b = parseInt(hex[2] + hex[2], 16)
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16)
      g = parseInt(hex.slice(2, 4), 16)
      b = parseInt(hex.slice(4, 6), 16)
    } else if (hex.length === 8) {
      r = parseInt(hex.slice(0, 2), 16)
      g = parseInt(hex.slice(2, 4), 16)
      b = parseInt(hex.slice(4, 6), 16)
      a = parseInt(hex.slice(6, 8), 16) / 255
    }

    const result = { brightness: 0.299 * r + 0.587 * g + 0.114 * b, isTransparent: a < 0.5 }
    colorCache.set(colorStr, result)
    return result
  }

  const rgbMatch = colorStr.match(
    /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\)/
  )
  if (rgbMatch) {
    const alpha = rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1
    const result = {
      brightness:
        0.299 * parseFloat(rgbMatch[1]) +
        0.587 * parseFloat(rgbMatch[2]) +
        0.114 * parseFloat(rgbMatch[3]),
      isTransparent: alpha < 0.5,
    }
    colorCache.set(colorStr, result)
    return result
  }

  try {
    if (typeof document !== 'undefined') {
      if (!probeContext) {
        const canvas = document.createElement('canvas')
        canvas.width = 1
        canvas.height = 1
        probeContext = canvas.getContext('2d', { willReadFrequently: true })
      }
      if (probeContext) {
        probeContext.clearRect(0, 0, 1, 1)
        probeContext.fillStyle = colorStr
        probeContext.fillRect(0, 0, 1, 1)
        const [r, g, b, a] = probeContext.getImageData(0, 0, 1, 1).data
        const result = {
          brightness: 0.299 * r + 0.587 * g + 0.114 * b,
          isTransparent: a / 255 < 0.5,
        }
        if (colorCache.size > 250) colorCache.clear()
        colorCache.set(colorStr, result)
        return result
      }
    }
  } catch {
    // Fallback to transparent below
  }

  return { brightness: 0, isTransparent: true }
}

function isTextInputElement(el: Element | null): boolean {
  if (!el) return false
  const tag = el.tagName?.toLowerCase()
  if (tag === 'textarea') return true
  if ((el as HTMLElement).isContentEditable) return true
  if (tag === 'input') {
    const inputType = (el as HTMLInputElement).type?.toLowerCase() || ''
    return !NON_TEXT_INPUT_TYPES.has(inputType)
  }
  return false
}

function getEffectiveBackgroundBrightness(startEl: Element | null): number {
  let current: Element | null = startEl
  while (current && current !== document.documentElement) {
    let bg: string | null = null
    try {
      bg = window.getComputedStyle(current).backgroundColor
    } catch {
      bg = null
    }
    if (bg) {
      const analyzed = analyzeColor(bg)
      if (!analyzed.isTransparent) return analyzed.brightness
    }
    const parent = current.parentElement
    if (parent) {
      current = parent
    } else {
      const root = current.getRootNode?.()
      current = root && 'host' in root ? ((root as ShadowRoot).host ?? null) : null
    }
  }

  try {
    const bodyBg = window.getComputedStyle(document.body).backgroundColor
    const analyzed = analyzeColor(bodyBg)
    if (!analyzed.isTransparent) return analyzed.brightness
  } catch {
    // Fallback below
  }

  return document.documentElement.classList.contains('dark') ? 20 : 240
}

function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor
}

function lerpAngle(current: number, target: number, factor: number): number {
  let diff = target - current
  while (diff > 180) diff -= 360
  while (diff < -180) diff += 360
  return current + diff * factor
}

export function CustomCursor({
  scope = 'body',
  clickableSelector = DEFAULT_CLICKABLE_SELECTOR,
  hideOnTop = false,
  topOffset = 32,
  fastThreshold = 10,
  fastScale = 0.72,
  clickScale = 0.78,
  normalScale = 1,
  color = 'auto',
  strokeColor = 'auto',
  strokeWidth = 10,
  hideNativeCursor = true,
  disabledOnTouch = true,
  respectReducedMotion = true,
  className = '',
  zIndex = 2147483647,
}: CustomCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    const isFinePointer = window.matchMedia('(pointer: fine)').matches
    if (disabledOnTouch && !isFinePointer) return

    const cursorEl = cursorRef.current
    const pathEl = pathRef.current
    if (!cursorEl || !pathEl) return

    const reducedMotion =
      respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (hideNativeCursor && isFinePointer) {
      document.documentElement.classList.add('has-custom-cursor')
    }

    let mouseX = -100
    let mouseY = -100
    let curX = -100
    let curY = -100
    let velX = 0
    let velY = 0
    let prevSampleX = -100
    let prevSampleY = -100
    let curRot = 0
    let targetRot = 0
    let curScale = normalScale
    let targetScale = normalScale
    let initialized = false
    let isPressed = false
    let isClickable = false
    let isVisible = false
    let rafId = 0
    let isAnimating = false
    let lastTarget: Element | null = null
    let lastClickable = false
    let cachedFill = '#ffffff'
    let cachedStroke = 'rgba(0, 0, 0, 0.4)'

    const posFactor = reducedMotion ? 1 : 0.22
    const rotIdleFactor = reducedMotion ? 1 : 0.08
    const rotClickableFactor = reducedMotion ? 1 : 0.14
    const scaleFactor = reducedMotion ? 1 : 0.12

    const tick = () => {
      curX = lerp(curX, mouseX, posFactor)
      curY = lerp(curY, mouseY, posFactor)
      velX *= 0.88
      velY *= 0.88

      const speed = Math.hypot(velX, velY)
      targetScale = isPressed
        ? clickScale
        : speed >= fastThreshold && !reducedMotion
          ? fastScale
          : normalScale

      curRot = lerpAngle(curRot, targetRot, isClickable ? rotClickableFactor : rotIdleFactor)
      curScale = lerp(curScale, targetScale, scaleFactor)

      cursorEl.style.transform = `translate3d(${curX - 4}px, ${curY - 4}px, 0) rotate(${curRot}deg) scale(${curScale})`

      const rotDelta = Math.abs(targetRot - curRot)
      const scaleDelta = Math.abs(targetScale - curScale)

      if (
        Math.hypot(mouseX - curX, mouseY - curY) < 0.1 &&
        speed < 0.05 &&
        rotDelta < 0.1 &&
        scaleDelta < 0.005
      ) {
        curX = mouseX
        curY = mouseY
        curRot = targetRot
        curScale = targetScale
        cursorEl.style.transform = `translate3d(${curX - 4}px, ${curY - 4}px, 0) rotate(${curRot}deg) scale(${curScale})`
        isAnimating = false
        return
      }

      rafId = requestAnimationFrame(tick)
    }

    const scheduleTick = () => {
      if (!isAnimating) {
        isAnimating = true
        rafId = requestAnimationFrame(tick)
      }
    }

    const updateColors = (target: Element | null) => {
      if (color !== 'auto') {
        if (pathEl.style.fill !== color) pathEl.style.fill = color
        if (strokeColor !== 'auto' && pathEl.style.stroke !== strokeColor) {
          pathEl.style.stroke = strokeColor
        }
        return
      }

      if (target && target === lastTarget) {
        if (pathEl.style.fill !== cachedFill) {
          pathEl.style.fill = cachedFill
          pathEl.style.stroke = cachedStroke
        }
        return
      }

      const brightness = getEffectiveBackgroundBrightness(target)
      const nextFill = brightness < 145 ? '#ffffff' : '#121212'
      const nextStroke =
        strokeColor !== 'auto'
          ? strokeColor
          : brightness < 145
            ? 'rgba(0, 0, 0, 0.45)'
            : 'rgba(255, 255, 255, 0.45)'

      cachedFill = nextFill
      cachedStroke = nextStroke

      if (pathEl.style.fill !== nextFill) pathEl.style.fill = nextFill
      if (pathEl.style.stroke !== nextStroke) pathEl.style.stroke = nextStroke
    }

    const handleMove = (event: MouseEvent) => {
      const target = (event.target as Element | null) || null
      const inScope = scope === 'body' || (!!target && !!target.closest(scope))
      const onTextInput = isTextInputElement(target)
      const ignored = !!target?.closest?.('[data-cursor-ignore]')
      const hiddenAtTop = hideOnTop && event.clientY < topOffset
      const shouldShow = inScope && !onTextInput && !ignored && !hiddenAtTop

      if (shouldShow !== isVisible) {
        isVisible = shouldShow
        cursorEl.style.opacity = isVisible ? '1' : '0'
      }

      if (!shouldShow) {
        lastTarget = target
        return
      }

      mouseX = event.clientX
      mouseY = event.clientY

      updateColors(target)

      if (!initialized) {
        curX = mouseX
        curY = mouseY
        prevSampleX = mouseX
        prevSampleY = mouseY
        initialized = true
        cursorEl.style.transform = `translate3d(${curX - 4}px, ${curY - 4}px, 0) rotate(0deg) scale(${normalScale})`
      }

      const dx = mouseX - prevSampleX
      const dy = mouseY - prevSampleY
      if (Math.hypot(dx, dy) > 2) {
        velX = 0.7 * velX + 0.3 * dx
        velY = 0.7 * velY + 0.3 * dy
        prevSampleX = mouseX
        prevSampleY = mouseY

        if (!isClickable) {
          if (reducedMotion) {
            targetRot = 0
          } else if (Math.hypot(velX, velY) >= 2) {
            targetRot = (Math.atan2(velY, velX) * 180) / Math.PI + 90
          }
        }
      }

      const clickableNow = target
        ? target === lastTarget
          ? lastClickable
          : ((lastClickable = !!target.closest(clickableSelector)), lastClickable)
        : false

      lastTarget = target

      if (clickableNow) {
        if (!isClickable) {
          isClickable = true
          targetRot = 0
        }
      } else if (isClickable) {
        isClickable = false
        velX = 0
        velY = 0
        prevSampleX = mouseX
        prevSampleY = mouseY
      }

      scheduleTick()
    }

    const handleMouseDown = () => {
      isPressed = true
      targetScale = clickScale
      scheduleTick()
    }

    const handleMouseUp = () => {
      isPressed = false
      targetScale = normalScale
      scheduleTick()
    }

    const handleMouseLeave = () => {
      isVisible = false
      cursorEl.style.opacity = '0'
      velX = 0
      velY = 0
      targetScale = normalScale
      curScale = normalScale
    }

    const handleMouseEnter = (event: MouseEvent) => {
      mouseX = event.clientX
      mouseY = event.clientY
      handleMove(event)
    }

    const handleBlur = () => {
      isVisible = false
      cursorEl.style.opacity = '0'
    }

    const handleScroll = () => {
      scheduleTick()
    }

    document.addEventListener('mousemove', handleMove, { passive: true })
    document.addEventListener('mousedown', handleMouseDown, { passive: true })
    document.addEventListener('mouseup', handleMouseUp, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true })
    document.addEventListener('mouseenter', handleMouseEnter, { passive: true })
    window.addEventListener('blur', handleBlur, { passive: true })
    window.addEventListener('scroll', handleScroll, { passive: true })
    scheduleTick()

    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('mouseenter', handleMouseEnter)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('scroll', handleScroll)
      if (hideNativeCursor) {
        document.documentElement.classList.remove('has-custom-cursor')
      }
      cancelAnimationFrame(rafId)
    }
  }, [
    scope,
    clickableSelector,
    hideOnTop,
    topOffset,
    fastThreshold,
    fastScale,
    clickScale,
    normalScale,
    color,
    strokeColor,
    hideNativeCursor,
    disabledOnTouch,
    respectReducedMotion,
  ])

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      className={cn('custom-cursor', className)}
      style={{ zIndex }}
    >
      <svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
        <path
          ref={pathRef}
          d="M82 32 C75 33 68 39 65 46 C64 48 64 52 64.5 58 L71 204 C71.5 214 77 221 86 223 C94 225 101 221 107 214 L132 180 C139 171 148 167 160 166 L211 166 C219 166 224 160 224 151 C224 144 221 138 214 132 L104 39 C97 34 89 31 82 32 Z"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth}
        />
      </svg>
    </div>
  )
}
