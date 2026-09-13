import { describe, expect, it } from 'vitest'

import { overrideCaptureOrigin } from './override-capture-origin.ts'

describe('overrideCaptureOrigin', () => {
  it('preserves input and siblings while overriding only the named setting', () => {
    const document = { capture: { origin: null, preserved: true } }
    expect(
      overrideCaptureOrigin(document, {
        CAPTURE_SERVICE_ORIGIN: 'https://override.example',
      }),
    ).toEqual({
      capture: { origin: 'https://override.example', preserved: true },
    })
    expect(document.capture.origin).toBeNull()
  })
  it('leaves an absent override alone and preserves explicit empty strings for validation', () => {
    const document = { capture: { origin: null } }
    expect(overrideCaptureOrigin(document, {})).toBe(document)
    expect(
      overrideCaptureOrigin(document, { CAPTURE_SERVICE_ORIGIN: '' }),
    ).toEqual({ capture: { origin: '' } })
  })
})
