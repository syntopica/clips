import { applyMarkups } from './apply-markups.ts'
import type { MediumParagraph } from './medium-paragraph.ts'
import { PARAGRAPH_PREFIXES } from './paragraph-prefixes.ts'

/** Renders one paragraph. Always returns a string - an unrenderable paragraph
 * yields `''` for the caller to drop, never `undefined`, so the join below it
 * cannot produce a stray blank block.
 *
 * `PRE` deliberately skips `applyMarkups`: a markup offset inside a code block
 * would inject `**` or a backtick into source the reader is meant to copy. `IMG`
 * carries its own image id and no text; without an id there is nothing to point
 * at, so it is skipped. Everything else is a prefix plus the marked-up text,
 * and an unknown type falls through to the bare text rather than being lost -
 * that is what `MIXTAPE_EMBED` (whose text is the embedded link's title) and
 * `IFRAME` (whose text is empty) do today.
 * docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export const paragraphToMarkdown = (paragraph: MediumParagraph): string => {
  if (paragraph.type === 'PRE')
    return `\`\`\`${paragraph.codeBlockMetadata?.lang ?? ''}\n${paragraph.text}\n\`\`\``

  if (paragraph.type === 'IMG') {
    const image = paragraph.metadata ?? { id: null, alt: null }
    if (typeof image.id !== 'string') return ''
    return `![${image.alt ?? ''}](https://miro.medium.com/v2/${image.id})`
  }

  const prefix = PARAGRAPH_PREFIXES[paragraph.type] ?? ''
  return `${prefix}${applyMarkups(paragraph.text, paragraph.markups)}`
}
