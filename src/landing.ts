import { marked } from 'marked'
import { initTheme } from './theme-mode'
import './landing.css'

initTheme()

marked.setOptions({ gfm: true, breaks: true })

// Raw markdown to type out, then render
const DEMO_MARKDOWN = `# No server. No database.

Just **text** in the URL.

*Share a link, share the doc.*`

// Real hash for the demo content (from actual compression)
const REAL_HASH =
  'IAAAgQCQiBACID6BAsD4AMqBHAICA0AAcAkSA-2AOkCg1swATQGCwAqrAqABMCYAinxDAABsRAgAAXACrrAMkACAKEBBgIIBRAApI5UkACQUUTAEMQAEpLipASgBxOADqsgA'

const HASH_SUFFIX_LEN = 15
const PREFIX = 'notepadable.com/app#'

const CHAR_DELAY_MS = 35
const PAUSE_BEFORE_RENDER_MS = 600

function getHashForCharCount(count: number): string {
  const progress = Math.min(count / DEMO_MARKDOWN.length, 1)
  const len = Math.max(1, Math.floor(progress * REAL_HASH.length))
  return '#' + REAL_HASH.slice(0, len)
}

function formatUrlDisplay(hash: string): string {
  const hashSeg = hash.startsWith('#') ? hash.slice(1) : hash
  if (hashSeg.length <= HASH_SUFFIX_LEN) {
    return PREFIX + hashSeg
  }
  return PREFIX + '...' + hashSeg.slice(-HASH_SUFFIX_LEN)
}

function escapeHtml(s: string): string {
  const div = document.createElement('div')
  div.textContent = s
  return div.innerHTML
}

function runTypewriter() {
  const textEl = document.getElementById('demo-text')
  const urlEl = document.getElementById('demo-bar-url')
  if (!textEl || !urlEl) return

  let charCount = 0
  let rawText = ''
  const CURSOR = '<span class="demo-cursor" aria-hidden="true"></span>'

  function updateUI() {
    const display = rawText.split('\n').map((line) => escapeHtml(line)).join('<br>')
    textEl!.innerHTML = display + CURSOR
    const hash = getHashForCharCount(charCount)
    urlEl!.href = '/app' + hash
    urlEl!.textContent = formatUrlDisplay(hash)
  }

  function typeNext(): Promise<void> {
    return new Promise((resolve) => {
      function step() {
        if (charCount >= DEMO_MARKDOWN.length) {
          resolve()
          return
        }
        rawText += DEMO_MARKDOWN[charCount]
        charCount++
        updateUI()
        setTimeout(step, CHAR_DELAY_MS)
      }
      step()
    })
  }

  async function run() {
    updateUI()
    await typeNext()
    await new Promise((r) => setTimeout(r, PAUSE_BEFORE_RENDER_MS))
    const rendered = await marked.parse(rawText)
    textEl!.classList.add('demo-rendered')
    textEl!.innerHTML = rendered as string
    const hash = getHashForCharCount(DEMO_MARKDOWN.length)
    urlEl!.href = '/app' + hash
    urlEl!.textContent = formatUrlDisplay(hash)
    urlEl!.classList.remove('demo-bar-url--disabled')
  }

  run()
}

runTypewriter()
