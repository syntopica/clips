import { describe, expect, it } from 'vitest'

import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { syntopicaConfigTestState } from '../testing/syntopica-config-test-state.ts'
import { loadSyntopicaSchema } from './load-syntopica-schema.ts'

describe('loadSyntopicaSchema', () => {
  it('loads from the configured engine origin and fails when that schema is absent', () => {
    const { root, document, origins } = syntopicaConfigTestState()
    expect(loadSyntopicaSchema(document, origins)['title']).toBe(
      'Syntopica data directory configuration',
    )
    rmSync(join(root, 'engine-brain/schema/syntopica-config.schema.json'))
    expect(() => loadSyntopicaSchema(document, origins)).toThrow()
  })
  it('requires a nonempty engine path with a known defining file', () => {
    expect(() =>
      loadSyntopicaSchema({ engines: { brain: { path: '' } } }, new Map()),
    ).toThrow('brain checkout')
  })
})
