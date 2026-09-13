import { rmSync } from 'node:fs'

import { expect, it } from 'vitest'

import { loadSyntopicaConfig } from '../config/load-syntopica-config.ts'
import { makeDoctorFixture } from '../testing/make-doctor-fixture.ts'
import { doctorPaths } from './doctor-paths.ts'

it('includes optional defaults and project roots in filesystem checks', () => {
  const fixture = makeDoctorFixture()
  const config = loadSyntopicaConfig(fixture.data, fixture.environ)
  expect(doctorPaths(config).passed).toBe(true)
  rmSync(config.newsletterRejectedBookingSenders)
  const check = doctorPaths({
    ...config,
    projectRoots: [`${fixture.parent}/absent`],
  })
  expect(check.passed).toBe(false)
  expect(check.message).toContain('paths: 2 missing (')
  expect(check.message).toContain('newsletter-rejected-booking.json')
  expect(check.message).toContain('absent')
})
