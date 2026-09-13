import { describe, expect, it } from 'vitest'

import { mkdirSync, symlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { syntopicaConfigTestState } from '../testing/syntopica-config-test-state.ts'
import { readSyntopicaLayers } from './read-syntopica-layers.ts'

describe('readSyntopicaLayers', () => {
  it('preserves defining file origins through a local symlink overlay', () => {
    const { data } = syntopicaConfigTestState()
    const directory = join(data, 'machine')
    mkdirSync(directory)
    writeFileSync(
      join(directory, 'override.json'),
      '{"brain":{"sources":"captures"}}',
    )
    symlinkSync(
      join(directory, 'override.json'),
      join(data, 'syntopica.local.json'),
    )
    const layers = readSyntopicaLayers(data)
    expect(layers.origins.get('brain.sources')).toBe(directory)
    expect(layers.origins.get('brain.index')).toBe(data)
    expect(layers.trackedDirectory).toBe(data)
  })
  it('rejects a dangling local override instead of silently ignoring it', () => {
    const { data } = syntopicaConfigTestState()
    symlinkSync('absent.json', join(data, 'syntopica.local.json'))
    expect(() => readSyntopicaLayers(data)).toThrow()
  })
})
