import { EditorView } from '@codemirror/view'

const fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

export const lightTheme = EditorView.theme({
  '&': {
    backgroundColor: '#f5f5f5',
    color: '#1a1a1a',
    fontSize: '17px',
    fontFamily,
  },
  '.cm-content': {
    fontFamily,
    lineHeight: '1.6',
    padding: '60px 18px 40vh 18px',
    maxWidth: '720px',
    margin: '0 auto',
    caretColor: '#1a1a1a',
  },
  '.cm-cursor': {
    borderLeftColor: '#1a1a1a',
  },
  '.cm-selectionBackground': {
    backgroundColor: '#b4d7ff !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: '#b4d7ff !important',
  },
  '.cm-gutters': {
    display: 'none',
  },
  '.cm-activeLine': {
    backgroundColor: 'transparent',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
}, { dark: false })

export const darkTheme = EditorView.theme({
  '&': {
    backgroundColor: '#1a1a1a',
    color: '#e0e0e0',
    fontSize: '17px',
    fontFamily,
  },
  '.cm-content': {
    fontFamily,
    lineHeight: '1.6',
    padding: '60px 18px 40vh 18px',
    maxWidth: '720px',
    margin: '0 auto',
    caretColor: '#e0e0e0',
  },
  '.cm-cursor': {
    borderLeftColor: '#e0e0e0',
  },
  '.cm-selectionBackground': {
    backgroundColor: '#264f78 !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: '#264f78 !important',
  },
  '.cm-gutters': {
    display: 'none',
  },
  '.cm-activeLine': {
    backgroundColor: 'transparent',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
}, { dark: true })

export const markdownHighlightStyle = EditorView.baseTheme({
  '.cm-header-1': { fontSize: '1.8em', fontWeight: '700' },
  '.cm-header-2': { fontSize: '1.4em', fontWeight: '700' },
  '.cm-header-3': { fontSize: '1.2em', fontWeight: '700' },
  '.cm-header-4': { fontSize: '1.1em', fontWeight: '600' },
  '.cm-header-5': { fontSize: '1em', fontWeight: '600' },
  '.cm-header-6': { fontSize: '0.9em', fontWeight: '600' },
  '.cm-strong': { fontWeight: '700' },
  '.cm-emphasis': { fontStyle: 'italic' },
  '.cm-strikethrough': { textDecoration: 'line-through' },
  '.cm-url': { textDecoration: 'underline', textUnderlineOffset: '3px' },
  '.cm-monospace': { fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace', fontSize: '0.9em' },
})

export function getThemeForScheme(dark: boolean) {
  return dark ? darkTheme : lightTheme
}
