import { EditorState, Compartment } from '@codemirror/state'
import { EditorView, keymap, placeholder } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { searchKeymap } from '@codemirror/search'
import { getThemeForScheme, markdownHighlightStyle } from './theme'

export interface EditorInstance {
  view: EditorView
  getContent: () => string
  setContent: (text: string) => void
  onUpdate: (callback: () => void) => void
}

export function createEditor(
  parent: HTMLElement,
  opts: {
    onSave?: () => void
  } = {}
): EditorInstance {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  let updateCallback: (() => void) | null = null

  const themeCompartment = new Compartment()

  const saveKeymap = opts.onSave
    ? keymap.of([{
        key: 'Mod-s',
        run: () => { opts.onSave!(); return true },
      }])
    : keymap.of([])

  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged && updateCallback) {
      updateCallback()
    }
  })

  const state = EditorState.create({
    doc: '',
    extensions: [
      history(),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
      ]),
      saveKeymap,
      markdown(),
      syntaxHighlighting(defaultHighlightStyle),
      EditorView.lineWrapping,
      themeCompartment.of(getThemeForScheme(isDark)),
      markdownHighlightStyle,
      placeholder('Start typing...'),
      updateListener,
    ],
  })

  const view = new EditorView({ state, parent })

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    view.dispatch({
      effects: themeCompartment.reconfigure(getThemeForScheme(e.matches)),
    })
  })

  return {
    view,
    getContent: () => view.state.doc.toString(),
    setContent: (text: string) => {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: text },
      })
    },
    onUpdate: (callback: () => void) => {
      updateCallback = callback
    },
  }
}
