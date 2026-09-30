import { describe, expect, it } from 'vitest'
import { selectedPageCandidates } from './selected-page-candidates.ts'

describe('selectedPageCandidates', () => {
  it('keeps a well-formed path first', () => {
    expect(selectedPageCandidates('brain/topics/a.md', 'brain')[0]).toBe(
      'brain/topics/a.md',
    )
  })

  it('adds the suffix the local model left off', () => {
    // The measured answer: root prefixed, no `.md`.
    expect(
      selectedPageCandidates('brain/projects/ai-text-watermarking', 'brain'),
    ).toContain('brain/projects/ai-text-watermarking.md')
  })

  it('reads a wikilink spelling under the page root', () => {
    expect(selectedPageCandidates('[[topics/a]]', 'brain')).toContain(
      'brain/topics/a.md',
    )
  })

  it('adds no root to a flat layout', () => {
    expect(selectedPageCandidates('topics/a', '')).toEqual([
      'topics/a',
      'topics/a.md',
    ])
  })
})
