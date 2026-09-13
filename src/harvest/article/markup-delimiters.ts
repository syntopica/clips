import type { Markup } from './markup.ts'

/** The markdown that wraps one markup span. Only types seen in Medium's Apollo
 * state are rendered (`STRONG`, `CODE`, `A` measured on a real article; `EM`
 * from Medium's paragraph model); anything else returns `null` so the text
 * survives unwrapped rather than being dropped or fenced with a guessed
 * syntax. `A` without an `href` is treated the same way, because `[text]()` is
 * a broken link where plain text is merely a lost one.
 * docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export const markupDelimiters = (
  markup: Markup,
): { open: string; close: string } | null => {
  if (markup.type === 'STRONG') return { open: '**', close: '**' }
  if (markup.type === 'EM') return { open: '_', close: '_' }
  if (markup.type === 'CODE') return { open: '`', close: '`' }
  if (markup.type === 'A' && typeof markup.href === 'string' && markup.href)
    return { open: '[', close: `](${markup.href})` }
  return null
}
