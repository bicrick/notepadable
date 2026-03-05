import { initTheme } from './theme-mode'
import './landing.css'

initTheme()

// Animate the demo URL bar to simulate compression happening
const urlValue = document.querySelector('.demo-url-value')
if (urlValue) {
  const segments = [
    'notepadable.com/#',
    'notepadable.com/#H4s',
    'notepadable.com/#H4sIAAAAA',
    'notepadable.com/#H4sIAAAAACmKs8...',
    'notepadable.com/#H4sIAAAAACmKs8Xm9Q8mAAA',
  ]
  let step = 0
  const interval = setInterval(() => {
    step++
    if (step >= segments.length) {
      clearInterval(interval)
      return
    }
    urlValue.textContent = segments[step]
  }, 320)
}
