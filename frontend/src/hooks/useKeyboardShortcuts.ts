import { useEffect } from 'react'

type ShortcutHandler = (event: KeyboardEvent) => void

type Shortcuts = {
  [key: string]: ShortcutHandler
}

export const useKeyboardShortcuts = (shortcuts: Shortcuts, enabled = true) => {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      const key = event.key.toLowerCase()
      const withMeta = event.metaKey || event.ctrlKey
      const withShift = event.shiftKey
      
      let shortcutKey = key
      if (withMeta) shortcutKey = `meta+${key}`
      if (withShift) shortcutKey = `shift+${key}`
      if (withMeta && withShift) shortcutKey = `meta+shift+${key}`

      const handler = shortcuts[shortcutKey] || shortcuts[key]
      if (handler) {
        event.preventDefault()
        handler(event)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, enabled])
}
