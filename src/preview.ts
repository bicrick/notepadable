import { marked, type Tokens } from 'marked'

marked.setOptions({
  gfm: true,
  breaks: true,
})

const renderer = new marked.Renderer()
const originalCode = renderer.code.bind(renderer)

renderer.code = function (token: Tokens.Code): string {
  if (token.lang === 'mermaid') {
    return `<div class="mermaid-block"><pre class="mermaid">${escapeHtml(token.text)}</pre></div>`
  }
  return originalCode(token) as string
}

marked.use({ renderer })

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

let mermaidMod: { default: { initialize: (opts: Record<string, unknown>) => void; run: (opts: { nodes: NodeListOf<Element> }) => Promise<void> } } | null = null

async function loadMermaid() {
  if (mermaidMod) return
  try {
    // @ts-ignore -- CDN dynamic import
    mermaidMod = await import('https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs')
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    mermaidMod!.default.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
      securityLevel: 'loose',
    })
  } catch {
    // CDN unavailable -- mermaid blocks stay as raw text
  }
}

async function renderMermaidBlocks(container: HTMLElement) {
  const blocks = container.querySelectorAll('pre.mermaid')
  if (blocks.length === 0) return

  await loadMermaid()
  if (!mermaidMod) return

  try {
    await mermaidMod.default.run({ nodes: blocks as NodeListOf<Element> })
  } catch {
    // Graceful failure
  }
}

export async function renderPreview(container: HTMLElement, markdown: string): Promise<void> {
  const html = await Promise.resolve(marked.parse(markdown))
  container.innerHTML = html
  await renderMermaidBlocks(container)
}

export async function getRenderedHTML(markdown: string): Promise<string> {
  return await Promise.resolve(marked.parse(markdown))
}
