import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { makeSyntopicaConfigFixture } from '../testing/make-syntopica-config-fixture.ts'
import { loadSyntopicaConfig } from './load-syntopica-config.ts'
import { readSyntopicaJson } from './read-syntopica-json.ts'
import { runSyntopicaGit } from './run-syntopica-git.ts'

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

  it('honors local file symlink origins for content, project and browser paths', () => {
    const directory = join(data, 'machine')
    mkdirSync(directory)
    writeFileSync(
      join(directory, 'local.json'),
      JSON.stringify({
        brain: { sources: 'captures' },
        browser: { executable: './bin/browser' },
        projects: { roots: ['../projects'] },
      }),
    )
    symlinkSync(join(directory, 'local.json'), join(data, localName))
    const config = loadSyntopicaConfig(data, {})
    expect(config.sources).toBe(join(directory, 'captures'))
    expect(config.browser).toBe(join(directory, 'bin/browser'))
    expect(config.projectRoots).toEqual([join(data, 'projects')])
    expect(
      loadSyntopicaConfig(data, { CLIPS_HEADLESS_BROWSER: './bin/browser' })
        .browser,
    ).toBe(join(data, 'bin/browser'))
  })
  it('uses an overridden engine checkout to select the schema', () => {
    const replacement = join(root, 'replacement')
    mkdirSync(join(replacement, 'schema'), { recursive: true })
    expect(
      runSyntopicaGit(replacement, ['init', '--quiet', '--template=']).status,
    ).toBe(0)
    copyFileSync(
      join(root, schemaRelative),
      join(replacement, 'schema/syntopica-config.schema.json'),
    )
    writeFileSync(
      join(data, localName),
      JSON.stringify({ engines: { brain: { path: replacement } } }),
    )
    expect(loadSyntopicaConfig(data, {}).brainPath).toBe(replacement)
  })
  it('rejects content symlinks escaping the data directory and symlink loops', () => {
    symlinkSync(root, join(data, 'escape'))
    writeFileSync(
      join(data, localName),
      '{"brain":{"sources":"escape/captures"}}',
    )
    expect(() => loadSyntopicaConfig(data, {})).toThrow('escapes')
    symlinkSync('loop', join(data, 'loop'))
    writeFileSync(
      join(data, localName),
      '{"brain":{"sources":"loop/captures"}}',
    )
    expect(() => loadSyntopicaConfig(data, {})).toThrow('cannot be resolved')
  })
  it('rejects duplicate keys even when escaped, invalid JSON, and invalid UTF-8', () => {
    for (const text of [
      '{"instanceId":"a","instance\\u0049d":"b"}',
      '{"broken": NaN}',
      '{',
      '[1]',
    ]) {
      writeFileSync(join(data, localName), text)
      expect(() => loadSyntopicaConfig(data, {})).toThrow()
    }
    writeFileSync(join(data, localName), Buffer.from([0xff]))
    expect(() => loadSyntopicaConfig(data, {})).toThrow()
  })

  it('resolves engine parents after following symlinks', () => {
    const nested = join(root, 'nested')
    mkdirSync(nested)
    symlinkSync(nested, join(data, 'engine-link'))
    writeFileSync(
      join(data, localName),
      JSON.stringify({
        engines: { clips: { path: 'engine-link/../engine-clips' } },
      }),
    )
    expect(loadSyntopicaConfig(data, {}).clipsPath).toBe(
      join(root, 'engine-clips'),
    )
  })

  it('takes tracked defaults and paths from the tracked config symlink target', () => {
    const directory = join(data, 'machine')
    mkdirSync(directory)
    mkdirSync(join(directory, 'clips'))
    expect(
      runSyntopicaGit(join(directory, 'clips'), [
        'init',
        '--quiet',
        '--template=',
      ]).status,
    ).toBe(0)
    const tracked = readSyntopicaJson(join(data, 'syntopica.config.json'))
    tracked['engines'] = {
      brain: { path: '../../engine-brain', apiVersion: 1 },
      clips: { path: '../../engine-clips', apiVersion: 1 },
    }
    writeFileSync(join(directory, 'tracked.json'), JSON.stringify(tracked))
    rmSync(join(data, 'syntopica.config.json'))
    symlinkSync(
      join(directory, 'tracked.json'),
      join(data, 'syntopica.config.json'),
    )
    const config = loadSyntopicaConfig(data, {})
    expect(config.sources).toBe(join(directory, 'brain/captures'))
    expect(config.atriumPath).toBe(join(directory, 'atrium'))
    expect(config.archive).toBe(join(directory, 'clips'))
  })
})
