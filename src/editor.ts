import { EditorState, Compartment } from '@codemirror/state'
import { EditorView, keymap, placeholder } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentLess, insertTab } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { HighlightStyle, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { searchKeymap } from '@codemirror/search'
import { tags } from '@lezer/highlight'
import { getThemeForScheme, markdownHighlightStyle } from './theme'

const codeBlockLanguageHighlight = HighlightStyle.define([
  { tag: tags.labelName, color: '#555' },
], { themeType: 'light' })

const codeBlockLanguageHighlightDark = HighlightStyle.define([
  { tag: tags.labelName, color: '#cbd5e1' },
], { themeType: 'dark' })
import { getTheme, resolveIsDark, THEME_CHANGE_EVENT } from './theme-mode'

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
  const isDark = resolveIsDark(getTheme())
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
        { key: 'Tab', run: insertTab },
        { key: 'Shift-Tab', run: indentLess },
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
      ]),
      saveKeymap,
      markdown(),
      syntaxHighlighting(codeBlockLanguageHighlight),
      syntaxHighlighting(codeBlockLanguageHighlightDark),
      syntaxHighlighting(defaultHighlightStyle),
      EditorView.lineWrapping,
      themeCompartment.of(getThemeForScheme(isDark)),
      markdownHighlightStyle,
      placeholder('Start typing...'),
      updateListener,
    ],
  })

  const view = new EditorView({ state, parent })

  function applyTheme() {
    view.dispatch({
      effects: themeCompartment.reconfigure(getThemeForScheme(resolveIsDark(getTheme()))),
    })
  }

  window.addEventListener(THEME_CHANGE_EVENT, applyTheme)

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
