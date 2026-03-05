import { compress, decompress } from './compression'

const STORAGE_KEY = 'text-area-hash'

export function debounce<T extends (...args: unknown[]) => void>(ms: number, fn: T): T {
  let timer: ReturnType<typeof setTimeout>
  return ((...args: unknown[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }) as unknown as T
}

export function saveToURL(text: string): { hash: string; urlLength: number } {
  if (!text) {
    history.replaceState(null, '', window.location.pathname)
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
    return { hash: '', urlLength: window.location.href.length }
  }

  const compressed = compress(text)
  const hash = '#' + compressed
  history.replaceState(null, '', hash)

  try {
    localStorage.setItem(STORAGE_KEY, compressed)
  } catch {}

  return { hash: compressed, urlLength: window.location.href.length }
}

export function loadFromURL(): string {
  const hash = window.location.hash.slice(1)

  if (hash) {
    try {
      const text = decompress(hash)
      try { localStorage.setItem(STORAGE_KEY, hash) } catch {}
      return text
    } catch {
      return ''
    }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const text = decompress(stored)
      history.replaceState(null, '', '#' + stored)
      return text
    }
  } catch {}

  return ''
}

export function getShareableURL(): string {
  return window.location.href
}

export function getURLLength(): number {
  return window.location.href.length
}
