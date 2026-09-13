import type { Markup } from './markup.ts'

/** One `"Paragraph:<id>"` entry from the Apollo cache, narrowed to the fields
 * that affect rendering. Medium also carries `__typename`, `id`, `name`,
 * `href`, `layout`, `iframe` and `mixtapeMetadata` on the same entry; they are
 * left out because nothing reads them.
 * docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export type MediumParagraph = {
  type: string
  text: string
  markups: readonly Markup[]
  codeBlockMetadata?: { lang?: string | null | undefined } | null | undefined
  metadata?:
    | { id?: string | null | undefined; alt?: string | null | undefined }
    | null
    | undefined
}
