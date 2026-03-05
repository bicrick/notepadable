import { createEditor } from './editor'
import { saveToURL, saveEncryptedToURL, loadFromURL, debounce, getURLLength, getShareableURL } from './url'
import { initToolbar, updateCapacity, showPasswordPrompt, showToast } from './ui'
import './styles.css'

const editorEl = document.getElementById('editor')!
const editor = createEditor(editorEl, {
  onSave: downloadHTML,
})

function syncToURL() {
  const text = editor.getContent()
  const { urlLength } = saveToURL(text)
  updateCapacity(urlLength)
  updateTitle(text)
}

const debouncedSync = debounce(500, syncToURL)

editor.onUpdate(() => {
  debouncedSync()
})

async function loadContent() {
  const result = loadFromURL()

  if (!result) {
    updateCapacity(getURLLength())
    updateTitle('')
    return
  }

  if (!result.encrypted) {
    if (result.text) {
      editor.setContent(result.text)
    }
    updateCapacity(getURLLength())
    updateTitle(result.text)
    return
  }

  showPasswordPrompt(async (password: string) => {
    try {
      const text = await result.decrypt(password)
      editor.setContent(text)
      updateCapacity(getURLLength())
      updateTitle(text)
      editor.view.focus()
      return true
    } catch {
      return false
    }
  })
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

function updateTitle(text: string) {
  const firstLine = text.split('\n').find(l => l.trim())
  if (firstLine) {
    const cleaned = firstLine.replace(/^#+\s*/, '').trim()
    document.title = cleaned || 'Text Area'
  } else {
    document.title = 'Text Area'
  }
}

function downloadHTML() {
  const text = editor.getContent()
  const title = document.title
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  body { font: 17px/1.6 system-ui, sans-serif; max-width: 720px; margin: 0 auto; padding: 40px 18px; color: #1a1a1a; }
  @media (prefers-color-scheme: dark) { body { background: #0a0a0a; color: #e0e0e0; } }
</style>
</head>
<body>
<pre style="white-space: pre-wrap; font: inherit;">${escapeHtml(text)}</pre>
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
  editor.setContent('')
  history.replaceState(null, '', window.location.pathname)
  try { localStorage.removeItem('text-area-hash') } catch {}
  updateCapacity(window.location.href.length)
  document.title = 'Text Area'
  editor.view.focus()
}

initToolbar({
  onNew: newDocument,
  onDownloadHTML: downloadHTML,
  onDownloadTXT: downloadTXT,
  onEncryptShare: handleEncryptShare,
})

loadContent()
editor.view.focus()

window.addEventListener('hashchange', () => {
  loadContent()
})

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
}
