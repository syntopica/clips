import { describe, expect, it } from 'vitest'

import { triagePrompt } from './triage-prompt.ts'

describe('triagePrompt', () => {
  it('carries the configured profile and topics, and nobody else', () => {
    const prompt = triagePrompt('1\tTitle\twords', 'Interests: compilers.', [
      'compilers',
      'other',
    ])
    expect(prompt).toContain(
      'personal knowledge wiki.\n\nInterests: compilers.\n',
    )
    expect(prompt).toContain('Assign a topic: compilers, other.')
    expect(prompt).toMatch(/INPUT:\n1\tTitle\twords$/)
  })

  it('says so when no profile is configured instead of leaving a gap', () => {
    const prompt = triagePrompt('', '  ', ['other'])
    expect(prompt).toContain('No interest profile is configured.')
  })
})
