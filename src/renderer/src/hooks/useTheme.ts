import { useEffect } from 'react'
import { useStore } from '../store'
import type { ColorScheme, FontSize, ButtonSize } from '../types/settings.types'

const DARK_SCHEMES: ColorScheme[] = ['vampire', 'abyss', 'radiation']
const LIGHT_SCHEMES: ColorScheme[] = ['sakura', 'mint', 'sky', 'forest', 'mauve', 'golden', 'cheery', 'prussian']

const DEFAULT_DARK: ColorScheme = 'vampire'
const DEFAULT_LIGHT: ColorScheme = 'sakura'

const FONT_SIZE_MAP: Record<FontSize, string> = {
  sm: '13px',
  md: '14px',
  lg: '16px'
}

const BUTTON_SIZE_MAP: Record<ButtonSize, { padding: string; fontSize: string }> = {
  sm: { padding: '4px 8px', fontSize: '11px' },
  md: { padding: '6px 12px', fontSize: '12px' },
  lg: { padding: '8px 16px', fontSize: '13px' }
}

export function useTheme() {
  const { settings, updateAppearance } = useStore()
  const { theme, colorScheme, fontSize, buttonSize, fontFamily } = settings.appearance

  useEffect(() => {
    const root = document.documentElement
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = theme === 'dark' || (theme === 'system' && prefersDark)
    root.setAttribute('data-theme', isDark ? 'dark' : 'light')

    // Auto-switch scheme if current scheme doesn't match theme mode
    const schemeIsDark = DARK_SCHEMES.includes(colorScheme)
    if (isDark && !schemeIsDark) {
      updateAppearance({ colorScheme: DEFAULT_DARK })
      root.setAttribute('data-scheme', DEFAULT_DARK)
    } else if (!isDark && schemeIsDark) {
      updateAppearance({ colorScheme: DEFAULT_LIGHT })
      root.setAttribute('data-scheme', DEFAULT_LIGHT)
    } else {
      root.setAttribute('data-scheme', colorScheme)
    }

    // Apply font size
    root.style.setProperty('--app-font-size', FONT_SIZE_MAP[fontSize])

    // Apply button size
    root.style.setProperty('--button-padding', BUTTON_SIZE_MAP[buttonSize].padding)
    root.style.setProperty('--button-font-size', BUTTON_SIZE_MAP[buttonSize].fontSize)

    // Apply font family
    if (fontFamily) {
      root.style.setProperty('--font-sans', fontFamily)
    }
  }, [theme, colorScheme, fontSize, buttonSize, fontFamily])

  const setTheme = (t: 'light' | 'dark' | 'system') => updateAppearance({ theme: t })
  const setColorScheme = (s: ColorScheme) => updateAppearance({ colorScheme: s })

  return { theme, colorScheme, fontSize, buttonSize, fontFamily, setTheme, setColorScheme }
}
