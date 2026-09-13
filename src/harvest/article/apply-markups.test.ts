import { describe, expect, it } from 'vitest'
import { applyMarkups } from './apply-markups.ts'
import type { Markup } from './markup.ts'
import { MEDIUM_ARTICLE_FIXTURE } from './medium-article-fixture.ts'
import type { MediumParagraph } from './medium-paragraph.ts'
import { parseApolloState } from './parse-apollo-state.ts'

const state = parseApolloState(MEDIUM_ARTICLE_FIXTURE)

const fixtureParagraph = (index: number): MediumParagraph =>
  state[`Paragraph:ab5b609961d2_${String(index)}`] as MediumParagraph

const strong = (start: number, end: number): Markup => ({
  type: 'STRONG',
  start,
  end,
})

const code = (start: number, end: number): Markup => ({
  type: 'CODE',
  start,
  end,
})

const HREF = 'https://x.test'

const link = (start: number, end: number, href = HREF): Markup => ({
  type: 'A',
  start,
  end,
  href,
  anchorType: 'LINK',
})

describe('applyMarkups', () => {
  it('returns the text untouched when there are no markups', () => {
    expect(applyMarkups('plain text', [])).toBe('plain text')
  })

  it('renders the three markup types measured on a real article', () => {
    const bullet = fixtureParagraph(6)
    const numbered = fixtureParagraph(26)
    const inline = fixtureParagraph(40)

    expect(applyMarkups(bullet.text, bullet.markups)).toContain(
      '**Context window:**',
    )
    expect(applyMarkups(numbered.text, numbered.markups)).toBe(
      'Go to [Mira](https://agentmira.io/) and create a free account.',
    )
    expect(applyMarkups(inline.text, inline.markups)).toBe(
      'Go to Hugging Face and find `zai-org/GLM-5.2`.',
    )
  })

  it('renders an EM span as markdown italics', () => {
    expect(applyMarkups('abcdefghij', [{ type: 'EM', start: 0, end: 5 }])).toBe(
      '_abcde_fghij',
    )
  })

  it('handles a markup anchored at index 0', () => {
    expect(applyMarkups('abcdefghij', [strong(0, 5)])).toBe('**abcde**fghij')
  })

  it('handles a markup running to the end of the string', () => {
    expect(applyMarkups('hello world', [strong(6, 11)])).toBe('hello **world**')
  })

  it('handles a markup spanning the whole string', () => {
    expect(applyMarkups('abcde', [code(0, 5)])).toBe('`abcde`')
  })

  it('keeps adjacent markups separate instead of merging them', () => {
    expect(applyMarkups('abcdefghij', [strong(0, 5), code(5, 10)])).toBe(
      '**abcde**`fghij`',
    )
  })

  it('nests an inner markup inside an outer one', () => {
    expect(applyMarkups('abcdefghij', [strong(0, 10), code(5, 10)])).toBe(
      '**abcde`fghij`**',
    )
  })

  it('nests an inner markup that starts with the outer one', () => {
    expect(applyMarkups('abcdefghij', [strong(0, 10), code(0, 5)])).toBe(
      '**`abcde`fghij**',
    )
  })

  it('nests two markups covering the identical range', () => {
    expect(applyMarkups('abcde', [strong(0, 5), code(0, 5)])).toBe(
      '**`abcde`**',
    )
  })

  it('nests the same identical range the other way round', () => {
    expect(applyMarkups('abcde', [code(0, 5), strong(0, 5)])).toBe(
      '`**abcde**`',
    )
  })

  it('nests three markups without crossing their delimiters', () => {
    expect(
      applyMarkups('abcdefghij', [strong(0, 10), code(2, 8), strong(4, 6)]),
    ).toBe('**ab`cd**ef**gh`ij**')
  })

  it('escapes brackets inside a link label', () => {
    expect(applyMarkups('see [note] here', [link(0, 10)])).toBe(
      '[see \\[note\\]](https://x.test) here',
    )
  })

  it('escapes a bracket that sits at the very end of a link label', () => {
    expect(applyMarkups('a] b', [link(0, 2)])).toBe('[a\\]](https://x.test) b')
  })

  it('leaves brackets outside a link label alone', () => {
    expect(applyMarkups('[a] b', [link(4, 5)])).toBe('[a] [b](https://x.test)')
  })

  it('escapes brackets for a link nested inside a strong span', () => {
    expect(applyMarkups('go [x] now', [strong(0, 10), link(3, 6)])).toBe(
      '**go [\\[x\\]](https://x.test) now**',
    )
  })

  it('treats offsets as UTF-16 code units, not code points', () => {
    expect(applyMarkups('\u{1F680} boom', [strong(3, 7)])).toBe(
      '\u{1F680} **boom**',
    )
  })

  it('leaves an unsupported markup type unrendered', () => {
    expect(applyMarkups('abcde', [{ type: 'MARK', start: 0, end: 5 }])).toBe(
      'abcde',
    )
  })

  it('leaves a link without an href unrendered', () => {
    expect(
      applyMarkups('abcde', [{ type: 'A', start: 0, end: 5, href: null }]),
    ).toBe('abcde')
  })

  it('drops a zero-length markup rather than emitting empty delimiters', () => {
    expect(applyMarkups('abcde', [strong(2, 2)])).toBe('abcde')
  })

  it('preserves every original character of the text', () => {
    const text = 'the quick brown fox'
    const rendered = applyMarkups(text, [
      strong(0, 9),
      code(4, 15),
      link(10, 19),
    ])

    expect(rendered.replaceAll(/\*\*|`|\[|\]\(https:\/\/x\.test\)/g, '')).toBe(
      text,
    )
  })
})
