export function initNav(): void {
  const nav = document.querySelector<HTMLElement>('.nav')
  const hamburger = document.querySelector<HTMLButtonElement>('.nav-hamburger')
  const overlay = document.querySelector<HTMLElement>('.nav-mobile-overlay')

  if (!nav || !hamburger || !overlay) return

  function open() {
    nav!.classList.add('nav--open')
    hamburger!.setAttribute('aria-expanded', 'true')
    overlay!.removeAttribute('aria-hidden')
    document.body.style.overflow = 'hidden'
  }

  function close() {
    nav!.classList.remove('nav--open')
    hamburger!.setAttribute('aria-expanded', 'false')
    overlay!.setAttribute('aria-hidden', 'true')
    document.body.style.overflow = ''
  }

  hamburger.addEventListener('click', () => {
    if (nav.classList.contains('nav--open')) {
      close()
    } else {
      open()
    }
  })

  overlay.addEventListener('click', close)

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('nav--open')) {
      close()
    }
  })

  // Close menu on nav link click (for single-page anchor navigation)
  overlay.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', close)
  })
}
