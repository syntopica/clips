import { describe, expect, it } from 'vitest'

import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { syntopicaConfigTestState } from '../testing/syntopica-config-test-state.ts'
import { readSyntopicaDocument } from './read-syntopica-document.ts'

describe('readSyntopicaDocument', () => {
  it('rejects authenticated URLs before returning a parsed document', () => {
    const { data } = syntopicaConfigTestState()
    const path = join(data, 'input.json')
    writeFileSync(path, '{"remote":"https://user:private@example.test"}')
    expect(() => readSyntopicaDocument(path)).toThrow('credentials')
    writeFileSync(path, '{"capture":{"origin":null}}')
    expect(readSyntopicaDocument(path)).toEqual({ capture: { origin: null } })
  })
})
