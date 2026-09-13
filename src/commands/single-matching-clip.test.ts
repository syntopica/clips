import { describe, expect, it } from 'vitest'
import type { Clip } from '../clips/clip.ts'
import type { ThinClip } from '../clips/thin-clip.ts'
import { singleMatchingClip } from './single-matching-clip.ts'

const clip = (id: string): Clip =>
  ({ kind: 'clip', metadata: { clip_id: id } }) as unknown as Clip

const first = clip('01KYFXABHY680TKQHM1WYG7FJG')
const second = clip('01KYFXABZZ680TKQHM1WYG7FJG')
const other = clip('01KZZZZZHY680TKQHM1WYG7FJG')

describe('singleMatchingClip', () => {
  it('finds a clip by its full id', () => {
    expect(
      singleMatchingClip([first, other], '01KYFXABHY680TKQHM1WYG7FJG'),
    ).toBe(first)
  })

  it('finds a clip by the 8-character prefix clips status prints', () => {
    expect(singleMatchingClip([first, other], '01kyfxabhy')).toBe(first)
  })

  it('refuses an ambiguous prefix instead of picking one', () => {
    // These commands move a directory and commit; guessing which of two the
    // operator meant has to be undone by hand.
    const result = singleMatchingClip([first, second], '01KYFXAB')
    expect(result).toContain('matches 2 clips')
  })

  it('reports a filter that matches nothing', () => {
    expect(singleMatchingClip([first], '01ZZZZZZ')).toContain('no clip matches')
  })

  it('never matches a thin clip, which has no id to match on', () => {
    const thin = { kind: 'thin', directory: '/x/y' } as unknown as ThinClip
    expect(singleMatchingClip([thin], '01KYFXAB')).toContain('no clip matches')
  })
})
