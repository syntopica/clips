import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
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

  it('resolves defaults and all optional paths and preserves API versions', () => {
    const config = loadSyntopicaConfig(data, {})
    expect(config).toMatchObject({
      dataRoot: data,
      schemaVersion: 1,
      instanceId: 'fixture',
      pages: [join(data, 'brain/notes')],
      archive: join(data, 'clips'),
      brainPath: join(root, 'engine-brain'),
      clipsPath: join(root, 'engine-clips'),
      brainApiVersion: 1,
      clipsApiVersion: 1,
      captureOrigin: null,
      captureMirror: false,
      browser: null,
      memPath: join(data, 'mem'),
      projectRoots: [],
      projectAliases: join(data, '.config/project-aliases.json'),
      newsletterAcceptedSenders: join(data, '.config/newsletter-accepted.json'),
    })
    expect(Object.isFrozen(config)).toBe(true)
    expect(Object.isFrozen(config.pages)).toBe(true)
    expect(Object.isFrozen(config.projectRoots)).toBe(true)
    expect(Object.isFrozen(config.runners)).toBe(true)
  })
  it('uses defaults, tracked, local, then seven named environment overrides', () => {
    const tracked = readSyntopicaJson(join(data, 'syntopica.config.json'))
    tracked['capture'] = { origin: 'https://tracked.example', mirror: true }
    tracked['runners'] = { grade: 'codex', triage: 'manual' }
    writeFileSync(join(data, 'syntopica.config.json'), JSON.stringify(tracked))
    writeFileSync(
      join(data, localName),
      JSON.stringify({
        capture: { origin: 'https://local.example' },
        runners: { grade: 'cursor' },
        browser: { executable: 'local-browser' },
      }),
    )
    expect(loadSyntopicaConfig(data, {}).captureOrigin).toBe(
      'https://local.example',
    )
    expect(loadSyntopicaConfig(data, {}).runners['triage']).toBe('manual')
    const config = loadSyntopicaConfig(data, {
      SYNTOPICA_DATA: '/absent',
      CAPTURE_SERVICE_ORIGIN: 'https://environment.example',
      CAPTURE_MIRROR: 'off',
      CLIPS_GRADE_RUNNER: 'agy-bulk',
      CLIPS_SYNTHESIS_RUNNER: 'manual',
      CLIPS_TRIAGE_RUNNER: 'cursor',
      CLIPS_TRIAGE_REFINER: 'agy-fine',
      CLIPS_HEADLESS_BROWSER: './browser',
    })
    expect(config.captureOrigin).toBe('https://environment.example')
    expect(config.captureMirror).toBe(false)
    expect(config.runners).toEqual({
      grade: 'agy-bulk',
      synthesis: 'manual',
      triage: 'cursor',
      triageRefiner: 'agy-fine',
    })
    expect(config.browser).toBe(join(data, 'browser'))
  })
  it('never reads the runtime credential', () => {
    const environ: NodeJS.ProcessEnv = {}
    Object.defineProperty(environ, 'CAPTURE_TOKEN', {
      get() {
        throw new Error('Credential was read')
      },
    })
    const config = loadSyntopicaConfig(data, environ)
    expect(Object.keys(config)).not.toContain('CAPTURE_TOKEN')
    expect(JSON.stringify(config)).not.toContain('Credential was read')
  })
  it('validates file values before environment overrides can hide an invalid runner', () => {
    writeFileSync(join(data, localName), '{"runners":{"grade":"unregistered"}}')
    expect(() =>
      loadSyntopicaConfig(data, { CLIPS_GRADE_RUNNER: 'codex' }),
    ).toThrow()
    rmSync(join(data, localName))
    expect(() => loadSyntopicaConfig(data, { CAPTURE_MIRROR: 'true' })).toThrow(
      'on or off',
    )
  })
  it('rejects shared engine roots including both engines sharing data', () => {
    writeFileSync(
      join(data, localName),
      '{"engines":{"clips":{"path":"../engine-brain"}}}',
    )
    expect(() => loadSyntopicaConfig(data, {})).toThrow('distinct Git roots')
    mkdirSync(join(data, 'schema'))
    copyFileSync(
      join(root, schemaRelative),
      join(data, 'schema/syntopica-config.schema.json'),
    )
    writeFileSync(
      join(data, localName),
      '{"engines":{"brain":{"path":"."},"clips":{"path":"."}},"clips":{"archive":"."}}',
    )
    expect(() => loadSyntopicaConfig(data, {})).toThrow('distinct Git roots')
  })
})
