import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { makeSyntopicaConfigFixture } from '../testing/make-syntopica-config-fixture.ts'
import { loadSyntopicaConfig } from './load-syntopica-config.ts'
import { readSyntopicaJson } from './read-syntopica-json.ts'

describe('loadSyntopicaConfig', () => {
  const localName = 'syntopica.local.json'
  const schemaRelative = 'engine-brain/schema/syntopica-config.schema.json'
  let root: string
  let data: string
  beforeEach(() => {
    root = realpathSync(mkdtempSync(join(tmpdir(), 'syntopica-config-')))
    data = makeSyntopicaConfigFixture(root)
  })
  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it.each([
    { unknown: true },
    { capture: { origin: 'https://user:secret@example.test' } },
    { capture: { origin: 'https://example.test:99999' } },
    { brain: { pages: ['../escape'] } },
    { runners: { grade: 'shell command' } },
    { browser: { executable: 'https://example.test?signature=secret' } },
  ])(
    'rejects invalid configuration without disclosing values: %j',
    (overlay) => {
      writeFileSync(join(data, localName), JSON.stringify(overlay))
      expect(() => loadSyntopicaConfig(data, {})).toThrow()
      expect(() => loadSyntopicaConfig(data, {})).not.toThrow(/secret/u)
    },
  )
  it('loads the selected runtime schema on every call', () => {
    expect(loadSyntopicaConfig(data, {}).captureMirror).toBe(false)
    const path = join(root, schemaRelative)
    const text = JSON.stringify(readSyntopicaJson(path)).replace(
      '"default":false',
      '"default":true',
    )
    writeFileSync(path, text)
    expect(loadSyntopicaConfig(data, {}).captureMirror).toBe(true)
    writeFileSync(path, text.replace('"minimum":1', '"minimum":2'))
    expect(() => loadSyntopicaConfig(data, {})).toThrow('schema')
  })
  it('carries the selected schema path classification on every load', () => {
    const path = join(root, schemaRelative)
    const config = loadSyntopicaConfig(data, {})
    expect(config.statePaths).toEqual([config.memPath])
    expect(config.configuredPaths).toContain(config.sources)
    expect(config.configuredPaths).not.toContain(config.memPath)
    expect(Object.isFrozen(config.statePaths)).toBe(true)
    expect(Object.isFrozen(config.configuredPaths)).toBe(true)
    const schema = JSON.stringify(readSyntopicaJson(path))
    writeFileSync(
      path,
      schema.replaceAll('"x-path-kind":"required"', '"x-path-kind":"state"'),
    )
    const changed = loadSyntopicaConfig(data, {})
    expect(changed.configuredPaths).toEqual([])
    expect(changed.statePaths).toContain(config.sources)
    writeFileSync(path, schema.replaceAll('"x-path-kind":"required",', ''))
    expect(() => loadSyntopicaConfig(data, {})).toThrow(
      'must declare x-path-kind',
    )
  })
  it('fails closed on unsupported schema keywords and missing schema', () => {
    const path = join(root, schemaRelative)
    const schema = readSyntopicaJson(path)
    schema['futureConstraint'] = true
    writeFileSync(path, JSON.stringify(schema))
    expect(() => loadSyntopicaConfig(data, {})).toThrow('schema')
    rmSync(path)
    expect(() => loadSyntopicaConfig(data, {})).toThrow()
  })
  it('does not read an adjacent .env file', () => {
    writeFileSync(
      join(data, '.env'),
      'CAPTURE_SERVICE_ORIGIN=https://ignored.example',
    )
    expect(loadSyntopicaConfig(data, {}).captureOrigin).toBeNull()
  })
})
