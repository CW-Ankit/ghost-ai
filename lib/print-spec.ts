interface PrintSpecOptions {
  title: string
  htmlContent: string
  createdAt?: number | string
}

export function printSpecDocument({ title, htmlContent, createdAt }: PrintSpecOptions): void {
  if (typeof window === 'undefined') return

  // Create isolated hidden iframe for printing
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.setAttribute('aria-hidden', 'true')
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (!doc) {
    document.body.removeChild(iframe)
    window.print()
    return
  }

  const dateStr = createdAt
    ? new Date(createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

  doc.open()
  doc.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm 15mm 20mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      line-height: 1.6;
      font-size: 11pt;
      padding: 0;
      margin: 0;
    }
    .header-meta {
      border-bottom: 2px solid #00c8d4;
      padding-bottom: 12px;
      margin-bottom: 24px;
    }
    .brand-badge {
      display: inline-block;
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #008791;
      margin-bottom: 6px;
    }
    h1 {
      font-size: 20pt;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 6px 0;
      line-height: 1.25;
      page-break-after: avoid;
      break-after: avoid;
    }
    .spec-date {
      font-size: 9pt;
      color: #64748b;
    }
    h2 {
      font-size: 14pt;
      font-weight: 600;
      color: #1e293b;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-top: 24px;
      margin-bottom: 12px;
      page-break-after: avoid;
      break-after: avoid;
    }
    h3 {
      font-size: 11.5pt;
      font-weight: 600;
      color: #334155;
      margin-top: 18px;
      margin-bottom: 8px;
      page-break-after: avoid;
      break-after: avoid;
    }
    p {
      margin: 0 0 10px 0;
      color: #334155;
    }
    ul, ol {
      margin: 0 0 12px 0;
      padding-left: 20px;
      color: #334155;
    }
    li {
      margin-bottom: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 10pt;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
      text-align: left;
    }
    th {
      background-color: #f1f5f9;
      font-weight: 600;
      color: #0f172a;
    }
    pre {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
      font-family: Consolas, Monaco, "Courier New", monospace;
      font-size: 9pt;
      overflow-x: auto;
      page-break-inside: avoid;
      break-inside: avoid;
      margin: 12px 0;
    }
    code {
      font-family: Consolas, Monaco, "Courier New", monospace;
      font-size: 9pt;
      background-color: #f1f5f9;
      padding: 2px 4px;
      border-radius: 4px;
      color: #0f172a;
    }
    pre code {
      background-color: transparent;
      padding: 0;
    }
    blockquote {
      border-left: 3px solid #00c8d4;
      padding-left: 12px;
      margin: 12px 0;
      color: #475569;
      font-style: italic;
    }
    .footer-note {
      margin-top: 36px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      font-size: 8.5pt;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="header-meta">
    <div class="brand-badge">Ghost AI Architecture Spec</div>
    <h1>${title}</h1>
    <div class="spec-date">Generated on ${dateStr}</div>
  </div>
  <div class="spec-content">
    ${htmlContent}
  </div>
  <div class="footer-note">
    <span>Ghost AI — Collaborative System Architecture Platform</span>
    <span>Technical Specification</span>
  </div>
</body>
</html>`)
  doc.close()

  // Wait for rendering then invoke print
  setTimeout(() => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe)
      }
    }, 2000)
  }, 250)
}
