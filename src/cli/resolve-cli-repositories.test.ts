import { expect, it } from 'vitest'

import { loadSyntopicaConfig } from '../config/load-syntopica-config.ts'
import { makeDoctorFixture } from '../testing/make-doctor-fixture.ts'
import { resolveCliRepositories } from './resolve-cli-repositories.ts'

it('works on the data directory and its declared archive', () => {
  expect(
    resolveCliRepositories({ dataRoot: '/data', archive: '/data/archive' }),
  ).toEqual({ brain: '/data', clips: '/data/archive' })
})

it('uses the resolved roots from a real configuration', () => {
  const fixture = makeDoctorFixture()
  const config = loadSyntopicaConfig(fixture.data, fixture.environ)
  expect(resolveCliRepositories(config)).toEqual({
    brain: config.dataRoot,
    clips: config.archive,
  })
})
