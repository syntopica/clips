import { describe, expect, it } from 'vitest'

import { validateSyntopicaSchema } from './validate-syntopica-schema.ts'

describe('validateSyntopicaSchema', () => {
  it('obeys changed required fields and numeric constraints without leaking inputs', () => {
    const schema = {
      type: 'object',
      additionalProperties: false,
      properties: { count: { type: 'integer', minimum: 2 } },
      required: ['count'],
    }
    expect(() => {
      validateSyntopicaSchema({ count: 2 }, schema)
    }).not.toThrow()
    expect(() => {
      validateSyntopicaSchema({ count: 1 }, schema)
    }).toThrow('schema')
    expect(() => {
      validateSyntopicaSchema({ count: true }, schema)
    }).toThrow('schema')
    expect(() => {
      validateSyntopicaSchema({ count: 'private-value' }, schema)
    }).not.toThrow(/private-value/u)
    expect(() => {
      validateSyntopicaSchema({}, schema)
    }).toThrow('schema')
  })
})
