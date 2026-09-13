import { expect, it, vi } from 'vitest'

import { loadSyntopicaConfig } from '../config/load-syntopica-config.ts'
import { makeDoctorFixture } from '../testing/make-doctor-fixture.ts'
import { resolveCliRepositories } from './resolve-cli-repositories.ts'

vi.mock('../clips/brain-repository-path.ts', () => ({
  BRAIN_REPOSITORY_PATH: '/data',
}))

const monorepo = {
  dataRoot: '/data',
  archive: '/data',
  brainPath: '/data',
  clipsPath: '/data',
  legacyArchive: '/legacy/archive',
}

it('preserves legacy paths only for implicit selection of the exact gate configuration', () => {
  expect(resolveCliRepositories(monorepo, undefined, {})).toEqual({
    brain: '/data',
    clips: '/legacy/archive',
  })
})

it.each([
  { explicit: '/selected', environ: {} },
  { explicit: undefined, environ: { SYNTOPICA_DATA: '/selected' } },
  { explicit: undefined, environ: { SYNTOPICA_DATA: '' } },
  { explicit: '/selected', environ: { SYNTOPICA_DATA: '/other' } },
])(
  'honors an explicit or environment selection: %j',
  ({ explicit, environ }) => {
    expect(resolveCliRepositories(monorepo, explicit, environ)).toEqual({
      brain: '/data',
      clips: '/data',
    })
  },
)

it.each([
  { ...monorepo, brainPath: '/engine-brain' },
  { ...monorepo, clipsPath: '/engine-clips' },
  { ...monorepo, archive: '/data/archive' },
])('does not apply compatibility when any repository differs: %j', (config) => {
  expect(resolveCliRepositories(config, undefined, {})).toEqual({
    brain: config.dataRoot,
    clips: config.archive,
  })
})

it('uses the resolved roots from a real distinct configuration', () => {
  const fixture = makeDoctorFixture()
  const config = loadSyntopicaConfig(fixture.data, fixture.environ)
  expect(resolveCliRepositories(config, undefined, {})).toEqual({
    brain: config.dataRoot,
    clips: config.archive,
  })
})

it('keeps a different discovered monorepo on its own repositories', () => {
  const other = {
    dataRoot: '/other',
    archive: '/other',
    brainPath: '/other',
    clipsPath: '/other',
    legacyArchive: null,
  }
  expect(resolveCliRepositories(other, undefined, {})).toEqual({
    brain: '/other',
    clips: '/other',
  })
})
