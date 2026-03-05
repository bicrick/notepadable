import { initTheme } from './theme-mode'
import './landing.css'
import './docs.css'

initTheme()

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
