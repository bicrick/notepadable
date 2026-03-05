import { getShareableURL } from './url'

const TOAST_DURATION = 2000

let footer: HTMLElement | null = null
let capacityFill: HTMLElement | null = null
let capacityLabel: HTMLElement | null = null
let toastEl: HTMLElement | null = null
let downloadDropdown: HTMLElement | null = null

export function initToolbar(callbacks: {
  onNew: () => void
  onDownloadHTML: () => void
  onDownloadTXT: () => void
}) {
  footer = document.getElementById('footer')!

  footer.innerHTML = `
    <div class="capacity-bar">
      <div class="capacity-fill" id="capacity-fill"></div>
    </div>
    <div class="footer-inner">
      <button class="footer-brand" title="New document" aria-label="New document">Text Area</button>
      <div class="footer-actions">
        <span class="capacity-label" id="capacity-label"></span>
        <button class="footer-btn" id="btn-share" title="Copy shareable link" aria-label="Share">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 9h-1a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-8a2 2 0 0 0 -2 -2h-1"/>
            <path d="M12 14v-11"/>
            <path d="M9 6l3 -3l3 3"/>
          </svg>
        </button>
        <div class="footer-dropdown-wrapper">
          <button class="footer-btn" id="btn-download" title="Download" aria-label="Download">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14"/>
              <path d="M18 13l-6 6-6-6"/>
              <path d="M5 20h14"/>
            </svg>
          </button>
          <div class="footer-dropdown" id="download-dropdown">
            <button class="dropdown-item" id="dl-html">Save as HTML</button>
            <button class="dropdown-item" id="dl-txt">Save as TXT</button>
          </div>
        </div>
      </div>
    </div>
  `

  capacityFill = document.getElementById('capacity-fill')!
  capacityLabel = document.getElementById('capacity-label')!
  downloadDropdown = document.getElementById('download-dropdown')!

  const brandBtn = footer.querySelector('.footer-brand') as HTMLButtonElement
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
    if (!target.closest('.footer-dropdown-wrapper')) {
      hideDropdown()
    }
  })
}

function hideDropdown() {
  downloadDropdown?.classList.remove('visible')
}

export function showToolbar() {}

export function signalTyping() {}

export function updateCapacity(urlLength: number) {
  if (!capacityFill || !capacityLabel) return

  const safeLimit = 2000
  const warnLimit = 5000
  const maxDisplay = 8000

  const ratio = Math.min(urlLength / maxDisplay, 1)
  capacityFill.style.width = `${ratio * 100}%`

  if (urlLength < safeLimit) {
    capacityFill.style.backgroundColor = '#34c759'
    capacityLabel.textContent = `${urlLength.toLocaleString()} / ${safeLimit.toLocaleString()} chars`
    capacityLabel.className = 'capacity-label capacity-safe'
  } else if (urlLength < warnLimit) {
    capacityFill.style.backgroundColor = '#f0a500'
    capacityLabel.textContent = `${urlLength.toLocaleString()} / ${warnLimit.toLocaleString()} chars`
    capacityLabel.className = 'capacity-label capacity-warn'
  } else {
    capacityFill.style.backgroundColor = '#e53e3e'
    capacityLabel.textContent = `${urlLength.toLocaleString()} chars \u2014 too long`
    capacityLabel.className = 'capacity-label capacity-danger'
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
