import { describe, expect, it } from 'vitest'

import { overrideHeadlessBrowser } from './override-headless-browser.ts'

describe('overrideHeadlessBrowser', () => {
  it('preserves input and siblings while overriding only the named setting', () => {
    const document = { browser: { executable: null, preserved: true } }
    expect(
      overrideHeadlessBrowser(document, {
        CLIPS_HEADLESS_BROWSER: './browser',
      }),
    ).toEqual({ browser: { executable: './browser', preserved: true } })
    expect(document.browser.executable).toBeNull()
  })
  it('leaves an absent override alone and preserves explicit empty strings for validation', () => {
    const document = { browser: { executable: null } }
    expect(overrideHeadlessBrowser(document, {})).toBe(document)
    expect(
      overrideHeadlessBrowser(document, { CLIPS_HEADLESS_BROWSER: '' }),
    ).toEqual({ browser: { executable: '' } })
  })
})
