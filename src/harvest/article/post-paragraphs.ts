import { z } from 'zod'
import type { MediumParagraph } from './medium-paragraph.ts'

/** Resolves the post's ordered `__ref` list into paragraph entries. Validation
 * is strict on the fields that drive rendering: a missing `text` or `type` is
 * schema drift, and a clip built past it would be silently wrong rather than
 * visibly broken. The schema lives inside the function because a module gets
 * exactly one top-level declaration.
 * docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export const postParagraphs = (
  state: Record<string, unknown>,
  refs: readonly string[],
): MediumParagraph[] => {
  const paragraph = z.object({
    type: z.string(),
    text: z.string(),
    markups: z
      .array(
        z.object({
          type: z.string(),
          start: z.number(),
          end: z.number(),
          href: z.string().nullish(),
        }),
      )
      .default([]),
    codeBlockMetadata: z.object({ lang: z.string().nullish() }).nullish(),
    metadata: z
      .object({ id: z.string().nullish(), alt: z.string().nullish() })
      .nullish(),
  })

  return refs.map((reference) => paragraph.parse(state[reference]))
}
