import { describe, expect, it } from 'vitest'
import { graderAuthorRefusal } from './grader-author-refusal.ts'

describe('graderAuthorRefusal', () => {
  it('lets an answer from a tier that did not write the page stand', () => {
    expect(
      graderAuthorRefusal({ provider: 'agy', model: 'gemini-3.1-pro-high' }, [
        'codex',
      ]),
    ).toBeNull()
  })

  it('discards an answer from the tier that wrote the page', () => {
    // The ladder fell through to the model that wrote the batch: its verdict
    // is the author verifying itself, however clean it reads.
    expect(
      graderAuthorRefusal({ provider: 'ollama', model: 'qwen3.6:35b' }, [
        'local',
      ]),
    ).toMatch(/local tier that wrote this page/)
  })

  it('discards an answer from an executor it cannot place', () => {
    expect(graderAuthorRefusal(null, ['codex'])).toMatch(/cannot place/)
  })

  it('checks nothing where no author is known', () => {
    expect(graderAuthorRefusal(null, null)).toBeNull()
  })
})
