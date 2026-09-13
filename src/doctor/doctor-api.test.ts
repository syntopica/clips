import { expect, it } from 'vitest'

import { loadSyntopicaConfig } from '../config/load-syntopica-config.ts'
import { makeDoctorFixture } from '../testing/make-doctor-fixture.ts'
import { doctorApi } from './doctor-api.ts'

it('requires independently supported versions from both engines', () => {
  const fixture = makeDoctorFixture()
  const config = loadSyntopicaConfig(fixture.data, fixture.environ)
  expect(doctorApi(config).passed).toBe(true)
  expect(doctorApi({ ...config, brainApiVersion: 2 }).passed).toBe(false)
  expect(doctorApi({ ...config, clipsApiVersion: 2 }).passed).toBe(false)
})
