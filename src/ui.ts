import { getShareableURL } from './url'

const FADE_DELAY = 2000
const TOAST_DURATION = 2000

let fadeTimer: ReturnType<typeof setTimeout> | null = null
let toolbar: HTMLElement | null = null
let capacityBar: HTMLElement | null = null
let capacityTooltip: HTMLElement | null = null
let toastEl: HTMLElement | null = null
let downloadDropdown: HTMLElement | null = null

function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

export function initToolbar(callbacks: {
  onNew: () => void
  onDownloadHTML: () => void
  onDownloadTXT: () => void
}) {
  toolbar = document.getElementById('toolbar')!

  toolbar.innerHTML = `
    <div class="toolbar-inner">
      <button class="toolbar-brand" title="New document" aria-label="New document">Text Area</button>
      <div class="toolbar-actions">
        <button class="toolbar-btn" id="btn-share" title="Copy shareable link" aria-label="Share">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 9h-1a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-8a2 2 0 0 0 -2 -2h-1"/>
            <path d="M12 14v-11"/>
            <path d="M9 6l3 -3l3 3"/>
          </svg>
        </button>
        <div class="toolbar-dropdown-wrapper">
          <button class="toolbar-btn" id="btn-download" title="Download" aria-label="Download">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14"/>
              <path d="M18 13l-6 6-6-6"/>
              <path d="M5 20h14"/>
            </svg>
          </button>
          <div class="toolbar-dropdown" id="download-dropdown">
            <button class="dropdown-item" id="dl-html">Save as HTML</button>
            <button class="dropdown-item" id="dl-txt">Save as TXT</button>
          </div>
        </div>
      </div>
    </div>
    <div class="capacity-bar" id="capacity-bar">
      <div class="capacity-fill" id="capacity-fill"></div>
    </div>
    <div class="capacity-tooltip" id="capacity-tooltip"></div>
  `

  capacityBar = document.getElementById('capacity-bar')!
  capacityTooltip = document.getElementById('capacity-tooltip')!
  downloadDropdown = document.getElementById('download-dropdown')!

  const brandBtn = toolbar.querySelector('.toolbar-brand') as HTMLButtonElement
  brandBtn.addEventListener('click', () => {
    callbacks.onNew()
    hideDropdown()
  })

  document.getElementById('btn-share')!.addEventListener('click', () => {
    const url = getShareableURL()
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => showToast('Link copied'))
    }
    hideDropdown()
  })

  document.getElementById('btn-download')!.addEventListener('click', (e) => {
    e.stopPropagation()
    downloadDropdown!.classList.toggle('visible')
  })

  document.getElementById('dl-html')!.addEventListener('click', () => {
    callbacks.onDownloadHTML()
    hideDropdown()
    showToast('Downloaded')
  })

  document.getElementById('dl-txt')!.addEventListener('click', () => {
    callbacks.onDownloadTXT()
    hideDropdown()
    showToast('Downloaded')
  })

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (!target.closest('.toolbar-dropdown-wrapper')) {
      hideDropdown()
    }
  })

  capacityBar!.addEventListener('mouseenter', () => {
    capacityTooltip!.classList.add('visible')
  })
  capacityBar!.addEventListener('mouseleave', () => {
    capacityTooltip!.classList.remove('visible')
  })

  if (!isTouchDevice()) {
    document.addEventListener('mousemove', showToolbar)
    window.addEventListener('scroll', () => {
      if (window.scrollY < 10) showToolbar()
    })
  }

  showToolbar()
}

function hideDropdown() {
  downloadDropdown?.classList.remove('visible')
}

export function showToolbar() {
  if (!toolbar) return
  toolbar.classList.remove('hidden')
  resetFadeTimer()
}

export function hideToolbar() {
  if (!toolbar || isTouchDevice()) return
  toolbar.classList.add('hidden')
  hideDropdown()
}

function resetFadeTimer() {
  if (isTouchDevice()) return
  if (fadeTimer) clearTimeout(fadeTimer)
  fadeTimer = setTimeout(hideToolbar, FADE_DELAY)
}

export function signalTyping() {
  if (!isTouchDevice()) {
    hideToolbar()
  }
}

export function updateCapacity(urlLength: number) {
  if (!capacityBar || !capacityTooltip) return

  const fill = capacityBar.querySelector('.capacity-fill') as HTMLElement
  const safeLimit = 2000
  const warnLimit = 5000
  const maxDisplay = 8000

  const ratio = Math.min(urlLength / maxDisplay, 1)
  fill.style.width = `${ratio * 100}%`

  if (urlLength < safeLimit) {
    fill.style.backgroundColor = '#34c759'
    capacityTooltip.textContent = `${urlLength.toLocaleString()} / ${safeLimit.toLocaleString()} chars -- safe to share anywhere`
  } else if (urlLength < warnLimit) {
    fill.style.backgroundColor = '#f0a500'
    capacityTooltip.textContent = `${urlLength.toLocaleString()} / ${warnLimit.toLocaleString()} chars -- may not work in some apps`
  } else {
    fill.style.backgroundColor = '#e53e3e'
    capacityTooltip.textContent = `${urlLength.toLocaleString()} chars -- URL may be too long to share`
  }
}

export function showToast(message: string) {
  toastEl = document.getElementById('toast')!
  toastEl.textContent = message
  toastEl.classList.add('visible')

  setTimeout(() => {
    toastEl?.classList.remove('visible')
  }, TOAST_DURATION)
}
