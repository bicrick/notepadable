import { selectAll } from '@codemirror/commands'
import { createEditor } from './editor'
import { saveToURL, saveEncryptedToURL, loadFromURL, debounce, getURLLength, getShareableURL } from './url'
import { initToolbar, updateCapacity, showPasswordPrompt, showToast, setPreviewMode, setPreviewButtonVisible, collapseFooterPanel } from './ui'
import { renderPreview, getRenderedHTML } from './preview'
import { hasMarkdown } from './markdown-detect'
import { initTheme, THEME_CHANGE_EVENT } from './theme-mode'
import './styles.css'

initTheme()

// Keep footer above virtual keyboard on mobile
function updateKeyboardOffset() {
  const vv = window.visualViewport
  if (!vv) return
  const keyboardHeight = Math.max(0, window.innerHeight - vv.height)
  document.documentElement.style.setProperty('--keyboard-offset', `${keyboardHeight}px`)
  if (keyboardHeight > 0) collapseFooterPanel()
}
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', updateKeyboardOffset)
  updateKeyboardOffset()
}

const editorEl = document.getElementById('editor')!
const previewEl = document.getElementById('preview')!
const editor = createEditor(editorEl, {
  onSave: downloadHTML,
})

let isPreviewMode = false
const isSharedLink = window.location.hash.length > 1

function syncToURL() {
  const text = editor.getContent()
  const { urlLength } = saveToURL(text)
  updateCapacity(urlLength)
  updateTitle(text)
  updatePreviewButton(text)
}

function updatePreviewButton(text: string) {
  const md = hasMarkdown(text)
  setPreviewButtonVisible(md)
  if (!md && isPreviewMode) {
    isPreviewMode = false
    setPreviewMode(false)
    previewEl.style.display = 'none'
    editorEl.style.display = ''
    editor.view.focus()
  }
}

const debouncedSync = debounce(500, syncToURL)

editor.onUpdate(() => {
  debouncedSync()
})

previewEl.addEventListener('click', (e) => {
  if (e.detail === 3 && isPreviewMode) {
    togglePreview()
  }
})

async function enterPreview(text: string) {
  isPreviewMode = true
  setPreviewMode(true)
  editorEl.style.display = 'none'
  previewEl.style.display = ''
  await renderPreview(previewEl, text)
}

async function loadContent() {
  const fromHash = window.location.hash.length > 1
  const result = loadFromURL()

  if (!result) {
    updateCapacity(getURLLength())
    updateTitle('')
    setPreviewButtonVisible(false)
    return
  }

  if (!result.encrypted) {
    const text = result.text
    if (text) {
      editor.setContent(text)
    }
    updateCapacity(getURLLength())
    updateTitle(text)

    const md = hasMarkdown(text)
    setPreviewButtonVisible(md)
    if (fromHash && isSharedLink) {
      setPreviewButtonVisible(true)
      await enterPreview(text)
    }
    return
  }

  showPasswordPrompt(async (password: string) => {
    try {
      const text = await result.decrypt(password)
      editor.setContent(text)
      updateCapacity(getURLLength())
      updateTitle(text)

      const md = hasMarkdown(text)
      setPreviewButtonVisible(md)
      if (fromHash && isSharedLink) {
        setPreviewButtonVisible(true)
        await enterPreview(text)
      } else {
        editor.view.focus()
      }
      return true
    } catch {
      return false
    }
  })
}

async function togglePreview() {
  isPreviewMode = !isPreviewMode
  setPreviewMode(isPreviewMode)

  if (isPreviewMode) {
    const text = editor.getContent()
    editorEl.style.display = 'none'
    previewEl.style.display = ''
    await renderPreview(previewEl, text)
  } else {
    previewEl.style.display = 'none'
    editorEl.style.display = ''
    editor.view.focus()
  }
}

async function handleEncryptShare(password: string): Promise<void> {
  const text = editor.getContent()
  if (!text) return

  const { urlLength } = await saveEncryptedToURL(text, password)
  updateCapacity(urlLength)

  const url = getShareableURL()
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(url)
  }
}

async function handleEncryptRaw(password: string): Promise<string> {
  const text = editor.getContent()
  if (!text) return ''

  const { hash, urlLength } = await saveEncryptedToURL(text, password)
  updateCapacity(urlLength)

  return `${window.location.origin}/raw/${hash}?p=${encodeURIComponent(password)}`
}

function updateTitle(text: string) {
  const firstLine = text.split('\n').find(l => l.trim())
  if (firstLine) {
    const cleaned = firstLine.replace(/^#+\s*/, '').trim()
    document.title = cleaned || 'notepadable'
  } else {
    document.title = 'notepadable'
  }
}

async function downloadHTML() {
  const text = editor.getContent()
  const title = document.title
  const renderedBody = await getRenderedHTML(text)

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  body { font: 17px/1.6 system-ui, sans-serif; max-width: 720px; margin: 0 auto; padding: 40px 18px; color: #1a1a1a; }
  @media (prefers-color-scheme: dark) { body { background: #1a1a1a; color: #e0e0e0; } }
  pre { background: rgba(0,0,0,0.05); padding: 16px; border-radius: 6px; overflow-x: auto; }
  code { font-family: ui-monospace, monospace; font-size: 0.9em; }
  blockquote { border-left: 3px solid rgba(0,0,0,0.15); padding-left: 16px; margin-left: 0; opacity: 0.85; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid rgba(0,0,0,0.12); padding: 8px 12px; text-align: left; }
  img { max-width: 100%; }
</style>
</head>
<body>
${renderedBody}
</body>
</html>`

  downloadFile(html, title + '.html', 'text/html')
}

function downloadTXT() {
  const text = editor.getContent()
  const title = document.title
  downloadFile(text, title + '.txt', 'text/plain')
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function newDocument() {
  if (isPreviewMode) {
    isPreviewMode = false
    setPreviewMode(false)
    previewEl.style.display = 'none'
    editorEl.style.display = ''
  }
  editor.setContent('')
  history.replaceState(null, '', window.location.pathname)
  try { localStorage.removeItem('text-area-hash') } catch {}
  updateCapacity(window.location.href.length)
  setPreviewButtonVisible(false)
  document.title = 'notepadable'
  editor.view.focus()
}

initToolbar({
  onNew: newDocument,
  onDownloadHTML: downloadHTML,
  onDownloadTXT: downloadTXT,
  onEncryptShare: handleEncryptShare,
  onEncryptRaw: handleEncryptRaw,
  onTogglePreview: togglePreview,
})

loadContent()
if (!isPreviewMode) {
  editor.view.focus()
}

document.addEventListener('keydown', (e) => {
  if (!isPreviewMode && e.key === 'a' && (e.metaKey || e.ctrlKey)) {
    if (editorEl.contains(document.activeElement)) {
      e.preventDefault()
      selectAll(editor.view)
    }
  }
})

window.addEventListener('hashchange', () => {
  loadContent()
})

window.addEventListener(THEME_CHANGE_EVENT, () => {
  if (isPreviewMode) {
    renderPreview(previewEl, editor.getContent())
  }
})

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
}
