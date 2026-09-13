import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { findDataDirectory } from './find-data-directory.ts'

describe('findDataDirectory', () => {
  const configName = 'syntopica.config.json'
  let root: string
  beforeEach(() => {
    root = realpathSync(mkdtempSync(join(tmpdir(), 'syntopica-discovery-')))
    mkdirSync(join(root, '.git'))
    writeFileSync(join(root, configName), '{}')
  })
  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it('gives the explicit directory precedence over environment and walk', () => {
    expect(findDataDirectory(root, { SYNTOPICA_DATA: '/absent' }, '/tmp')).toBe(
      root,
    )
  })
  it('does not fall through from an invalid explicit or environment selection', () => {
    expect(() =>
      findDataDirectory('/absent', { SYNTOPICA_DATA: root }, root),
    ).toThrow(configName)
    expect(() =>
      findDataDirectory(undefined, { SYNTOPICA_DATA: '/absent' }, root),
    ).toThrow(configName)
  })
  it('resolves environment and relative selections from the caller', () => {
    expect(findDataDirectory(undefined, { SYNTOPICA_DATA: root }, '/tmp')).toBe(
      root,
    )
    expect(findDataDirectory('.', {}, root)).toBe(root)
  })
  it('walks upward but does not cross a nested Git root', () => {
    const child = join(root, 'nested', 'child')
    mkdirSync(child, { recursive: true })
    expect(findDataDirectory(undefined, {}, child)).toBe(root)
    mkdirSync(join(root, 'nested', '.git'))
    expect(() => findDataDirectory(undefined, {}, child)).toThrow(configName)
  })
})
