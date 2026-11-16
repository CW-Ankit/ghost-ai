import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { printSpecDocument } from '@/lib/print-spec'

describe('printSpecDocument', () => {
  const originalWindow = global.window
  const originalDocument = global.document

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    global.window = originalWindow
    global.document = originalDocument
  })

  it('safely exits with no-op in SSR environments where window is undefined', () => {
    delete (global as any).window
    expect(() =>
      printSpecDocument({
        title: 'SSR Test',
        htmlContent: '<p>test</p>',
      })
    ).not.toThrow()
  })

  it('runs safely in browser environment and appends an isolated print iframe', () => {
    const mockPrint = vi.fn()
    const mockFocus = vi.fn()
    const mockDocWrite = vi.fn()
    const mockDocOpen = vi.fn()
    const mockDocClose = vi.fn()

    const mockIframe: any = {
      style: {},
      setAttribute: vi.fn(),
      contentWindow: {
        focus: mockFocus,
        print: mockPrint,
        document: {
          open: mockDocOpen,
          write: mockDocWrite,
          close: mockDocClose,
        },
      },
    }

    const mockBody = {
      appendChild: vi.fn((node: any) => {
        Object.assign(node, mockIframe)
        return node
      }),
      removeChild: vi.fn(),
      contains: vi.fn(() => true),
    }

    const mockDoc = {
      createElement: vi.fn(() => ({ ...mockIframe })),
      body: mockBody,
    }

    global.window = { print: vi.fn() } as any
    global.document = mockDoc as any

    printSpecDocument({
      title: 'E-Commerce Architecture Specification',
      htmlContent: '<h2>Overview</h2><p>Microservices design</p>',
      createdAt: 1700000000000,
    })

    expect(mockDoc.createElement).toHaveBeenCalledWith('iframe')
    expect(mockBody.appendChild).toHaveBeenCalled()
    expect(mockDocWrite).toHaveBeenCalled()

    const writtenHtml = mockDocWrite.mock.calls[0][0]
    expect(writtenHtml).toContain('E-Commerce Architecture Specification')
    expect(writtenHtml).toContain('Ghost AI Architecture Spec')
    expect(writtenHtml).toContain('<h2>Overview</h2><p>Microservices design</p>')
    expect(writtenHtml).toContain('@page')
    expect(writtenHtml).toContain('break-inside: avoid')

    // Fast-forward timeout to verify print trigger
    vi.advanceTimersByTime(300)
    expect(mockFocus).toHaveBeenCalled()
    expect(mockPrint).toHaveBeenCalled()
  })

  it('handles fallback gracefully when contentWindow document is unavailable', () => {
    const windowPrintMock = vi.fn()
    const mockBody = {
      appendChild: vi.fn((node: any) => node),
      removeChild: vi.fn((node: any) => node),
      contains: vi.fn(() => true),
    }

    const mockDoc = {
      createElement: vi.fn(() => ({
        style: {},
        setAttribute: vi.fn(),
        contentWindow: null, // No contentWindow available
      })),
      body: mockBody,
    }

    global.window = { print: windowPrintMock } as any
    global.document = mockDoc as any

    printSpecDocument({
      title: 'Fallback Spec',
      htmlContent: '<p>Content</p>',
    })

    expect(windowPrintMock).toHaveBeenCalled()
    expect(mockBody.removeChild).toHaveBeenCalled()
  })
})
