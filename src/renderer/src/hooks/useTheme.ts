import { useEffect } from 'react'
import { useStore } from '../store'
import type { ColorScheme } from '../types/settings.types'

const DARK_SCHEMES: ColorScheme[] = ['vampire', 'abyss', 'radiation']
const LIGHT_SCHEMES: ColorScheme[] = ['sakura', 'mint', 'sky', 'forest', 'mauve', 'golden', 'cheery', 'prussian']

const DEFAULT_DARK: ColorScheme = 'vampire'
const DEFAULT_LIGHT: ColorScheme = 'sakura'

export function useTheme() {
  const { settings, updateAppearance } = useStore()
  const { theme, colorScheme } = settings.appearance

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
  }, [theme, colorScheme])

  const setTheme = (t: 'light' | 'dark' | 'system') => updateAppearance({ theme: t })
  const setColorScheme = (s: ColorScheme) => updateAppearance({ colorScheme: s })

  return { theme, colorScheme, setTheme, setColorScheme }
}
