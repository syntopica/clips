import { describe, expect, it } from 'vitest'
import { applyAnswerNamesClip } from './apply-answer-names-clip.ts'

const clipId = '01M098Y2MEC0V8XXXXXXXXXXXX'

describe('applyAnswerNamesClip', () => {
  it('accepts a lowercased prefix of sixteen or more characters', () => {
    expect(applyAnswerNamesClip('a 01m098y2mec0v8xx', clipId)).toBe(true)
    expect(applyAnswerNamesClip(`a ${clipId.toLowerCase()}`, clipId)).toBe(true)
  })

  it('refuses a bare apply with no clip named', () => {
    expect(applyAnswerNamesClip('a', clipId)).toBe(false)
  })

  it('refuses a prefix shorter than sixteen characters', () => {
    expect(applyAnswerNamesClip('a 01m098y2mec0', clipId)).toBe(false)
  })

  it('refuses an id that names a different clip', () => {
    expect(applyAnswerNamesClip('a 01kysgc20y00ezjs', clipId)).toBe(false)
  })

  // Two clips harvested in the same millisecond share their whole ULID
  // timestamp and then some: these two real ids agree for twelve characters,
  // which is how a stale answer applied an unreviewed diff on 2026-09-11.
  it('tells apart two clips that share a twelve-character prefix', () => {
    const first = '01KYSGC20Y00EZJSSSFXW0NTV3'
    const second = '01KYSGC20Y00GK8SEMAE6PS387'
    expect(applyAnswerNamesClip('a 01kysgc20y00ezjs', second)).toBe(false)
    expect(applyAnswerNamesClip('a 01kysgc20y00ezjs', first)).toBe(true)
  })
})
