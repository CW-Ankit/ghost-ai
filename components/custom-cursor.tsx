'use client'

import React, { useEffect, useRef } from 'react'
import clsx from 'clsx'

const CURSOR_PATH =
  'M82 32 C75 33 68 39 65 46 C64 48 64 52 64.5 58 L71 204 ' +
  'C71.5 214 77 221 86 223 C94 225 101 221 107 214 L132 180 ' +
  'C139 171 148 167 160 166 L211 166 C219 166 224 160 224 151 ' +
  'C224 144 221 138 214 132 L104 39 C97 34 89 31 82 32 Z'

const DEFAULT_CLICKABLE =
  'a, button, input, textarea, select, option, summary, ' +
  '[role="button"], [onclick], [tabindex]:not([tabindex="-1"]), ' +
  'label, [data-cursor-clickable]'

export interface CustomCursorProps {
  /** The CSS selector for container scope where cursor is active. Defaults to "body" */
  scope?: string
  /** CSS selector to identify clickable elements. Defaults to buttons, links, etc. */
  clickableSelector?: string
  /** Whether to hide the cursor near the top of the viewport */
  hideOnTop?: boolean
  /** Threshold in pixels from top of viewport to hide cursor if hideOnTop is true */
  topOffset?: number
  /** Speed threshold for applying fastScale */
  fastThreshold?: number
  /** Scale factor when moving quickly */
  fastScale?: number
  /** Scale factor when mouse button is pressed */
  clickScale?: number
  /** Normal resting scale */
  normalScale?: number
  /** Cursor fill color: "auto" for dynamic luminance contrast, or any valid CSS color string */
  color?: 'auto' | string
  /** Cursor stroke outline color: "auto" for adaptive contrast, or custom CSS color string */
  strokeColor?: 'auto' | string
  /** Stroke width for the cursor outline in SVG units (defaults to 10) */
  strokeWidth?: number
  /** Whether to hide the native OS cursor when active on desktop fine pointer devices */
  hideNativeCursor?: boolean
  /** Whether to disable custom cursor on touch/coarse pointer devices */
  disabledOnTouch?: boolean
  /** Whether to respect prefers-reduced-motion media query */
  respectReducedMotion?: boolean
  /** Additional CSS class names */
  className?: string
  /** Custom z-index for the cursor element */
  zIndex?: number
}

// Global cached color brightness map to prevent layout recalculations
const colorBrightnessCache = new Map<string, { brightness: number; isTransparent: boolean }>()
let offscreenCanvasCtx: CanvasRenderingContext2D | null = null

function getCSSColorBrightness(colorStr: string): {
  brightness: number
  isTransparent: boolean
} {
  if (!colorStr || colorStr === 'transparent' || colorStr === 'rgba(0, 0, 0, 0)') {
    return { brightness: 0, isTransparent: true }
  }

  const cached = colorBrightnessCache.get(colorStr)

  if (cached) return cached

  // Fast path for hex colors
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

    const brightness = r * 0.299 + g * 0.587 + b * 0.114
    const result = { brightness, isTransparent: a < 0.5 }

    colorBrightnessCache.set(colorStr, result)

    return result
  }

  // Fast path for rgb / rgba
  const rgbMatch = colorStr.match(
    /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\)/
  )

  if (rgbMatch) {
    const r = parseFloat(rgbMatch[1])
    const g = parseFloat(rgbMatch[2])
    const b = parseFloat(rgbMatch[3])
    const a = rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1
    const brightness = r * 0.299 + g * 0.587 + b * 0.114
    const result = { brightness, isTransparent: a < 0.5 }

    colorBrightnessCache.set(colorStr, result)

    return result
  }

  // Modern CSS color spaces (oklch, hsl, color-mix, lab, named colors) via offscreen canvas
  try {
    if (typeof document !== 'undefined') {
      if (!offscreenCanvasCtx) {
        const canvas = document.createElement('canvas')

        canvas.width = 1
        canvas.height = 1
        offscreenCanvasCtx = canvas.getContext('2d', {
          willReadFrequently: true,
        })
      }

      if (offscreenCanvasCtx) {
        offscreenCanvasCtx.clearRect(0, 0, 1, 1)
        offscreenCanvasCtx.fillStyle = colorStr
        offscreenCanvasCtx.fillRect(0, 0, 1, 1)
        const data = offscreenCanvasCtx.getImageData(0, 0, 1, 1).data
        const a = data[3] / 255
        const brightness = data[0] * 0.299 + data[1] * 0.587 + data[2] * 0.114
        const result = { brightness, isTransparent: a < 0.5 }

        if (colorBrightnessCache.size > 250) {
          colorBrightnessCache.clear()
        }
        colorBrightnessCache.set(colorStr, result)

        return result
      }
    }
  } catch {
    // fallback
  }

  return { brightness: 0, isTransparent: true }
}

function findElementBackground(element: Element | null): {
  brightness: number
} {
  let current: Element | null = element

  while (current && current !== document.documentElement) {
    let bg: string | null = null

    try {
      bg = window.getComputedStyle(current).backgroundColor
    } catch {
      bg = null
    }

    if (bg) {
      const parsed = getCSSColorBrightness(bg)

      if (!parsed.isTransparent) {
        return { brightness: parsed.brightness }
      }
    }

    current =
      current.parentElement || ((current.getRootNode?.() as ShadowRoot)?.host as Element) || null
  }

  // Check document body
  try {
    const docBg = window.getComputedStyle(document.body).backgroundColor
    const parsed = getCSSColorBrightness(docBg)

    if (!parsed.isTransparent) {
      return { brightness: parsed.brightness }
    }
  } catch {
    // ignore
  }

  // Fallback to dark/light theme class check
  const isDark = document.documentElement.classList.contains('dark')

  return { brightness: isDark ? 20 : 240 }
}

function isTextInputElement(el: Element | null): boolean {
  if (!el) return false
  const tag = el.tagName?.toLowerCase()

  if (tag === 'textarea' || (el as HTMLElement).isContentEditable) return true
  if (tag === 'input') {
    const type = (el as HTMLInputElement).type?.toLowerCase()

    return !['button', 'submit', 'reset', 'checkbox', 'radio', 'range', 'file'].includes(type)
  }

  return false
}

export const CustomCursor: React.FC<CustomCursorProps> = ({
  scope = 'body',
  clickableSelector = DEFAULT_CLICKABLE,
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
}) => {
  const cursorRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    // Disable on server or non-fine pointer devices (mobile, tablet touchscreens)
    if (typeof window === 'undefined') return

    const hasFinePointer = window.matchMedia('(pointer: fine)').matches

    if (disabledOnTouch && !hasFinePointer) {
      return
    }

    const cursor = cursorRef.current
    const cursorPath = pathRef.current

    if (!cursor || !cursorPath) return

    const reducedMotion =
      respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Apply native cursor hidden class if enabled
    if (hideNativeCursor && hasFinePointer) {
      document.documentElement.classList.add('has-custom-cursor')
    }

    // ─────────────────────────────────────────────
    // Mouse state & coordinates
    // ─────────────────────────────────────────────
    let mouseX = -100
    let mouseY = -100
    let currentX = -100
    let currentY = -100

    let velocityX = 0
    let velocityY = 0
    let lastMouseX = -100
    let lastMouseY = -100

    let currentAngle = 0
    let targetAngle = 0

    let currentScale = normalScale
    let targetScale = normalScale

    let initialized = false
    let mouseDown = false
    let isClickable = false
    let isVisible = false

    let rafId = 0
    let isAnimating = false

    // Element caching to avoid layout thrashing
    let lastTargetElement: Element | null = null
    let lastClickableResult = false
    let lastResolvedColor = '#ffffff'
    let lastResolvedStroke = 'rgba(0, 0, 0, 0.4)'

    // ─────────────────────────────────────────────
    // Physics tuning
    // ─────────────────────────────────────────────
    const POSITION_SMOOTHING = reducedMotion ? 1 : 0.22
    const ROTATION_SMOOTHING = reducedMotion ? 1 : 0.08
    const CLICKABLE_ROTATION_SMOOTHING = reducedMotion ? 1 : 0.14
    const SCALE_SMOOTHING = reducedMotion ? 1 : 0.12
    const VELOCITY_SMOOTHING = 0.3
    const VELOCITY_DECAY = 0.88
    const DIRECTION_THRESHOLD = 2

    const lerp = (current: number, target: number, amount: number) => {
      return current + (target - current) * amount
    }

    const angleLerp = (current: number, target: number, amount: number) => {
      let difference = target - current

      while (difference > 180) difference -= 360
      while (difference < -180) difference += 360

      return current + difference * amount
    }

    // ─────────────────────────────────────────────
    // Update cursor color & stroke
    // ─────────────────────────────────────────────
    const updateCursorColors = (targetEl: Element | null) => {
      if (color !== 'auto') {
        if (cursorPath.style.fill !== color) {
          cursorPath.style.fill = color
        }
        if (strokeColor !== 'auto') {
          cursorPath.style.stroke = strokeColor
        }

        return
      }

      // Check cache against last target
      if (targetEl && targetEl === lastTargetElement) {
        if (cursorPath.style.fill !== lastResolvedColor) {
          cursorPath.style.fill = lastResolvedColor
          cursorPath.style.stroke = lastResolvedStroke
        }

        return
      }

      const bg = findElementBackground(targetEl)
      // Dark background -> white cursor; Light background -> dark cursor
      const newFill = bg.brightness < 145 ? '#ffffff' : '#121212'
      const newStroke =
        strokeColor !== 'auto'
          ? strokeColor
          : bg.brightness < 145
            ? 'rgba(0, 0, 0, 0.45)'
            : 'rgba(255, 255, 255, 0.45)'

      lastResolvedColor = newFill
      lastResolvedStroke = newStroke

      if (cursorPath.style.fill !== newFill) {
        cursorPath.style.fill = newFill
      }
      if (cursorPath.style.stroke !== newStroke) {
        cursorPath.style.stroke = newStroke
      }
    }

    // ─────────────────────────────────────────────
    // Scope check
    // ─────────────────────────────────────────────
    const isInsideScope = (target: Element | null): boolean => {
      if (scope === 'body') return true
      if (!target) return false

      return Boolean(target.closest(scope))
    }

    // ─────────────────────────────────────────────
    // Clickable element check
    // ─────────────────────────────────────────────
    const checkClickable = (target: Element | null): boolean => {
      if (!target) return false
      if (target === lastTargetElement) {
        return lastClickableResult
      }
      const result = Boolean(target.closest(clickableSelector))

      lastClickableResult = result

      return result
    }

    // ─────────────────────────────────────────────
    // Direction calculation
    // ─────────────────────────────────────────────
    const updateDirection = () => {
      if (reducedMotion) {
        targetAngle = 0

        return
      }

      const speed = Math.hypot(velocityX, velocityY)

      if (speed < DIRECTION_THRESHOLD) return

      const angle = (Math.atan2(velocityY, velocityX) * 180) / Math.PI

      targetAngle = angle + 90
    }

    // ─────────────────────────────────────────────
    // Animation loop (with intelligent idle sleeping)
    // ─────────────────────────────────────────────
    const animate = () => {
      currentX = lerp(currentX, mouseX, POSITION_SMOOTHING)
      currentY = lerp(currentY, mouseY, POSITION_SMOOTHING)

      velocityX *= VELOCITY_DECAY
      velocityY *= VELOCITY_DECAY

      const speed = Math.hypot(velocityX, velocityY)

      if (mouseDown) {
        targetScale = clickScale
      } else if (speed >= fastThreshold && !reducedMotion) {
        targetScale = fastScale
      } else {
        targetScale = normalScale
      }

      currentAngle = angleLerp(
        currentAngle,
        targetAngle,
        isClickable ? CLICKABLE_ROTATION_SMOOTHING : ROTATION_SMOOTHING
      )

      currentScale = lerp(currentScale, targetScale, SCALE_SMOOTHING)

      // Hardware accelerated transform
      cursor.style.transform = `translate3d(${currentX - 4}px, ${currentY - 4}px, 0) rotate(${currentAngle}deg) scale(${currentScale})`

      // Check if animation has settled to put RAF to sleep
      const distance = Math.hypot(mouseX - currentX, mouseY - currentY)
      const angleDiff = Math.abs(targetAngle - currentAngle)
      const scaleDiff = Math.abs(targetScale - currentScale)

      if (distance < 0.1 && speed < 0.05 && angleDiff < 0.1 && scaleDiff < 0.005) {
        // Snap to exact target values and halt animation loop
        currentX = mouseX
        currentY = mouseY
        currentAngle = targetAngle
        currentScale = targetScale
        cursor.style.transform = `translate3d(${currentX - 4}px, ${currentY - 4}px, 0) rotate(${currentAngle}deg) scale(${currentScale})`
        isAnimating = false

        return
      }

      rafId = requestAnimationFrame(animate)
    }

    const wakeAnimation = () => {
      if (!isAnimating) {
        isAnimating = true
        rafId = requestAnimationFrame(animate)
      }
    }

    // ─────────────────────────────────────────────
    // Event listeners
    // ─────────────────────────────────────────────
    const onMouseMove = (event: MouseEvent) => {
      const target = (event.target as Element) || null

      const insideScope = isInsideScope(target)
      const isOverInput = isTextInputElement(target)
      const hasIgnoreAttr = Boolean(target?.closest?.('[data-cursor-ignore]'))
      const isOverTop = hideOnTop && event.clientY < topOffset

      const shouldBeVisible = insideScope && !isOverInput && !hasIgnoreAttr && !isOverTop

      if (shouldBeVisible !== isVisible) {
        isVisible = shouldBeVisible
        cursor.style.opacity = isVisible ? '1' : '0'
      }

      if (!shouldBeVisible) {
        lastTargetElement = target

        return
      }

      mouseX = event.clientX
      mouseY = event.clientY

      updateCursorColors(target)

      if (!initialized) {
        currentX = mouseX
        currentY = mouseY
        lastMouseX = mouseX
        lastMouseY = mouseY
        initialized = true
        cursor.style.transform = `translate3d(${currentX - 4}px, ${currentY - 4}px, 0) rotate(0deg) scale(${normalScale})`
      }

      const dx = mouseX - lastMouseX
      const dy = mouseY - lastMouseY
      const distance = Math.hypot(dx, dy)

      if (distance > 2) {
        velocityX = velocityX * (1 - VELOCITY_SMOOTHING) + dx * VELOCITY_SMOOTHING
        velocityY = velocityY * (1 - VELOCITY_SMOOTHING) + dy * VELOCITY_SMOOTHING

        lastMouseX = mouseX
        lastMouseY = mouseY

        if (!isClickable) {
          updateDirection()
        }
      }

      const clickable = checkClickable(target)

      lastTargetElement = target

      if (clickable) {
        if (!isClickable) {
          isClickable = true
          targetAngle = 0
        }
      } else if (isClickable) {
        isClickable = false
        velocityX = 0
        velocityY = 0
        lastMouseX = mouseX
        lastMouseY = mouseY
      }

      wakeAnimation()
    }

    const onMouseDown = () => {
      mouseDown = true
      targetScale = clickScale
      wakeAnimation()
    }

    const onMouseUp = () => {
      mouseDown = false
      targetScale = isClickable ? normalScale : normalScale
      wakeAnimation()
    }

    const onMouseLeave = () => {
      isVisible = false
      cursor.style.opacity = '0'
      velocityX = 0
      velocityY = 0
      targetScale = normalScale
      currentScale = normalScale
    }

    const onMouseEnter = (event: MouseEvent) => {
      mouseX = event.clientX
      mouseY = event.clientY
      onMouseMove(event)
    }

    const onWindowBlur = () => {
      isVisible = false
      cursor.style.opacity = '0'
    }

    const onScroll = () => {
      wakeAnimation()
    }

    // Passive listeners for 60/120fps performance
    document.addEventListener('mousemove', onMouseMove, { passive: true })
    document.addEventListener('mousedown', onMouseDown, { passive: true })
    document.addEventListener('mouseup', onMouseUp, { passive: true })
    document.addEventListener('mouseleave', onMouseLeave, { passive: true })
    document.addEventListener('mouseenter', onMouseEnter, { passive: true })
    window.addEventListener('blur', onWindowBlur, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })

    // Initial wake
    wakeAnimation()

    // ─────────────────────────────────────────────
    // Cleanup
    // ─────────────────────────────────────────────
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('mouseleave', onMouseLeave)
      document.removeEventListener('mouseenter', onMouseEnter)
      window.removeEventListener('blur', onWindowBlur)
      window.removeEventListener('scroll', onScroll)

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
    strokeWidth,
    hideNativeCursor,
    disabledOnTouch,
    respectReducedMotion,
  ])

  return (
    <>
      <style>
        {`
          .custom-cursor {
            position: fixed;
            top: 0;
            left: 0;
            width: 24px;
            height: 24px;
            pointer-events: none;
            user-select: none;
            opacity: 0;
            transform-origin: 4px 4px;
            will-change: transform, opacity;
            transition: opacity 0.12s ease-out;
            contain: layout style size;
            filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.35));
          }

          .custom-cursor svg {
            display: block;
            width: 100%;
            height: 100%;
            overflow: visible;
          }

          .custom-cursor path {
            fill: #ffffff;
            stroke: rgba(0, 0, 0, 0.4);
            transition: fill 0.18s ease-out, stroke 0.18s ease-out;
          }

          @media (pointer: fine) {
            html.has-custom-cursor,
            html.has-custom-cursor *:not(input):not(textarea):not(select):not([contenteditable="true"]):not([data-cursor-native]) {
              cursor: none !important;
            }

            html.has-custom-cursor input:not([type="button"]):not([type="submit"]):not([type="reset"]),
            html.has-custom-cursor textarea,
            html.has-custom-cursor [contenteditable="true"],
            html.has-custom-cursor [data-cursor-native] {
              cursor: auto !important;
            }
          }
        `}
      </style>

      <div
        ref={cursorRef}
        aria-hidden="true"
        className={clsx('custom-cursor', className)}
        style={{ zIndex }}
      >
        <svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
          <path
            ref={pathRef}
            d={CURSOR_PATH}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
          />
        </svg>
      </div>
    </>
  )
}

export default CustomCursor
