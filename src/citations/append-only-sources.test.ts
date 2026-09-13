import { describe, expect, it } from 'vitest'
import { appendOnlySources } from './append-only-sources.ts'

const committed = ['a.md', 'https://b.example/']

describe('appendOnlySources', () => {
  it('accepts an entry added at the end', () => {
    expect(appendOnlySources(committed, [...committed, 'c.md'])).toBe(true)
  })

  it('accepts the list left exactly as it was', () => {
    expect(appendOnlySources(committed, [...committed])).toBe(true)
  })

  it('refuses a reorder, which reattributes every marker between the two', () => {
    expect(appendOnlySources(committed, ['https://b.example/', 'a.md'])).toBe(
      false,
    )
  })

  it('refuses a deletion', () => {
    expect(appendOnlySources(committed, ['a.md'])).toBe(false)
  })

  it('refuses a substitution that keeps the length', () => {
    expect(appendOnlySources(committed, ['a.md', 'https://c.example/'])).toBe(
      false,
    )
  })

  it('accepts any list on a page that had no sources', () => {
    expect(appendOnlySources([], ['a.md'])).toBe(true)
  })
})
