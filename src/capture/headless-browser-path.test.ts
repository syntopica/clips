import { afterEach, describe, expect, it } from 'vitest'
import { headlessBrowserPath } from './headless-browser-path.ts'

afterEach(() => {
  delete process.env['CLIPS_HEADLESS_BROWSER']
})

describe('headlessBrowserPath', () => {
  it('takes the configured browser when it exists', () => {
    process.env['CLIPS_HEADLESS_BROWSER'] = process.execPath
    expect(headlessBrowserPath()).toBe(process.execPath)
  })

  it('is null for a configured browser that is not installed', () => {
    process.env['CLIPS_HEADLESS_BROWSER'] = '/nowhere/Chrome'
    expect(headlessBrowserPath()).toBeNull()
  })

  it('falls back to the default when the variable is empty', () => {
    process.env['CLIPS_HEADLESS_BROWSER'] = ''
    // Either outcome is correct - the default is a macOS path and CI is not a
    // Mac - so this asserts the shape rather than the machine.
    const path = headlessBrowserPath()
    expect(path === null || path.endsWith('Google Chrome')).toBe(true)
  })
})
