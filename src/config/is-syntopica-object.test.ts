import { describe, expect, it } from 'vitest'

import { isSyntopicaObject } from './is-syntopica-object.ts'

describe('isSyntopicaObject', () => {
  it('distinguishes JSON objects from arrays, null, and primitives', () => {
    expect(isSyntopicaObject({})).toBe(true)
    expect(isSyntopicaObject(Object.create(null))).toBe(true)
    expect([[], null, false, 3, 'text'].map(isSyntopicaObject)).toEqual([
      false,
      false,
      false,
      false,
      false,
    ])
  })
})
