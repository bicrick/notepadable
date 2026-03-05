import { getShareableURL } from './url'

const TOAST_DURATION = 2000

let footer: HTMLElement | null = null
let capacityFill: HTMLElement | null = null
let capacityLabel: HTMLElement | null = null
let toastEl: HTMLElement | null = null
let downloadDropdown: HTMLElement | null = null

let onEncryptAndCopy: ((password: string) => Promise<void>) | null = null

export function initToolbar(callbacks: {
  onNew: () => void
  onDownloadHTML: () => void
  onDownloadTXT: () => void
  onEncryptShare: (password: string) => Promise<void>
}) {
  footer = document.getElementById('footer')!
  onEncryptAndCopy = callbacks.onEncryptShare

  footer.innerHTML = `
    <div class="capacity-bar">
      <div class="capacity-fill" id="capacity-fill"></div>
    </div>
    <div class="footer-inner">
      <button class="footer-brand" title="New document" aria-label="New document">Notepad</button>
      <div class="footer-actions">
        <span class="capacity-label" id="capacity-label"></span>
        <button class="footer-btn" id="btn-share" title="Share" aria-label="Share">
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
    hideDropdown()
    showShareModal()
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

// --- Share Modal ---

function showShareModal() {
  const existing = document.getElementById('modal-overlay')
  if (existing) existing.remove()

  const overlay = document.createElement('div')
  overlay.id = 'modal-overlay'
  overlay.className = 'modal-overlay'
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <span class="modal-title">Share</span>
        <button class="modal-close" aria-label="Close">&times;</button>
      </div>
      <div class="modal-tabs">
        <button class="modal-tab active" data-tab="link">Link</button>
        <button class="modal-tab" data-tab="encrypted">Encrypted</button>
      </div>
      <div class="modal-body">
        <div class="modal-pane" id="pane-link">
          <p class="modal-description">Anyone with this link can view the document.</p>
          <button class="modal-btn modal-btn-primary" id="modal-copy-link">Copy Link</button>
        </div>
        <div class="modal-pane" id="pane-encrypted" style="display:none">
          <p class="modal-description">Set a password. The recipient will need it to view the document.</p>
          <div class="modal-input-row">
            <input type="password" class="modal-input" id="modal-password" placeholder="Password" autocomplete="off" />
            <button class="modal-toggle-pw" id="modal-toggle-pw" title="Show password" aria-label="Toggle password visibility">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
          <button class="modal-btn modal-btn-primary" id="modal-encrypt-copy" disabled>Encrypt and Copy Link</button>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('visible'))

  const closeBtn = overlay.querySelector('.modal-close') as HTMLButtonElement
  const tabs = overlay.querySelectorAll('.modal-tab') as NodeListOf<HTMLButtonElement>
  const paneLink = document.getElementById('pane-link')!
  const paneEncrypted = document.getElementById('pane-encrypted')!
  const copyLinkBtn = document.getElementById('modal-copy-link')!
  const passwordInput = document.getElementById('modal-password') as HTMLInputElement
  const togglePwBtn = document.getElementById('modal-toggle-pw')!
  const encryptCopyBtn = document.getElementById('modal-encrypt-copy') as HTMLButtonElement

  function close() {
    overlay.classList.remove('visible')
    setTimeout(() => overlay.remove(), 200)
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'))
      tab.classList.add('active')
      const target = tab.dataset.tab
      if (target === 'link') {
        paneLink.style.display = ''
        paneEncrypted.style.display = 'none'
      } else {
        paneLink.style.display = 'none'
        paneEncrypted.style.display = ''
        passwordInput.focus()
      }
    })
  })

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

  copyLinkBtn.addEventListener('click', () => {
    const url = getShareableURL()
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        close()
        showToast('Link copied')
      })
    }
  })

  passwordInput.addEventListener('input', () => {
    encryptCopyBtn.disabled = !passwordInput.value
  })

  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && passwordInput.value) {
      encryptCopyBtn.click()
    }
  })

  togglePwBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password'
    passwordInput.type = isPassword ? 'text' : 'password'
  })

  encryptCopyBtn.addEventListener('click', async () => {
    const password = passwordInput.value
    if (!password || !onEncryptAndCopy) return

    encryptCopyBtn.disabled = true
    encryptCopyBtn.textContent = 'Encrypting...'

    try {
      await onEncryptAndCopy(password)
      close()
      showToast('Encrypted link copied')
    } catch {
      encryptCopyBtn.textContent = 'Error -- try again'
      encryptCopyBtn.disabled = false
    }
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
