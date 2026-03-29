/**
 * Formula Mode keyboard mapping data.
 *
 * In formula layer, each key directly outputs a LaTeX command.
 * Structures (frac, sqrt, sum, int, ...) use $1/$2 tab-stop placeholders.
 */

export interface FormulaKey {
  /** What the key outputs in LaTeX */
  output: string
  /** Display label for the overlay (short symbol) */
  label: string
  /** Whether this is a structure with tab-stops */
  hasTabStops?: boolean
}

// ── Main keyboard area (lowercase) ─────────────────────────

export const FORMULA_KEYS: Record<string, FormulaKey> = {
  // Row 1: numbers → superscripts
  '1': { output: '^{1}', label: '¹' },
  '2': { output: '^{2}', label: '²' },
  '3': { output: '^{3}', label: '³' },
  '4': { output: '^{4}', label: '⁴' },
  '5': { output: '^{5}', label: '⁵' },
  '6': { output: '^{6}', label: '⁶' },
  '7': { output: '^{7}', label: '⁷' },
  '8': { output: '^{8}', label: '⁸' },
  '9': { output: '^{9}', label: '⁹' },
  '0': { output: '^{0}', label: '⁰' },
  '-': { output: '_{$1}', label: '₋', hasTabStops: true },
  '=': { output: '\\equiv ', label: '≡' },

  // Row 2: qwerty
  'q': { output: '\\sqrt{$1}', label: '√', hasTabStops: true },
  'w': { output: '\\omega ', label: 'ω' },
  'e': { output: '\\epsilon ', label: 'ε' },
  'r': { output: '\\rho ', label: 'ρ' },
  't': { output: '\\theta ', label: 'θ' },
  'y': { output: '\\psi ', label: 'ψ' },
  'u': { output: '\\upsilon ', label: 'υ' },
  'i': { output: '\\infty ', label: '∞' },
  'o': { output: '\\circ ', label: '∘' },
  'p': { output: '\\pi ', label: 'π' },
  '[': { output: '\\langle ', label: '⟨' },
  ']': { output: '\\rangle ', label: '⟩' },

  // Row 3: home row
  'a': { output: '\\alpha ', label: 'α' },
  's': { output: '\\sigma ', label: 'σ' },
  'd': { output: '\\delta ', label: 'δ' },
  'f': { output: '\\frac{$1}{$2}', label: 'frac', hasTabStops: true },
  'g': { output: '\\gamma ', label: 'γ' },
  'h': { output: '\\sum_{$1}^{$2}', label: 'Σ', hasTabStops: true },
  'j': { output: '\\int_{$1}^{$2}', label: '∫', hasTabStops: true },
  'k': { output: '\\kappa ', label: 'κ' },
  'l': { output: '\\lambda ', label: 'λ' },
  ';': { output: '; ', label: ';' },
  "'": { output: '\\prime ', label: '′' },

  // Row 4: bottom row
  'z': { output: '\\zeta ', label: 'ζ' },
  'x': { output: '\\xi ', label: 'ξ' },
  'c': { output: '\\chi ', label: 'χ' },
  'v': { output: '\\vee ', label: '∨' },
  'b': { output: '\\beta ', label: 'β' },
  'n': { output: '\\eta ', label: 'η' },
  'm': { output: '\\mu ', label: 'μ' },
  ',': { output: '\\leq ', label: '≤' },
  '.': { output: '\\geq ', label: '≥' },
  '/': { output: '\\div ', label: '÷' },
}

// ── Shift combos (uppercase / structures) ──────────────────

export const FORMULA_SHIFT_KEYS: Record<string, FormulaKey> = {
  'A': { output: '\\Alpha ', label: 'Α' },
  'B': { output: '\\Beta ', label: 'Β' },
  'D': { output: '\\Delta ', label: 'Δ' },
  'F': { output: '\\dfrac{$1}{$2}', label: 'dfrac', hasTabStops: true },
  'G': { output: '\\Gamma ', label: 'Γ' },
  'H': { output: '\\prod_{$1}^{$2}', label: '∏', hasTabStops: true },
  'J': { output: '\\oint_{$1}^{$2}', label: '∮', hasTabStops: true },
  'K': { output: '\\Kappa ', label: 'Κ' },
  'L': { output: '\\Lambda ', label: 'Λ' },
  'N': { output: '\\nabla ', label: '∇' },
  'O': { output: '\\Omega ', label: 'Ω' },
  'P': { output: '\\Pi ', label: 'Π' },
  'Q': { output: '\\sqrt[$1]{$2}', label: 'ⁿ√', hasTabStops: true },
  'S': { output: '\\Sigma ', label: 'Σ' },
  'T': { output: '\\Theta ', label: 'Θ' },
  'W': { output: '\\Omega ', label: 'Ω' },

  // Shift+symbols
  '@': { output: '\\partial ', label: '∂' },
  '^': { output: '^{$1}', label: '^{}', hasTabStops: true },
  '*': { output: '\\times ', label: '×' },
  '(': { output: '\\left( ', label: '(' },
  ')': { output: '\\right) ', label: ')' },
  '_': { output: '_{$1}', label: '_{} ', hasTabStops: true },
  '+': { output: '\\pm ', label: '±' },
  '<': { output: '\\ll ', label: '≪' },
  '>': { output: '\\gg ', label: '≫' },
  '?': { output: '\\neq ', label: '≠' },
  '{': { output: '\\{ ', label: '{' },
  '}': { output: '\\} ', label: '}' },
  '|': { output: '\\mid ', label: '∣' },
  '~': { output: '\\approx ', label: '≈' },
  '!': { output: '! ', label: '!' },
  '#': { output: '\\# ', label: '#' },
}

/** Get the formula key entry for a given key string */
export function getFormulaKey(key: string): FormulaKey | undefined {
  // Check shift keys first (uppercase letters / shift+symbols)
  if (FORMULA_SHIFT_KEYS[key]) return FORMULA_SHIFT_KEYS[key]
  // Then lowercase / normal keys
  if (FORMULA_KEYS[key]) return FORMULA_KEYS[key]
  return undefined
}

/** All keys for overlay display, organized by row */
export const KEYBOARD_ROWS = [
  ['1','2','3','4','5','6','7','8','9','0','-','='],
  ['q','w','e','r','t','y','u','i','o','p','[',']'],
  ['a','s','d','f','g','h','j','k','l',';',"'"],
  ['z','x','c','v','b','n','m',',','.','/'],
] as const
