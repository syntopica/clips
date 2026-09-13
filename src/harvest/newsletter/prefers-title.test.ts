import { describe, expect, it } from 'vitest'
import { prefersTitle } from './prefers-title.ts'

const TITLE = {
  title: 'OKF + RAG: The Ultimate AI Agent Architecture',
  headingLevel: 2,
}
const SUBTITLE = {
  title:
    'Every AI agent has a memory problem. Ask it about yesterday and watch it fail.',
  headingLevel: 3,
}

describe('prefersTitle', () => {
  it('keeps the ## title even when the ### subtitle is longer', () => {
    expect(SUBTITLE.title.length).toBeGreaterThan(TITLE.title.length)
    expect(prefersTitle(SUBTITLE, TITLE)).toBe(false)
    expect(prefersTitle(TITLE, SUBTITLE)).toBe(true)
  })

  it('falls back to the longer string when the levels tie', () => {
    expect(
      prefersTitle({ title: 'Longer title here', headingLevel: 2 }, TITLE),
    ).toBe(false)
    expect(
      prefersTitle(
        { title: `${TITLE.title} and then some`, headingLevel: 2 },
        TITLE,
      ),
    ).toBe(true)
  })

  it('prefers any heading link over one found outside a heading', () => {
    expect(
      prefersTitle(SUBTITLE, { title: 'x'.repeat(400), headingLevel: null }),
    ).toBe(true)
    expect(
      prefersTitle({ title: 'x'.repeat(400), headingLevel: null }, SUBTITLE),
    ).toBe(false)
  })

  it('compares two headingless links by length', () => {
    expect(
      prefersTitle(
        { title: 'longer', headingLevel: null },
        { title: 'short', headingLevel: null },
      ),
    ).toBe(true)
  })
})
