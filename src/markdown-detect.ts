const patterns = [
  /^#{1,6}\s/m,
  /\*\*.+?\*\*/,
  /\[.+?\]\(.+?\)/,
  /^```/m,
  /^[\-\*\+]\s/m,
  /^\d+\.\s/m,
  /^>\s/m,
  /^---\s*$/m,
]

export function hasMarkdown(text: string): boolean {
  if (!text) return false
  for (const pattern of patterns) {
    if (pattern.test(text)) return true
  }
  return false
}
