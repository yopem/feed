import { useEffect } from "react"

/**
 * Custom hook for handling keyboard shortcuts
 *
 * @param key - The key to listen for (e.g., 'k', 'Escape')
 * @param callback - Function to execute when shortcut is triggered
 * @param modifiers - Optional modifier keys (ctrl, meta, shift, alt)
 */
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  modifiers?: {
    ctrl?: boolean
    meta?: boolean
    shift?: boolean
    alt?: boolean
  },
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const matchesModifiers =
        (!modifiers?.ctrl || event.ctrlKey) &&
        (!modifiers?.meta || event.metaKey) &&
        (!modifiers?.shift || event.shiftKey) &&
        (!modifiers?.alt || event.altKey)

      const matchesKey = event.key.toLowerCase() === key.toLowerCase()

      if (matchesKey && matchesModifiers) {
        const activeElement = document.activeElement
        const isInputField =
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement ||
          (activeElement instanceof HTMLElement &&
            activeElement.isContentEditable)

        if (
          !isInputField ||
          modifiers?.ctrl ||
          modifiers?.meta ||
          key === "Escape"
        ) {
          event.preventDefault()
          callback()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [key, callback, modifiers])
}
