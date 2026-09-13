import { describe, expect, it } from 'vitest'
import { formatRejectionGuidance } from './format-rejection-guidance.ts'

describe('formatRejectionGuidance', () => {
  it('adds nothing for a clip that has never been rejected', () => {
    expect(formatRejectionGuidance([])).toBe('')
  })

  it('quotes the reviewer word for word', () => {
    const guidance = formatRejectionGuidance([
      { at: '2026-08-03T10:00:00.000Z', reason: 'Invented a release date.' },
    ])

    expect(guidance).toContain('Invented a release date.')
    expect(guidance).toContain('1 earlier draft of this clip')
  })

  it('numbers several rejections oldest first', () => {
    const guidance = formatRejectionGuidance([
      { at: '2026-08-01T10:00:00.000Z', reason: 'first' },
      { at: '2026-08-02T10:00:00.000Z', reason: 'second' },
    ])

    expect(guidance).toContain('2 earlier drafts')
    expect(guidance.indexOf('1. ')).toBeLessThan(guidance.indexOf('2. '))
  })
})
