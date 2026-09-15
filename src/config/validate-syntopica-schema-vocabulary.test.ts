import { describe, expect, it } from 'vitest'

import { validateSyntopicaSchemaVocabulary } from './validate-syntopica-schema-vocabulary.ts'

describe('validateSyntopicaSchemaVocabulary', () => {
  it('fails closed on unsupported nested assertions and unknown formats', () => {
    expect(() => {
      validateSyntopicaSchemaVocabulary({
        type: 'array',
        items: { type: 'string', unknownAssertion: true },
      })
    }).toThrow('keyword')
    expect(() => {
      validateSyntopicaSchemaVocabulary({
        type: 'object',
        properties: { child: false },
      })
    }).toThrow('schema')
    expect(() => {
      validateSyntopicaSchemaVocabulary({ type: 'string', format: 'custom' })
    }).toThrow('format')
  })
  it('accepts the finite nested vocabulary used by the runtime schema', () => {
    expect(() => {
      validateSyntopicaSchemaVocabulary({
        type: 'object',
        additionalProperties: false,
        properties: {
          children: { type: 'array', items: { type: 'string', minLength: 1 } },
        },
      })
    }).not.toThrow()
  })
  it('accepts the x-path-kind annotation the brain engine schema carries', () => {
    expect(() => {
      validateSyntopicaSchemaVocabulary({
        type: 'object',
        properties: {
          ledger: { type: 'string', minLength: 1, 'x-path-kind': 'state' },
        },
      })
    }).not.toThrow()
  })
})
