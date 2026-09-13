import { expect, it } from 'vitest'

import { loadSyntopicaConfig } from '../config/load-syntopica-config.ts'
import { makeDoctorFixture } from '../testing/make-doctor-fixture.ts'
import { doctorRepositories } from './doctor-repositories.ts'

it('requires independent data and engine repositories', () => {
  const fixture = makeDoctorFixture()
  const config = loadSyntopicaConfig(fixture.data, fixture.environ)
  expect(doctorRepositories(config).passed).toBe(true)
  expect(
    doctorRepositories({ ...config, brainPath: config.dataRoot }).passed,
  ).toBe(false)
  expect(
    doctorRepositories({
      ...config,
      brainPath: config.dataRoot,
      clipsPath: config.dataRoot,
    }).passed,
  ).toBe(false)
  expect(
    doctorRepositories({ ...config, brainPath: `${config.dataRoot}/brain` })
      .passed,
  ).toBe(false)
})
