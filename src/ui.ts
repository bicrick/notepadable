import { getShareableURL } from './url'
import { setTheme, getTheme, THEME_CHANGE_EVENT, type ThemeMode } from './theme-mode'

const TOAST_DURATION = 2000

const PANEL_STORAGE_KEY = 'notepadable-footer-expanded'
const PANEL_EXPANDED_HEIGHT = 185

let footer: HTMLElement | null = null
let footerPanel: HTMLElement | null = null
let footerExpanded = localStorage.getItem(PANEL_STORAGE_KEY) === 'true'
let capacityFill: HTMLElement | null = null
let capacityLabel: HTMLElement | null = null
let toastEl: HTMLElement | null = null
let onEncryptAndCopy: ((password: string) => Promise<void>) | null = null
let onEncryptAndRaw: ((password: string) => Promise<string>) | null = null

export function initToolbar(callbacks: {
  onNew: () => void
  onDownloadHTML: () => void
  onDownloadTXT: () => void
  onEncryptShare: (password: string) => Promise<void>
  onEncryptRaw: (password: string) => Promise<string>
  onTogglePreview: () => void
}) {
  footer = document.getElementById('footer')!
  onEncryptAndCopy = callbacks.onEncryptShare
  onEncryptAndRaw = callbacks.onEncryptRaw

  const chevronContainer = document.getElementById('footer-chevron')!
  chevronContainer.innerHTML = `
    <button class="footer-chevron" id="btn-chevron" title="Toggle panel" aria-label="Toggle panel" aria-expanded="false">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    </button>
  `

  footer.innerHTML = `
    <div class="capacity-bar">
      <div class="capacity-fill" id="capacity-fill"></div>
    </div>
    <div class="footer-inner">
      <button class="footer-brand" title="New note" aria-label="New note"><span class="brand-main">notepad</span><span class="brand-suffix">able</span></button>
      <div class="footer-actions">
        <span class="capacity-label" id="capacity-label"></span>
        <button class="footer-btn" id="btn-preview" title="Toggle preview" aria-label="Toggle preview" style="display:none">
          <svg id="icon-preview-eye" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          <svg id="icon-preview-edit" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
            <path d="m15 5 4 4"></path>
          </svg>
        </button>
        <button class="footer-btn" id="btn-share" title="Share" aria-label="Share">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 9h-1a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-8a2 2 0 0 0 -2 -2h-1"/>
            <path d="M12 14v-11"/>
            <path d="M9 6l3 -3l3 3"/>
          </svg>
        </button>
      </div>
    </div>
  `

  capacityFill = document.getElementById('capacity-fill')!
  capacityLabel = document.getElementById('capacity-label')!
  footerPanel = document.getElementById('footer-panel')!

  initFooterPanel()

  applyPanelState()

  document.getElementById('btn-chevron')!.addEventListener('click', (e) => {
    e.stopPropagation()
    footerExpanded = !footerExpanded
    localStorage.setItem(PANEL_STORAGE_KEY, String(footerExpanded))
    applyPanelState()
  })

  const brandBtn = footer.querySelector('.footer-brand') as HTMLButtonElement
  brandBtn.addEventListener('click', () => {
    callbacks.onNew()
  })

  document.getElementById('btn-preview')!.addEventListener('click', () => {
    callbacks.onTogglePreview()
  })

  document.getElementById('btn-share')!.addEventListener('click', () => {
    showShareModal(callbacks)
  })
}

function initFooterPanel() {
  if (!footerPanel) return
  const current = getTheme()
  footerPanel.innerHTML = `
    <div class="footer-panel-content">
      <div class="footer-panel-theme">
        <div class="theme-switcher" role="group" aria-label="Theme">
          <button class="theme-btn" data-theme="light" aria-pressed="${current === 'light'}" title="Light">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
          </button>
          <button class="theme-btn" data-theme="dark" aria-pressed="${current === 'dark'}" title="Dark">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </button>
          <button class="theme-btn" data-theme="system" aria-pressed="${current === 'system'}" title="System">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          </button>
        </div>
      </div>
      <div class="footer-panel-blurb">
        <p class="footer-panel-desc"><span class="footer-panel-brand"><span class="brand-main">notepad</span><span class="brand-suffix">able</span></span> is a stateless editor that stores everything in the URL. Share a link and the recipient gets your full text. Markdown, mermaid diagrams, optional encryption. No server, no accounts.</p>
      </div>
      <div class="footer-panel-links">
        <a href="/">Home</a>
        <span class="footer-panel-sep">·</span>
        <a href="/docs">Docs</a>
        <span class="footer-panel-sep">·</span>
        <span>Made by <a href="https://github.com/bicrick" target="_blank" rel="noopener noreferrer">Bicrick</a></span>
        <span class="footer-panel-sep">·</span>
        <a href="https://bicrick.com" target="_blank" rel="noopener noreferrer">bicrick.com</a>
      </div>
    </div>
  `
  footerPanel.querySelectorAll('.theme-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = (btn as HTMLElement).dataset.theme as ThemeMode
      setTheme(mode)
      updateThemeSwitcherUI()
    })
  })
  window.addEventListener(THEME_CHANGE_EVENT, updateThemeSwitcherUI)
  updateThemeSwitcherUI()
}

function updateThemeSwitcherUI() {
  const current = getTheme()
  footerPanel?.querySelectorAll('.theme-btn').forEach((btn) => {
    const mode = (btn as HTMLElement).dataset.theme as ThemeMode
    btn.setAttribute('aria-pressed', String(mode === current))
    btn.classList.toggle('active', mode === current)
  })
}

function applyPanelState() {
  if (!footerPanel) return
  const chevron = document.getElementById('btn-chevron')
  if (footerExpanded) {
    footerPanel.classList.add('expanded')
    chevron?.classList.add('expanded')
    chevron?.setAttribute('aria-expanded', 'true')
    document.documentElement.style.setProperty('--panel-height', `${PANEL_EXPANDED_HEIGHT}px`)
    document.documentElement.style.setProperty('--chevron-offset', '36px')
  } else {
    footerPanel.classList.remove('expanded')
    chevron?.classList.remove('expanded')
    chevron?.setAttribute('aria-expanded', 'false')
    document.documentElement.style.setProperty('--panel-height', '0px')
    document.documentElement.style.setProperty('--chevron-offset', '0px')
  }
}

// --- Share Modal ---

function showShareModal(callbacks: { onDownloadHTML: () => void; onDownloadTXT: () => void }) {
  const existing = document.getElementById('modal-overlay')
  if (existing) existing.remove()

  const overlay = document.createElement('div')
  overlay.id = 'modal-overlay'
  overlay.className = 'modal-overlay'
  overlay.innerHTML = `
    <div class="modal modal-share">
      <div class="modal-header">
        <span class="modal-title">Share</span>
        <button class="modal-close" aria-label="Close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="share-primary">
          <button class="share-copy-btn" id="modal-action-btn">Copy Link</button>
          <button class="share-lock-btn" id="modal-lock-toggle" aria-label="Toggle encryption" aria-pressed="false" title="Encrypt link">
            <svg class="lock-open" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
            </svg>
            <svg class="lock-closed" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </button>
        </div>
        <div class="modal-password-area" id="modal-password-area">
          <div class="modal-password-inner">
            <div class="modal-input-row">
              <input type="password" class="modal-input" id="modal-password" placeholder="Set a password" autocomplete="off" />
              <button class="modal-toggle-pw" id="modal-toggle-pw" title="Show password" aria-label="Toggle visibility">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div class="share-divider"></div>
        <div class="share-downloads">
          <button class="share-dl-btn" id="modal-dl-html">Save as HTML</button>
          <button class="share-dl-btn" id="modal-dl-txt">Save as TXT</button>
          <button class="share-raw-btn" id="modal-raw-btn">Copy Raw Link</button>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('visible'))

  const closeBtn = overlay.querySelector('.modal-close') as HTMLButtonElement
  const lockToggle = document.getElementById('modal-lock-toggle') as HTMLButtonElement
  const lockOpen = lockToggle.querySelector('.lock-open') as SVGElement
  const lockClosed = lockToggle.querySelector('.lock-closed') as SVGElement
  const passwordArea = document.getElementById('modal-password-area') as HTMLElement
  const passwordInput = document.getElementById('modal-password') as HTMLInputElement
  const togglePwBtn = document.getElementById('modal-toggle-pw') as HTMLButtonElement
  const actionBtn = document.getElementById('modal-action-btn') as HTMLButtonElement
  const rawBtn = document.getElementById('modal-raw-btn') as HTMLButtonElement

  let encrypted = false

  function setEncrypted(value: boolean) {
    encrypted = value
    lockToggle.setAttribute('aria-pressed', String(value))
    lockToggle.classList.toggle('active', value)
    lockOpen.style.display = value ? 'none' : ''
    lockClosed.style.display = value ? '' : 'none'
    lockToggle.title = value ? 'Remove encryption' : 'Encrypt link'

    if (value) {
      passwordArea.classList.add('visible')
      actionBtn.textContent = 'Copy Encrypted Link'
      actionBtn.disabled = !passwordInput.value
      rawBtn.disabled = !passwordInput.value
      setTimeout(() => passwordInput.focus(), 250)
    } else {
      passwordArea.classList.remove('visible')
      passwordInput.value = ''
      actionBtn.textContent = 'Copy Link'
      actionBtn.disabled = false
      rawBtn.disabled = false
    }
  }

  setEncrypted(false)

  function close() {
    overlay.classList.remove('visible')
    setTimeout(() => overlay.remove(), 200)
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close()
  })

  closeBtn.addEventListener('click', close)

  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      close()
      document.removeEventListener('keydown', escHandler)
    }
  })

  lockToggle.addEventListener('click', () => setEncrypted(!encrypted))

  passwordInput.addEventListener('input', () => {
    if (encrypted) {
      actionBtn.disabled = !passwordInput.value
      rawBtn.disabled = !passwordInput.value
    }
  })

  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && passwordInput.value) actionBtn.click()
  })

  togglePwBtn.addEventListener('click', () => {
    passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password'
  })

  actionBtn.addEventListener('click', async () => {
    if (!encrypted) {
      const url = getShareableURL()
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        close()
        showToast('Link copied')
      }
      return
    }

    const password = passwordInput.value
    if (!password || !onEncryptAndCopy) return

    actionBtn.disabled = true
    actionBtn.textContent = 'Encrypting...'

    try {
      await onEncryptAndCopy(password)
      close()
      showToast('Encrypted link copied')
    } catch {
      actionBtn.textContent = 'Error -- try again'
      actionBtn.disabled = false
    }
  })

  rawBtn.addEventListener('click', async () => {
    if (!encrypted) {
      const hash = window.location.hash.slice(1)
      if (!hash) return
      const rawURL = `${window.location.origin}/raw/${hash}`
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(rawURL)
        close()
        showToast('Raw link copied')
      }
      return
    }

    const password = passwordInput.value
    if (!password || !onEncryptAndRaw) return

    rawBtn.disabled = true
    rawBtn.textContent = 'Encrypting...'

    try {
      const rawURL = await onEncryptAndRaw(password)
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(rawURL)
      }
      close()
      showToast('Raw link copied')
    } catch {
      rawBtn.textContent = 'Error — try again'
      rawBtn.disabled = false
    }
  })

  document.getElementById('modal-dl-html')!.addEventListener('click', () => {
    callbacks.onDownloadHTML()
    close()
    showToast('Downloaded')
  })

  document.getElementById('modal-dl-txt')!.addEventListener('click', () => {
    callbacks.onDownloadTXT()
    close()
    showToast('Downloaded')
  })
}

// --- Password Prompt Modal ---

export function showPasswordPrompt(
  onSubmit: (password: string) => Promise<boolean>
): void {
  const existing = document.getElementById('modal-overlay')
  if (existing) existing.remove()

  const overlay = document.createElement('div')
  overlay.id = 'modal-overlay'
  overlay.className = 'modal-overlay'
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <span class="modal-title">Encrypted Document</span>
      </div>
      <div class="modal-body">
        <p class="modal-description">This document is password-protected. Enter the password to unlock it.</p>
        <div class="modal-input-row">
          <input type="password" class="modal-input" id="unlock-password" placeholder="Password" autocomplete="off" />
          <button class="modal-toggle-pw" id="unlock-toggle-pw" title="Show password" aria-label="Toggle password visibility">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
        </div>
        <span class="modal-error" id="unlock-error"></span>
        <button class="modal-btn modal-btn-primary" id="unlock-btn" disabled>Unlock</button>
      </div>
    </div>
  `

  document.body.appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('visible'))

  const passwordInput = document.getElementById('unlock-password') as HTMLInputElement
  const togglePwBtn = document.getElementById('unlock-toggle-pw')!
  const unlockBtn = document.getElementById('unlock-btn') as HTMLButtonElement
  const errorEl = document.getElementById('unlock-error')!

  passwordInput.addEventListener('input', () => {
    unlockBtn.disabled = !passwordInput.value
    errorEl.textContent = ''
    passwordInput.classList.remove('shake')
  })

  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && passwordInput.value) {
      unlockBtn.click()
    }
  })

  togglePwBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password'
    passwordInput.type = isPassword ? 'text' : 'password'
  })

  unlockBtn.addEventListener('click', async () => {
    const password = passwordInput.value
    if (!password) return

    unlockBtn.disabled = true
    unlockBtn.textContent = 'Unlocking...'

    const success = await onSubmit(password)

    if (success) {
      overlay.classList.remove('visible')
      setTimeout(() => overlay.remove(), 200)
    } else {
      errorEl.textContent = 'Wrong password'
      passwordInput.classList.add('shake')
      unlockBtn.textContent = 'Unlock'
      unlockBtn.disabled = false
      passwordInput.select()
    }
  })

  passwordInput.focus()
}

// --- Preview Toggle ---

export function setPreviewMode(isPreview: boolean) {
  const eyeIcon = document.getElementById('icon-preview-eye')
  const editIcon = document.getElementById('icon-preview-edit')
  const btn = document.getElementById('btn-preview')
  if (eyeIcon && editIcon) {
    eyeIcon.style.display = isPreview ? 'none' : ''
    editIcon.style.display = isPreview ? '' : 'none'
  }
  if (btn) {
    btn.title = isPreview ? 'Back to editor' : 'Toggle preview'
  }
}

export function setPreviewButtonVisible(visible: boolean) {
  const btn = document.getElementById('btn-preview')
  if (btn) {
    btn.style.display = visible ? '' : 'none'
  }
}

// --- Capacity + Toast ---

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
