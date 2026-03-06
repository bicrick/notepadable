import './analytics'
import { initTheme } from './theme-mode'
import { initNav } from './nav'
import './landing.css'
import './docs.css'

initTheme()
initNav()

// Mobile TOC collapsible toggle
const tocNav = document.querySelector<HTMLElement>('.docs-toc')
const tocToggle = document.querySelector<HTMLButtonElement>('.docs-toc-mobile-toggle')

if (tocNav && tocToggle) {
  tocToggle.addEventListener('click', () => {
    const expanded = tocNav.classList.toggle('docs-toc--expanded')
    tocToggle.setAttribute('aria-expanded', String(expanded))
  })

  // Close TOC on link click (navigates to section)
  tocNav.querySelectorAll('.docs-toc-link').forEach((link) => {
    link.addEventListener('click', () => {
      tocNav.classList.remove('docs-toc--expanded')
      tocToggle.setAttribute('aria-expanded', 'false')
    })
  })
}

// Highlight the active TOC link based on scroll position
const tocLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('.docs-toc-link'))
const sections = tocLinks
  .map((a) => {
    const id = a.getAttribute('href')?.slice(1)
    return id ? document.getElementById(id) : null
  })
  .filter((el): el is HTMLElement => el !== null)

function updateActiveToc() {
  const scrollY = window.scrollY + 100
  let active = sections[0]
  for (const section of sections) {
    if (section.offsetTop <= scrollY) {
      active = section
    }
  }
  for (const link of tocLinks) {
    const id = link.getAttribute('href')?.slice(1)
    link.classList.toggle('docs-toc-link--active', id === active?.id)
  }
}

window.addEventListener('scroll', updateActiveToc, { passive: true })
updateActiveToc()
