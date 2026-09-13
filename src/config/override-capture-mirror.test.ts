import { describe, expect, it } from 'vitest'

import { overrideCaptureMirror } from './override-capture-mirror.ts'

describe('overrideCaptureMirror', () => {
  it.each([
    ['on', true],
    ['off', false],
  ] as const)(
    'decodes %s without mutating the document',
    (setting, expected) => {
      const document = { capture: { mirror: null, origin: null } }
      expect(
        overrideCaptureMirror(document, { CAPTURE_MIRROR: setting }),
      ).toEqual({ capture: { mirror: expected, origin: null } })
      expect(document.capture.mirror).toBeNull()
    },
  )
  it.each(['true', 'false', '1', '', 'ON'])(
    'rejects %s instead of guessing a boolean',
    (setting) => {
      expect(() =>
        overrideCaptureMirror({}, { CAPTURE_MIRROR: setting }),
      ).toThrow('on or off')
    },
  )
  it('leaves an absent override unchanged', () => {
    const document = { capture: { mirror: false } }
    expect(overrideCaptureMirror(document, {})).toBe(document)
  })
})
