import type { Theme, ThemeConfig } from "ui/theme/theme"
import { MEDIA_QUERY, STORAGE_KEY, themeConfig } from "ui/theme/theme"

export interface ThemeScriptProps {
  nonce?: string
  defaultTheme?: Theme
  storageKey?: string
  themes?: ThemeConfig
}

export function ThemeScript({
  nonce,
  defaultTheme = "system",
  storageKey = STORAGE_KEY,
  themes = themeConfig,
}: ThemeScriptProps) {
  // Escape '<' in user-supplied keys/class names so inline JSON cannot close script.
  const config = JSON.stringify({
    storageKey,
    defaultTheme,
    classes: themes.classes,
    media: MEDIA_QUERY,
  }).replace(/</g, "\\u003c")

  const script = `(()=>{const c=${config},r=document.documentElement;let t=c.defaultTheme;try{const s=localStorage.getItem(c.storageKey);if(s==="light"||s==="dark"||s==="system")t=s}catch{}const v=t==="system"?(matchMedia(c.media).matches?"dark":"light"):t;r.classList.remove(...c.classes.light,...c.classes.dark);r.classList.add(...c.classes[v]);r.dataset.theme=v})()`

  return <script dangerouslySetInnerHTML={{ __html: script }} nonce={nonce} />
}
