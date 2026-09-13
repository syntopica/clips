import { describe, expect, it } from 'vitest'
import { MEDIUM_ARTICLE_FIXTURE } from './medium-article-fixture.ts'
import type { MediumParagraph } from './medium-paragraph.ts'
import { paragraphToMarkdown } from './paragraph-to-markdown.ts'
import { parseApolloState } from './parse-apollo-state.ts'

const state = parseApolloState(MEDIUM_ARTICLE_FIXTURE)

const fixtureParagraph = (index: number): MediumParagraph =>
  state[`Paragraph:ab5b609961d2_${String(index)}`] as MediumParagraph

const paragraph = (
  type: string,
  text: string,
  rest: Partial<MediumParagraph> = {},
): MediumParagraph => ({ type, text, markups: [], ...rest })

describe('paragraphToMarkdown', () => {
  it('renders the fixture heading as an h3', () => {
    expect(paragraphToMarkdown(fixtureParagraph(3))).toBe(
      '### What GLM-5.2 actually is',
    )
  })

  it('renders a plain paragraph as its text', () => {
    expect(paragraphToMarkdown(fixtureParagraph(1))).toBe(
      fixtureParagraph(1).text,
    )
  })

  it('renders the heading levels Medium emits', () => {
    expect(paragraphToMarkdown(paragraph('H2', 'Two'))).toBe('## Two')
    expect(paragraphToMarkdown(paragraph('H3', 'Three'))).toBe('### Three')
    expect(paragraphToMarkdown(paragraph('H4', 'Four'))).toBe('#### Four')
  })

  it('renders list items with the markups applied', () => {
    expect(paragraphToMarkdown(fixtureParagraph(6))).toMatch(
      /^- \*\*Context window:\*\* about 1 million tokens\./,
    )
    expect(paragraphToMarkdown(fixtureParagraph(26))).toBe(
      '1. Go to [Mira](https://agentmira.io/) and create a free account.',
    )
  })

  it('renders both quote types as a blockquote', () => {
    expect(paragraphToMarkdown(paragraph('BQ', 'quoted'))).toBe('> quoted')
    expect(paragraphToMarkdown(paragraph('PQ', 'pulled'))).toBe('> pulled')
  })

  it('fences a code block with the declared language', () => {
    expect(paragraphToMarkdown(fixtureParagraph(43))).toBe(
      '```typescript\npip install transformers torch accelerate\n```',
    )
  })

  it('fences a multi-line code block verbatim', () => {
    expect(paragraphToMarkdown(fixtureParagraph(45))).toBe(
      `\`\`\`python\n${fixtureParagraph(45).text}\n\`\`\``,
    )
  })

  it('fences a code block with no language when none is declared', () => {
    expect(
      paragraphToMarkdown(
        paragraph('PRE', 'echo hi', { codeBlockMetadata: null }),
      ),
    ).toBe('```\necho hi\n```')
  })

  it('never applies markups inside a code block', () => {
    expect(
      paragraphToMarkdown(
        paragraph('PRE', 'const a = 1', {
          markups: [{ type: 'STRONG', start: 0, end: 5 }],
        }),
      ),
    ).toBe('```\nconst a = 1\n```')
  })

  it('renders an image from its metadata id', () => {
    expect(paragraphToMarkdown(fixtureParagraph(2))).toBe(
      '![](https://miro.medium.com/v2/1*zoeJufKxo3PHcjZcWyByZQ.png)',
    )
  })

  it('uses the image alt text when Medium supplies one', () => {
    expect(
      paragraphToMarkdown(
        paragraph('IMG', '', { metadata: { id: '1*x.png', alt: 'a chart' } }),
      ),
    ).toBe('![a chart](https://miro.medium.com/v2/1*x.png)')
  })

  it('skips an image with no metadata id', () => {
    expect(paragraphToMarkdown(paragraph('IMG', '', { metadata: null }))).toBe(
      '',
    )
  })

  it('falls back to the plain text for an unknown type', () => {
    expect(paragraphToMarkdown(paragraph('MIXTAPE_EMBED', 'An embed'))).toBe(
      'An embed',
    )
    expect(paragraphToMarkdown(paragraph('IFRAME', ''))).toBe('')
    expect(paragraphToMarkdown(paragraph('SOMETHING_NEW', 'text'))).toBe('text')
  })

  it('always returns a string', () => {
    expect(typeof paragraphToMarkdown(paragraph('IFRAME', ''))).toBe('string')
  })
})
