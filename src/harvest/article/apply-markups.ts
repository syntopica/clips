import { markupDelimiters } from './markup-delimiters.ts'
import type { Markup } from './markup.ts'

/** Renders a paragraph's inline formatting into markdown. Every offset is a
 * UTF-16 code unit index, half-open `[start, end)`, which is exactly what
 * `String.prototype.slice` consumes - that is the trap, since an emoji or a
 * surrogate pair would make a code-point walk drift.
 *
 * Delimiters are turned into edges and inserted into the ORIGINAL string from
 * the highest index down, so no already-computed offset is ever invalidated. A
 * naive "splice each markup from the end" pass looks equivalent and is not: for
 * a markup nested inside another, splicing the inner one first shifts the outer
 * one's `end`. Edges avoid that because each insertion point is independent.
 *
 * Two edges landing on the same index come out in the reverse of the order they
 * are applied in, so the ordering keys are inverted on purpose: escapes are
 * applied first to end up last (immediately before the character they protect),
 * then openers, then closers. Within one index, openers are applied
 * inner-to-outer and closers outer-to-inner, which puts them back out as
 * `**<code>`...`</code>**` rather than as interleaved delimiters. `depth` comes
 * from sorting the markups outer-to-inner (start ascending, end descending), so
 * two markups over the identical range still nest instead of crossing - that
 * last case relies on `Array.prototype.sort` being stable, which it is.
 *
 * Markups that genuinely cross (`[0,6)` overlapping `[3,9)`) cannot be nested in
 * markdown at all without splitting them; they come out interleaved. Medium has
 * not been observed to emit them.
 * docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export const applyMarkups = (
  text: string,
  markups: readonly Markup[],
): string =>
  markups
    .filter((markup) => markup.start < markup.end)
    .sort((left, right) => left.start - right.start || right.end - left.end)
    .flatMap((markup, depth) => {
      const delimiters = markupDelimiters(markup)
      if (delimiters === null) return []
      // A bracket inside a link label ends or unbalances the label and leaves
      // the URL as visible text, so each one is escaped in place.
      const escapes =
        delimiters.open === '['
          ? [...text.slice(markup.start, markup.end).matchAll(/[[\]]/g)].map(
              (found) => ({
                index: markup.start + found.index,
                stage: 2,
                order: depth,
                marker: '\\',
              }),
            )
          : []
      return [
        {
          index: markup.start,
          stage: 1,
          order: -depth,
          marker: delimiters.open,
        },
        { index: markup.end, stage: 0, order: depth, marker: delimiters.close },
        ...escapes,
      ]
    })
    .sort(
      (left, right) =>
        right.index - left.index ||
        right.stage - left.stage ||
        left.order - right.order,
    )
    .reduce(
      (rendered, edge) =>
        rendered.slice(0, edge.index) +
        edge.marker +
        rendered.slice(edge.index),
      text,
    )
