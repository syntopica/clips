import { describe, expect, it } from 'vitest'

import { syntopicaValueOrigins } from './syntopica-value-origins.ts'

describe('syntopicaValueOrigins', () => {
  it('tracks array replacement and explicit null at their defining file', () => {
    const origins = syntopicaValueOrigins(
      { section: { paths: ['a', 'b'], empty: null }, flag: true },
      '/fixture',
    )
    expect([...origins]).toEqual([
      ['section.paths', '/fixture'],
      ['section.empty', '/fixture'],
      ['flag', '/fixture'],
    ])
    expect(origins.has('section.paths.0')).toBe(false)
  })
})
