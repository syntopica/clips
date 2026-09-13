import { describe, expect, it } from 'vitest'

import { syntopicaSchemaDefaults } from './syntopica-schema-defaults.ts'

describe('syntopicaSchemaDefaults', () => {
  it('collects schema annotations without inventing required fields or sharing mutable arrays', () => {
    const schema = {
      properties: {
        required: { type: 'string' },
        section: {
          type: 'object',
          properties: {
            disabled: { default: null },
            paths: { default: ['a'] },
          },
        },
      },
    }
    const defaults = syntopicaSchemaDefaults(schema)
    expect(defaults).toEqual({ section: { disabled: null, paths: ['a'] } })
    schema.properties.section.properties.paths.default.push('b')
    expect(defaults).toEqual({ section: { disabled: null, paths: ['a'] } })
  })
})
