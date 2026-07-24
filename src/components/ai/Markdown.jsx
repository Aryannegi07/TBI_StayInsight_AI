import { memo } from 'react'

// ─── Markdown ──────────────────────────────────────────────────────────────
// A small, dependency-free Markdown renderer for AI-generated text
// (host replies, suggestions). Gemini output is short-form (a paragraph or
// a few list items) so we only support the subset of Markdown that's
// actually useful here — no need to pull in a full parser for it:
//   • **bold** and *italic*
//   • `inline code`
//   • [links](https://…)   — http(s) only, everything else is rendered as
//     plain text to avoid javascript:/data: URL injection
//   • - / * bullet lists and 1. numbered lists
//   • ## headings
//   • paragraphs separated by blank lines, single line breaks preserved

function renderInline(text, keyPrefix) {
  // Split on the inline patterns we support, keeping the delimiters so we
  // can render each piece appropriately. Order matters: code first (so
  // ** inside `code` isn't treated as bold), then links, then bold, then
  // italic.
  const pattern = /(`[^`]+`|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*)/g
  const parts = text.split(pattern).filter((p) => p !== '')

  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={key} className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-[0.85em] font-mono">
          {part.slice(1, -1)}
        </code>
      )
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (linkMatch) {
      const [, label, href] = linkMatch
      if (/^https?:\/\//i.test(href)) {
        return (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 dark:text-brand-400 underline underline-offset-2 hover:text-brand-700 dark:hover:text-brand-300"
          >
            {label}
          </a>
        )
      }
      return <span key={key}>{label}</span>
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={key} className="font-semibold text-gray-900 dark:text-gray-100">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={key}>{part.slice(1, -1)}</em>
    }
    return <span key={key}>{part}</span>
  })
}

function parseBlocks(source) {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (!line.trim()) { i += 1; continue }

    // Heading
    const heading = line.match(/^(#{1,3})\s+(.*)$/)
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] })
      i += 1
      continue
    }

    // List (bullet or numbered) — consume consecutive list lines
    const isBullet = /^\s*[-*]\s+/.test(line)
    const isNumbered = /^\s*\d+\.\s+/.test(line)
    if (isBullet || isNumbered) {
      const items = []
      while (i < lines.length && (/^\s*[-*]\s+/.test(lines[i]) || /^\s*\d+\.\s+/.test(lines[i]))) {
        items.push(lines[i].replace(/^\s*(?:[-*]|\d+\.)\s+/, ''))
        i += 1
      }
      blocks.push({ type: isNumbered ? 'ol' : 'ul', items })
      continue
    }

    // Paragraph — consume until a blank line or a new block starts
    const paraLines = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,3})\s+/.test(lines[i]) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i])
      i += 1
    }
    blocks.push({ type: 'p', text: paraLines.join('\n') })
  }

  return blocks
}

function Markdown({ children, className = '' }) {
  if (!children || typeof children !== 'string') return null
  const blocks = parseBlocks(children)

  return (
    <div className={`space-y-2 ${className}`}>
      {blocks.map((block, i) => {
        const key = `block-${i}`
        if (block.type === 'heading') {
          const sizes = { 1: 'text-base font-semibold', 2: 'text-sm font-semibold', 3: 'text-sm font-medium' }
          return (
            <p key={key} className={`${sizes[block.level]} text-gray-900 dark:text-gray-100`}>
              {renderInline(block.text, key)}
            </p>
          )
        }
        if (block.type === 'ul') {
          return (
            <ul key={key} className="list-disc list-outside pl-5 space-y-1">
              {block.items.map((item, j) => (
                <li key={`${key}-${j}`}>{renderInline(item, `${key}-${j}`)}</li>
              ))}
            </ul>
          )
        }
        if (block.type === 'ol') {
          return (
            <ol key={key} className="list-decimal list-outside pl-5 space-y-1">
              {block.items.map((item, j) => (
                <li key={`${key}-${j}`}>{renderInline(item, `${key}-${j}`)}</li>
              ))}
            </ol>
          )
        }
        return (
          <p key={key} className="whitespace-pre-line leading-relaxed">
            {renderInline(block.text, key)}
          </p>
        )
      })}
    </div>
  )
}

export default memo(Markdown)
