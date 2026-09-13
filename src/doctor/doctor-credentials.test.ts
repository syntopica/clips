import { expect, it } from 'vitest'

import { loadSyntopicaConfig } from '../config/load-syntopica-config.ts'
import { makeDoctorFixture } from '../testing/make-doctor-fixture.ts'
import { doctorCredentials } from './doctor-credentials.ts'

it('leaves disabled capture independent of credentials', () => {
  const fixture = makeDoctorFixture()
  const config = loadSyntopicaConfig(fixture.data, fixture.environ)
  expect(doctorCredentials(config, {}).passed).toBe(true)
  expect(doctorCredentials({ ...config, captureMirror: true }, {}).passed).toBe(
    false,
  )
  expect(
    doctorCredentials(
      { ...config, captureOrigin: 'https://capture.example.test' },
      {},
    ).passed,
  ).toBe(false)
})

it('treats empty tokens as absent and returns no token content', () => {
  const fixture = makeDoctorFixture()
  const config = {
    ...loadSyntopicaConfig(fixture.data, fixture.environ),
    captureMirror: true,
  }
  expect(doctorCredentials(config, { CAPTURE_TOKEN: '  ' }).passed).toBe(false)
  const result = doctorCredentials(config, {
    CAPTURE_TOKEN: 'distinctive-doctor-token-never-print-82713',
  })
  expect(result).toEqual({
    passed: true,
    message: 'credentials: CAPTURE_TOKEN present',
  })
})
