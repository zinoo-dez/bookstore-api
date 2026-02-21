import DOMPurify from 'dompurify'
import { generateHTML, generateJSON } from '@tiptap/html'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import TiptapUnderline from '@tiptap/extension-underline'
import TiptapImage from '@tiptap/extension-image'
import TiptapLink from '@tiptap/extension-link'

const tiptapExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2] },
  }),
  TextAlign.configure({
    types: ['heading', 'paragraph', 'blockquote'],
    alignments: ['left', 'center', 'right'],
  }),
  TiptapUnderline,
  TiptapImage.configure({ inline: false }),
  TiptapLink.configure({
    openOnClick: false,
    autolink: true,
    defaultProtocol: 'https',
  }),
]

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const renderInline = (raw: string) => {
  let text = escapeHtml(raw)

  text = text.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, (_m: string, alt: string, url: string) => {
    return `<img src="${url}" alt="${alt}" class="my-4 w-full rounded-xl border border-slate-200 dark:border-slate-700" />`
  })
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m: string, label: string, url: string) => {
    return `<a href="${url}" target="_blank" rel="noreferrer" class="font-medium text-primary-700 underline decoration-primary-400/60 underline-offset-2 dark:text-amber-300 dark:decoration-amber-300/60">${label}</a>`
  })
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
  text = text.replace(/`([^`]+)`/g, '<code class="rounded bg-slate-100 px-1 py-0.5 text-[0.92em] dark:bg-slate-800">$1</code>')

  return text
}

const startsSpecialBlock = (line: string) => {
  const trimmed = line.trimStart()
  return (
    trimmed.startsWith('```') ||
    trimmed.startsWith('# ') ||
    trimmed.startsWith('## ') ||
    trimmed.startsWith('> ')
  )
}

type TipTapContentPayload = {
  kind: 'TIPTAP_JSON'
  version: 1
  json: Record<string, unknown>
}

type RichBlogContentPayload = {
  kind: 'RICH_BLOG_CONTENT'
  version: 1
  html: string
  text: string
}

const normalizeContentInput = (content: unknown) => {
  if (typeof content === 'string') return content
  if (content === null || content === undefined) return ''
  try {
    return JSON.stringify(content)
  } catch {
    return String(content)
  }
}

const parseTipTapContent = (content: unknown): TipTapContentPayload | null => {
  const normalized = normalizeContentInput(content)
  const trimmed = normalized.trim()
  if (!trimmed.startsWith('{')) return null
  try {
    const parsed = JSON.parse(trimmed) as Partial<TipTapContentPayload>
    if (
      parsed.kind === 'TIPTAP_JSON' &&
      parsed.version === 1 &&
      typeof parsed.json === 'object' &&
      parsed.json !== null
    ) {
      return parsed as TipTapContentPayload
    }
  } catch {
    return null
  }
  return null
}

const parseRichBlogContent = (content: unknown): RichBlogContentPayload | null => {
  const normalized = normalizeContentInput(content)
  const trimmed = normalized.trim()
  if (!trimmed.startsWith('{')) return null

  try {
    const parsed = JSON.parse(trimmed) as Partial<RichBlogContentPayload>
    if (
      parsed.kind === 'RICH_BLOG_CONTENT' &&
      parsed.version === 1 &&
      typeof parsed.html === 'string' &&
      typeof parsed.text === 'string'
    ) {
      return parsed as RichBlogContentPayload
    }
  } catch {
    return null
  }

  return null
}

const toPlainText = (value: string) =>
  value
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const htmlToPlainText = (html: string) => {
  if (!html.trim()) return ''
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  return toPlainText(doc.body.textContent || '')
}

const appendClasses = (element: Element, classes: string) => {
  const existing = element.getAttribute('class') || ''
  const merged = `${existing} ${classes}`.trim().replace(/\s+/g, ' ')
  element.setAttribute('class', merged)
}

const sanitizeHtml = (html: string) => DOMPurify.sanitize(html, {
  ALLOWED_TAGS: [
    'a', 'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'blockquote', 'pre', 'code',
    'h1', 'h2', 'ul', 'ol', 'li', 'img', 'span', 'div',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'style', 'loading'],
})

const normalizeRichHtml = (html: string) => {
  if (!html.trim()) return ''
  const safeHtml = sanitizeHtml(html)

  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div data-rich-root="1">${safeHtml}</div>`, 'text/html')
  const root = doc.body.querySelector('[data-rich-root="1"]') as HTMLElement | null
  if (!root) return safeHtml

  Array.from(root.childNodes).forEach((node) => {
    if (node.nodeType !== Node.TEXT_NODE) return
    const text = node.textContent?.trim() || ''
    if (!text) {
      root.removeChild(node)
      return
    }
    const paragraph = doc.createElement('p')
    paragraph.textContent = text
    root.replaceChild(paragraph, node)
  })

  root.querySelectorAll('h1').forEach((el) => appendClasses(el, 'mt-10 mb-4 text-4xl font-semibold tracking-tight'))
  root.querySelectorAll('h2').forEach((el) => appendClasses(el, 'mt-8 mb-3 text-3xl font-semibold tracking-tight'))
  root.querySelectorAll('blockquote').forEach((el) => appendClasses(el, 'my-5 border-l-4 border-slate-300 pl-4 italic text-slate-700 dark:border-slate-600 dark:text-slate-300'))
  root.querySelectorAll('pre').forEach((el) => appendClasses(el, 'my-5 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 dark:border-slate-700 dark:bg-slate-900/70'))
  root.querySelectorAll('p').forEach((el) => appendClasses(el, 'my-4'))
  root.querySelectorAll('div').forEach((el) => {
    if (!el.closest('pre')) appendClasses(el, 'my-4')
  })
  root.querySelectorAll('code').forEach((el) => {
    if (el.parentElement?.tagName.toLowerCase() !== 'pre') {
      appendClasses(el, 'rounded bg-slate-100 px-1 py-0.5 text-[0.92em] dark:bg-slate-800')
    }
  })
  root.querySelectorAll('img').forEach((el) => {
    appendClasses(el, 'my-4 w-full rounded-xl border border-slate-200 dark:border-slate-700')
    el.setAttribute('loading', 'lazy')
  })
  root.querySelectorAll('a').forEach((el) => {
    appendClasses(el, 'font-medium text-primary-700 underline decoration-primary-400/70 underline-offset-2 dark:text-amber-300 dark:decoration-amber-300/60')
    el.setAttribute('target', '_blank')
    el.setAttribute('rel', 'noreferrer')
  })
  root.querySelectorAll('ul').forEach((el) => appendClasses(el, 'my-4 list-disc pl-6'))
  root.querySelectorAll('ol').forEach((el) => appendClasses(el, 'my-4 list-decimal pl-6'))
  root.querySelectorAll('li').forEach((el) => appendClasses(el, 'my-1'))

  return root.innerHTML
}

export const renderSimpleMarkdown = (content: string) => {
  const normalized = normalizeContentInput(content).replace(/\r\n/g, '\n')
  const lines = normalized.split('\n')
  const chunks: string[] = []
  let idx = 0

  while (idx < lines.length) {
    const line = lines[idx]
    const trimmed = line.trimStart()

    if (!trimmed) {
      idx += 1
      continue
    }

    if (trimmed.startsWith('```')) {
      idx += 1
      const codeLines: string[] = []
      while (idx < lines.length && !lines[idx].trimStart().startsWith('```')) {
        codeLines.push(lines[idx])
        idx += 1
      }
      if (idx < lines.length) idx += 1
      chunks.push(`<pre class="my-5 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 dark:border-slate-700 dark:bg-slate-900/70"><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
      continue
    }

    if (trimmed.startsWith('## ')) {
      chunks.push(`<h2 class="mt-8 text-3xl font-semibold tracking-tight">${renderInline(trimmed.slice(3))}</h2>`)
      idx += 1
      continue
    }

    if (trimmed.startsWith('# ')) {
      chunks.push(`<h1 class="mt-9 text-4xl font-semibold tracking-tight">${renderInline(trimmed.slice(2))}</h1>`)
      idx += 1
      continue
    }

    if (trimmed.startsWith('> ')) {
      const quoteLines: string[] = []
      while (idx < lines.length && lines[idx].trimStart().startsWith('> ')) {
        quoteLines.push(lines[idx].trimStart().slice(2))
        idx += 1
      }
      const quote = quoteLines.map(renderInline).join('<br />')
      chunks.push(`<blockquote class="my-5 border-l-4 border-slate-300 pl-4 text-slate-700 italic dark:border-slate-600 dark:text-slate-300">${quote}</blockquote>`)
      continue
    }

    const paragraphLines: string[] = []
    while (idx < lines.length && lines[idx].trim() && !startsSpecialBlock(lines[idx])) {
      paragraphLines.push(lines[idx])
      idx += 1
    }
    const paragraph = paragraphLines.map(renderInline).join('<br />')
    chunks.push(`<p class="my-4">${paragraph}</p>`)
  }

  return chunks.join('\n')
}

export const markdownToEditableHtml = (content: string) => {
  const rendered = renderSimpleMarkdown(content).replace(/\sclass="[^"]*"/g, '').trim()
  return rendered || '<p><br></p>'
}

export const editorJsonToStoredContent = (json: Record<string, unknown>) => {
  if (!json || Object.keys(json).length === 0) return ''
  return JSON.stringify({
    kind: 'TIPTAP_JSON',
    version: 1,
    json,
  } satisfies TipTapContentPayload)
}

export const getStoredContentText = (content: unknown) => {
  const tiptap = parseTipTapContent(content)
  if (tiptap) {
    const html = generateHTML(tiptap.json, tiptapExtensions)
    return htmlToPlainText(html)
  }

  const rich = parseRichBlogContent(content)
  if (rich) return toPlainText(rich.text)

  return toPlainText(normalizeContentInput(content))
}

export const renderStoredContentHtml = (content: unknown) => {
  const tiptap = parseTipTapContent(content)
  if (tiptap) {
    const html = generateHTML(tiptap.json, tiptapExtensions)
    return normalizeRichHtml(html)
  }

  const rich = parseRichBlogContent(content)
  if (rich) return normalizeRichHtml(rich.html)

  return renderSimpleMarkdown(normalizeContentInput(content))
}

export const editableHtmlFromStoredContent = (content: unknown) => {
  const tiptap = parseTipTapContent(content)
  if (tiptap) return sanitizeHtml(generateHTML(tiptap.json, tiptapExtensions)).trim() || '<p><br></p>'

  const rich = parseRichBlogContent(content)
  if (rich) return sanitizeHtml(rich.html).trim() || '<p><br></p>'

  return markdownToEditableHtml(normalizeContentInput(content))
}

const compressBreaks = (value: string) =>
  value
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim()

const nodesToMarkdown = (nodes: NodeListOf<ChildNode> | ChildNode[]): string => {
  const list = Array.from(nodes)
  return list.map((node) => nodeToMarkdown(node)).join('')
}

const nodeToMarkdown = (node: ChildNode): string => {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || ''
  if (node.nodeType !== Node.ELEMENT_NODE) return ''

  const el = node as HTMLElement
  const tag = el.tagName.toLowerCase()
  const inner = nodesToMarkdown(el.childNodes).trim()

  if (tag === 'br') return '\n'
  if (tag === 'strong' || tag === 'b') return `**${inner}**`
  if (tag === 'em' || tag === 'i') return `*${inner}*`
  if (tag === 'code' && el.parentElement?.tagName.toLowerCase() !== 'pre') return `\`${inner}\``
  if (tag === 'a') {
    const href = el.getAttribute('href') || 'https://'
    const label = inner || href
    return `[${label}](${href})`
  }
  if (tag === 'img') {
    const src = el.getAttribute('src') || ''
    if (!src) return ''
    const alt = el.getAttribute('alt') || 'image'
    return `![${alt}](${src})`
  }
  if (tag === 'h1') return `# ${inner}\n\n`
  if (tag === 'h2') return `## ${inner}\n\n`
  if (tag === 'blockquote') {
    const lines = inner.split('\n').map((line) => line.trim()).filter(Boolean)
    return `${lines.map((line) => `> ${line}`).join('\n')}\n\n`
  }
  if (tag === 'pre') {
    const code = el.textContent || ''
    return `\`\`\`\n${code.trim()}\n\`\`\`\n\n`
  }
  if (tag === 'p' || tag === 'div') {
    const value = nodesToMarkdown(el.childNodes).trim()
    if (!value) return '\n'
    return `${value}\n\n`
  }
  return inner
}

export const editorHtmlToMarkdown = (html: string) => {
  if (!html.trim()) return ''
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  return compressBreaks(nodesToMarkdown(doc.body.childNodes))
}

export const editorHtmlToStoredContent = (html: string) => {
  const trimmed = html.trim()
  if (!trimmed) return ''
  try {
    const json = generateJSON(sanitizeHtml(trimmed), tiptapExtensions)
    return editorJsonToStoredContent(json as Record<string, unknown>)
  } catch {
    const parser = new DOMParser()
    const doc = parser.parseFromString(trimmed, 'text/html')
    const rootHtml = sanitizeHtml(doc.body.innerHTML.trim())
    const text = toPlainText(doc.body.textContent || '')
    if (!text) return ''
    return JSON.stringify({
      kind: 'RICH_BLOG_CONTENT',
      version: 1,
      html: rootHtml,
      text,
    } satisfies RichBlogContentPayload)
  }
}
