import { describe, expect, it } from 'vitest'
import { mediumViewerId } from './medium-viewer-id.ts'

describe('mediumViewerId', () => {
  it('reads the id out of the Apollo cache key', () => {
    const html =
      'window.__APOLLO_STATE__={"User:8bf66de01196":{"id":"8bf66de01196"}}'
    expect(mediumViewerId(html)).toBe('8bf66de01196')
  })

  it('names the likely cause when the page carries no user', () => {
    expect(() =>
      mediumViewerId('<html><body>signed out</body></html>'),
    ).toThrow(/signed out/)
  })
})
