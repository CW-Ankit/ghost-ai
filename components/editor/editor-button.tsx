'use client'

import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const editorButtonVariants = cva(
  'inline-flex shrink-0 items-center justify-center rounded-xl border-0 text-sm font-medium whitespace-nowrap select-none transition-[transform,filter,box-shadow,background-color,color] duration-200 active:not-disabled:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      tone: {
        primary:
          'bg-[linear-gradient(180deg,#23bfd0_0%,#0b9aa8_100%)] font-semibold text-bg-base shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_8px_20px_-6px_rgba(11,154,168,0.38)] hover:brightness-105',
        primarySoft:
          'bg-[linear-gradient(180deg,rgba(122,196,207,0.18)_0%,rgba(56,120,132,0.11)_100%)] text-[#bce6ec] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_6px_14px_-6px_rgba(0,0,0,0.7)] hover:brightness-110',
        surface:
          'bg-[linear-gradient(180deg,#2d2c36_0%,#1b1a21_100%)] text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_8px_18px_-6px_rgba(0,0,0,0.85)] hover:bg-[linear-gradient(180deg,#353440_0%,#222129_100%)]',
        socket:
          'bg-[linear-gradient(180deg,#2a2a33_0%,#16161c_100%)] text-text-secondary shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_6px_14px_-4px_rgba(0,0,0,0.85)] hover:bg-[linear-gradient(180deg,#343440_0%,#1e1e26_100%)] hover:text-text-primary',
        ai:
          'bg-[linear-gradient(180deg,#7c71ff_0%,#6457f9_100%)] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.34),0_8px_20px_-6px_rgba(100,87,249,0.45)] hover:brightness-110',
        aiSoft:
          'bg-[linear-gradient(180deg,rgba(100,87,249,0.28)_0%,rgba(100,87,249,0.14)_100%)] text-accent-ai-text shadow-[inset_0_1px_0_rgba(139,130,255,0.35),0_6px_16px_-6px_rgba(100,87,249,0.35)] hover:brightness-110',
        destructive:
          'bg-[linear-gradient(180deg,#ff686a_0%,#e5393c_100%)] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_8px_20px_-6px_rgba(255,77,79,0.4)] hover:brightness-105',
        ghost3d:
          'bg-transparent text-text-secondary shadow-none hover:bg-[linear-gradient(180deg,#2d2c36_0%,#1b1a21_100%)] hover:text-text-primary hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_4px_12px_-4px_rgba(0,0,0,0.75)]',
      },
      size: {
        xs: 'h-7 gap-1.5 px-2.5 text-xs',
        sm: 'h-8 gap-1.5 px-3 text-xs',
        md: 'h-9 gap-2 px-3.5 text-sm',
        lg: 'h-11 gap-2 px-5 text-sm',
        icon: 'h-8 w-8 p-0',
        'icon-sm': 'h-7 w-7 p-0',
        'icon-md': 'h-9 w-9 p-0',
        'icon-lg': 'h-11 w-11 p-0',
      },
    },
    defaultVariants: {
      tone: 'surface',
      size: 'md',
    },
  }
)

export type EditorButtonTone = NonNullable<VariantProps<typeof editorButtonVariants>['tone']>
export type EditorButtonSize = NonNullable<VariantProps<typeof editorButtonVariants>['size']>

export function editorButtonClass({
  tone,
  size,
  className,
}: {
  tone?: EditorButtonTone
  size?: EditorButtonSize
  className?: string
} = {}) {
  return cn(editorButtonVariants({ tone, size }), className)
}

export type EditorButtonProps = ButtonPrimitive.Props & VariantProps<typeof editorButtonVariants>

export function EditorButton({ tone, size, className, ...props }: EditorButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(editorButtonVariants({ tone, size }), className)}
      {...props}
    />
  )
}
