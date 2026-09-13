import { describe, expect, it } from 'vitest'

import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { syntopicaConfigTestState } from '../testing/syntopica-config-test-state.ts'
import { readSyntopicaJson } from './read-syntopica-json.ts'

describe('readSyntopicaJson', () => {
  it('rejects duplicate keys, non-objects and invalid UTF-8 without echoing JSON', () => {
    const { data } = syntopicaConfigTestState()
    const path = join(data, 'input.json')
    for (const text of [
      '{"private":1,"private":2}',
      '[1]',
      '{"private":NaN}',
    ]) {
      writeFileSync(path, text)
      expect(() => readSyntopicaJson(path)).toThrow('UTF-8 JSON')
      expect(() => readSyntopicaJson(path)).not.toThrow(/private/u)
    }
    writeFileSync(path, Buffer.from([0xff]))
    expect(() => readSyntopicaJson(path)).toThrow('UTF-8 JSON')
  })
})
