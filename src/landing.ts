import { marked } from 'marked'
import { initTheme } from './theme-mode'
import './landing.css'

initTheme()

marked.setOptions({ gfm: true, breaks: true })

// Raw markdown to type out, then render
const DEMO_MARKDOWN = `# The door was open.

She walked in. **Nothing** there.

Except a note. It said: *Hello*.`

// Hash progression: grows with character count (simulates compression)
const HASH_STEPS = [
  '#',
  '#H4s',
  '#H4sIA',
  '#H4sIAAAA',
  '#H4sIAAAAA',
  '#H4sIAAAAAC',
  '#H4sIAAAAACm',
  '#H4sIAAAAACmK',
  '#H4sIAAAAACmKs',
  '#H4sIAAAAACmKs8',
  '#H4sIAAAAACmKs8X',
  '#H4sIAAAAACmKs8Xm',
  '#H4sIAAAAACmKs8Xm9',
  '#H4sIAAAAACmKs8Xm9Q',
  '#H4sIAAAAACmKs8Xm9Q8',
  '#H4sIAAAAACmKs8Xm9Q8m',
  '#H4sIAAAAACmKs8Xm9Q8mAA',
  '#H4sIAAAAACmKs8Xm9Q8mAAA',
]

const CHAR_DELAY_MS = 35
const PAUSE_BEFORE_RENDER_MS = 600

function getHashForCharCount(count: number): string {
  const idx = Math.min(
    Math.floor((count / DEMO_MARKDOWN.length) * HASH_STEPS.length),
    HASH_STEPS.length - 1
  )
  return HASH_STEPS[idx]
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
    urlEl!.textContent = `notepadable.com/app${getHashForCharCount(charCount)}`
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
    urlEl!.textContent = `notepadable.com/app${getHashForCharCount(DEMO_MARKDOWN.length)}`
  }

  run()
}

runTypewriter()
